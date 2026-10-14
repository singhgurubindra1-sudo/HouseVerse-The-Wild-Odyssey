import "server-only";
import { buildSeed, DEFAULT_BADGES } from "../seed";
import { HOUSE_SEED, kindForTrack } from "../houses";
import { badgesEarned, positionFor, type BadgeFacts } from "../game";
import type {
  ActivityEntry,
  Badge,
  ForestItem,
  House,
  LoreCard,
  MemberBadge,
  Profile,
  Quest,
  Submission,
  SubmissionView,
  TriviaQuestion,
} from "../types";
import type { Repo, ReviewResult } from "./repo";

/**
 * DEMO MODE storage: all data lives in server memory and starts from the seed
 * data every time the server starts. Perfect for trying Wildlands without any
 * setup; connect Supabase for real, permanent data.
 */
interface Store {
  houses: House[];
  profiles: Profile[];
  quests: Quest[];
  submissions: Submission[];
  items: Omit<ForestItem, "plantedByName" | "plantedByHandle">[];
  badges: Badge[];
  memberBadges: MemberBadge[];
  lore: LoreCard[];
  trivia: TriviaQuestion[];
  activity: Omit<ActivityEntry, "actorName">[];
}

function createStore(): Store {
  const now = Date.now();
  const at = (agoMin: number) => new Date(now - agoMin * 60_000).toISOString();
  const seed = buildSeed();
  return {
    houses: HOUSE_SEED.map((h) => ({ ...h, values: [...h.values], leaders: h.leaders.map((l) => ({ ...l })), totalSeeds: seed.houseSeeds[h.id] ?? 0 })),
    profiles: seed.profiles.map((p) => ({
      id: p.id,
      name: p.name,
      handle: p.handle,
      avatarUrl: null,
      houseId: p.houseId,
      role: p.role,
      totalSeeds: seed.profileSeeds[p.id] ?? 0,
      onboarded: true,
      createdAt: at(p.agoMin),
    })),
    quests: seed.quests.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      track: q.track,
      seeds: q.seeds,
      startsAt: at(q.startsAgoMin),
      endsAt: at(-q.endsInMin),
      houseId: q.houseId,
      active: q.active,
      needsProof: true,
      createdAt: at(q.startsAgoMin),
    })),
    submissions: seed.submissions.map((s) => ({
      id: s.id,
      memberId: s.memberId,
      questId: s.questId,
      houseId: s.houseId,
      proofUrl: s.proofUrl,
      proofText: s.proofText,
      status: s.status,
      reviewedBy: s.reviewedBy,
      note: s.note,
      createdAt: at(s.agoMin),
      reviewedAt: s.reviewedAgoMin === null ? null : at(s.reviewedAgoMin),
    })),
    items: seed.forestItems.map((f) => ({
      id: f.id,
      houseId: f.houseId,
      kind: f.kind,
      x: f.x,
      y: f.y,
      plantedBy: f.plantedBy,
      submissionId: f.submissionId,
      source: f.source,
      label: f.label,
      track: f.track,
      seeds: f.seeds,
      createdAt: at(f.agoMin),
    })),
    badges: DEFAULT_BADGES.map((b) => ({ ...b })),
    memberBadges: seed.memberBadges.map((m) => ({ memberId: m.memberId, badgeId: m.badgeId, earnedAt: at(m.agoMin) })),
    lore: seed.lore.map((l) => ({ ...l })),
    trivia: seed.trivia.map((t) => ({ ...t, options: [...t.options] })),
    activity: seed.activity.map((a) => ({ id: a.id, actorId: a.actorId, action: a.action, details: a.details, houseId: a.houseId, createdAt: at(a.agoMin) })),
  };
}

const globalStore = globalThis as unknown as { __wildlandsStore?: Store };
function db(): Store {
  if (!globalStore.__wildlandsStore) globalStore.__wildlandsStore = createStore();
  return globalStore.__wildlandsStore;
}

const nowIso = () => new Date().toISOString();
const byNewest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);
const clone = <T,>(value: T): T => structuredClone(value);

function requireProfile(id: string): Profile {
  const p = db().profiles.find((x) => x.id === id);
  if (!p) throw new Error("Member not found");
  return p;
}

/** House admins may only manage their own house; super admins manage all. */
function assertAdmin(actorId: string, houseId: string | null) {
  const actor = requireProfile(actorId);
  if (actor.role === "super_admin") return actor;
  if (actor.role === "house_admin" && houseId !== null && actor.houseId === houseId) return actor;
  throw new Error("You do not have permission to do that.");
}

function log(actorId: string | null, action: string, details: string, houseId: string | null) {
  db().activity.push({ id: crypto.randomUUID(), actorId, action, details, houseId, createdAt: nowIso() });
}

function factsFor(memberId: string): BadgeFacts {
  const s = db();
  const profile = requireProfile(memberId);
  const approved = s.submissions.filter((x) => x.memberId === memberId && x.status === "approved");
  const approvedByTrack = { tech: 0, sports: 0, culture: 0 };
  for (const sub of approved) {
    const quest = s.quests.find((q) => q.id === sub.questId);
    if (quest) approvedByTrack[quest.track]++;
  }
  return { onboarded: profile.onboarded, approvedByTrack, approvedDates: approved.map((x) => x.createdAt) };
}

function awardEarnedBadges(memberId: string): string[] {
  const s = db();
  const have = new Set(s.memberBadges.filter((m) => m.memberId === memberId).map((m) => m.badgeId));
  const fresh = badgesEarned(s.badges, factsFor(memberId)).filter((b) => !have.has(b.id));
  for (const b of fresh) s.memberBadges.push({ memberId, badgeId: b.id, earnedAt: nowIso() });
  return fresh.map((b) => b.name);
}

function view(sub: Submission): SubmissionView {
  const s = db();
  const member = s.profiles.find((p) => p.id === sub.memberId);
  const quest = s.quests.find((q) => q.id === sub.questId);
  return {
    ...sub,
    memberName: member?.name ?? "Unknown",
    memberHandle: member?.handle ?? "",
    questTitle: quest?.title ?? "Deleted quest",
    questTrack: quest?.track ?? "culture",
    questSeeds: quest?.seeds ?? 0,
  };
}

export const memoryRepo: Repo & {
  createDemoMember(name: string, houseId: string): Promise<Profile>;
} = {
  mode: "demo",

  async listHouses() {
    return clone(db().houses);
  },
  async getHouse(id) {
    return clone(db().houses.find((h) => h.id === id) ?? null);
  },
  async listForestItems(opts = {}) {
    const s = db();
    return s.items
      .filter((i) => (!opts.houseId || i.houseId === opts.houseId) && (!opts.plantedBy || i.plantedBy === opts.plantedBy))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((i) => {
        const p = s.profiles.find((x) => x.id === i.plantedBy);
        return { ...i, plantedByName: p?.name ?? null, plantedByHandle: p?.handle ?? null };
      });
  },
  async lastApprovedByHouse() {
    const result: Record<string, string | null> = {};
    for (const h of db().houses) result[h.id] = null;
    for (const i of db().items) {
      if (i.source !== "quest") continue;
      if (!result[i.houseId] || i.createdAt > result[i.houseId]!) result[i.houseId] = i.createdAt;
    }
    return result;
  },
  async getStats() {
    const s = db();
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const thisWeek = s.items.filter((i) => i.createdAt >= weekAgo);
    const perHouse: Record<string, number> = {};
    for (const i of thisWeek) perHouse[i.houseId] = (perHouse[i.houseId] ?? 0) + 1;
    const mostActive = Object.entries(perHouse).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return {
      treesThisWeek: thisWeek.length,
      questsCompleted: s.items.filter((i) => i.source === "quest").length,
      mostActiveHouseId: mostActive,
      members: s.profiles.filter((p) => p.houseId).length,
    };
  },

  async listProfiles(opts = {}) {
    const q = opts.search?.trim().toLowerCase();
    return clone(
      db()
        .profiles.filter((p) => (!opts.houseId || p.houseId === opts.houseId) && (!q || p.name.toLowerCase().includes(q) || p.handle.includes(q)))
        .sort((a, b) => b.totalSeeds - a.totalSeeds),
    );
  },
  async getProfile(id) {
    return clone(db().profiles.find((p) => p.id === id) ?? null);
  },
  async getProfileByHandle(handle) {
    return clone(db().profiles.find((p) => p.handle === handle) ?? null);
  },

  async listQuests(opts = {}) {
    return clone(
      db()
        .quests.filter(
          (q) =>
            (opts.includeInactive || q.active) &&
            (opts.houseId === undefined || q.houseId === null || q.houseId === opts.houseId),
        )
        .sort(byNewest),
    );
  },
  async getQuest(id) {
    return clone(db().quests.find((q) => q.id === id) ?? null);
  },
  async questCompletions() {
    const counts: Record<string, number> = {};
    for (const s of db().submissions) if (s.status === "approved") counts[s.questId] = (counts[s.questId] ?? 0) + 1;
    return counts;
  },

  async listSubmissions(opts) {
    const list = db()
      .submissions.filter(
        (s) =>
          (!opts.memberId || s.memberId === opts.memberId) &&
          (!opts.houseId || s.houseId === opts.houseId) &&
          (!opts.status || s.status === opts.status),
      )
      .sort(opts.status === "pending" ? (a, b) => a.createdAt.localeCompare(b.createdAt) : byNewest)
      .slice(0, opts.limit ?? 500);
    return clone(list.map(view));
  },

  async listBadges() {
    return clone(db().badges);
  },
  async listMemberBadges(memberId) {
    return clone(db().memberBadges.filter((m) => m.memberId === memberId).sort((a, b) => a.earnedAt.localeCompare(b.earnedAt)));
  },

  async listLoreCards(houseId) {
    return clone(db().lore.filter((l) => l.houseId === houseId).sort((a, b) => a.position - b.position));
  },
  async listTrivia(houseId) {
    return clone(db().trivia.filter((t) => t.houseId === houseId).sort((a, b) => a.position - b.position));
  },

  async listActivity(opts) {
    const s = db();
    return s.activity
      .filter((a) => !opts.houseId || a.houseId === opts.houseId)
      .sort(byNewest)
      .slice(0, opts.limit ?? 100)
      .map((a) => ({ ...a, actorName: s.profiles.find((p) => p.id === a.actorId)?.name ?? null }));
  },
  async lastSubmissionByMember() {
    const result: Record<string, string> = {};
    for (const s of db().submissions) if (!result[s.memberId] || s.createdAt > result[s.memberId]) result[s.memberId] = s.createdAt;
    return result;
  },

  /* ---------------- writes ---------------- */

  async createDemoMember(name, houseId) {
    const s = db();
    if (!s.houses.some((h) => h.id === houseId)) throw new Error("Unknown house");
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || "ranger";
    let handle = base;
    let n = 2;
    while (s.profiles.some((p) => p.handle === handle)) handle = `${base}${n++}`;
    const profile: Profile = {
      id: crypto.randomUUID(),
      name,
      handle,
      avatarUrl: null,
      houseId,
      role: "member",
      totalSeeds: 0,
      onboarded: false,
      createdAt: nowIso(),
    };
    s.profiles.push(profile);
    return clone(profile);
  },

  async chooseHouse(userId, houseId) {
    const p = requireProfile(userId);
    if (!db().houses.some((h) => h.id === houseId)) throw new Error("Unknown house");
    if (p.houseId) throw new Error("You have already picked a house.");
    p.houseId = houseId;
  },

  async updateOwnProfile(userId, input) {
    const p = requireProfile(userId);
    p.name = input.name;
    p.avatarUrl = input.avatarUrl;
  },

  async completeOnboarding(userId) {
    const p = requireProfile(userId);
    if (p.onboarded || !p.houseId) return;
    p.onboarded = true;
    db().items.push({
      id: crypto.randomUUID(),
      houseId: p.houseId,
      kind: "seedling",
      ...positionFor(`onboard:${p.id}`),
      plantedBy: p.id,
      submissionId: null,
      source: "onboarding",
      label: "finishing Ranger Onboarding",
      track: null,
      seeds: 0,
      createdAt: nowIso(),
    });
    awardEarnedBadges(userId);
    log(userId, "onboarded", `${p.name} finished Ranger Onboarding and planted a first seed`, p.houseId);
  },

  async submitProof(userId, questId, proof) {
    const s = db();
    const p = requireProfile(userId);
    const quest = s.quests.find((q) => q.id === questId);
    if (!quest || !quest.active) throw new Error("This quest is not open.");
    if (!p.houseId) throw new Error("Pick a house first.");
    if (quest.houseId && quest.houseId !== p.houseId) throw new Error("This quest is for another house.");
    if (s.submissions.some((x) => x.memberId === userId && x.questId === questId && x.status !== "rejected")) {
      throw new Error("You have already submitted this quest.");
    }
    let url = proof.url;
    if (proof.file && proof.file.size > 0) {
      // Demo mode keeps the photo in memory as a data URL.
      const bytes = Buffer.from(await proof.file.arrayBuffer());
      url = `data:${proof.file.type || "image/jpeg"};base64,${bytes.toString("base64")}`;
    }
    s.submissions.push({
      id: crypto.randomUUID(),
      memberId: userId,
      questId,
      houseId: p.houseId,
      proofUrl: url,
      proofText: proof.text,
      status: "pending",
      reviewedBy: null,
      note: null,
      createdAt: nowIso(),
      reviewedAt: null,
    });
  },

  // Runs synchronously (no awaits between steps), so the five steps cannot interleave with another request.
  async reviewSubmissions(actorId, ids, decision, note) {
    const s = db();
    const result: ReviewResult = { approved: 0, rejected: 0, newBadges: [] };
    for (const id of ids) {
      const sub = s.submissions.find((x) => x.id === id);
      if (!sub || sub.status !== "pending") continue;
      assertAdmin(actorId, sub.houseId);
      const quest = s.quests.find((q) => q.id === sub.questId);
      const member = requireProfile(sub.memberId);
      sub.status = decision;
      sub.reviewedBy = actorId;
      sub.reviewedAt = nowIso();
      sub.note = note;
      if (decision === "approved" && quest) {
        member.totalSeeds += quest.seeds;
        const house = s.houses.find((h) => h.id === sub.houseId);
        if (house) house.totalSeeds += quest.seeds;
        s.items.push({
          id: crypto.randomUUID(),
          houseId: sub.houseId,
          kind: kindForTrack(sub.houseId, quest.track),
          ...positionFor(`item:${sub.id}`),
          plantedBy: member.id,
          submissionId: sub.id,
          source: "quest",
          label: quest.title,
          track: quest.track,
          seeds: quest.seeds,
          createdAt: nowIso(),
        });
        result.newBadges.push(...awardEarnedBadges(member.id).map((b) => `${member.name}: ${b}`));
        result.approved++;
      } else {
        result.rejected++;
      }
      log(actorId, decision, `${decision === "approved" ? "Approved" : "Rejected"} "${quest?.title}" for ${member.name}${note ? ` (note: ${note})` : ""}`, sub.houseId);
    }
    return result;
  },

  async saveQuest(actorId, id, input) {
    const s = db();
    if (id) {
      const quest = s.quests.find((q) => q.id === id);
      if (!quest) throw new Error("Quest not found");
      assertAdmin(actorId, quest.houseId);
      assertAdmin(actorId, input.houseId);
      Object.assign(quest, input);
      log(actorId, "quest_updated", `Updated quest "${input.title}"`, input.houseId);
      return id;
    }
    assertAdmin(actorId, input.houseId);
    const quest: Quest = { id: crypto.randomUUID(), createdAt: nowIso(), ...input };
    s.quests.push(quest);
    log(actorId, "quest_created", `Created quest "${input.title}" (+${input.seeds} Seeds)`, input.houseId);
    return quest.id;
  },
  async deleteQuest(actorId, id) {
    const s = db();
    const quest = s.quests.find((q) => q.id === id);
    if (!quest) return;
    assertAdmin(actorId, quest.houseId);
    s.quests = s.quests.filter((q) => q.id !== id);
    s.submissions = s.submissions.filter((x) => x.questId !== id || x.status === "approved");
    log(actorId, "quest_deleted", `Deleted quest "${quest.title}"`, quest.houseId);
  },

  async createBadge(actorId, input) {
    assertAdmin(actorId, null);
    const s = db();
    let id = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "badge";
    while (s.badges.some((b) => b.id === id)) id += "-2";
    s.badges.push({ id, ...input });
    log(actorId, "badge_created", `Created badge ${input.icon} ${input.name}`, null);
    for (const p of s.profiles) awardEarnedBadges(p.id);
  },
  async awardBadge(actorId, memberId, badgeId) {
    const s = db();
    const member = requireProfile(memberId);
    assertAdmin(actorId, member.houseId);
    const badge = s.badges.find((b) => b.id === badgeId);
    if (!badge) throw new Error("Badge not found");
    if (s.memberBadges.some((m) => m.memberId === memberId && m.badgeId === badgeId)) return;
    s.memberBadges.push({ memberId, badgeId, earnedAt: nowIso() });
    log(actorId, "badge_awarded", `Awarded ${badge.icon} ${badge.name} to ${member.name}`, member.houseId);
  },

  async updateHouseLore(actorId, houseId, input) {
    assertAdmin(actorId, houseId);
    const house = db().houses.find((h) => h.id === houseId);
    if (!house) throw new Error("House not found");
    Object.assign(house, input);
    log(actorId, "lore_updated", `Updated ${house.name} house lore`, houseId);
  },
  async saveLoreCard(actorId, houseId, id, input) {
    assertAdmin(actorId, houseId);
    const s = db();
    if (id) {
      const card = s.lore.find((l) => l.id === id && l.houseId === houseId);
      if (!card) throw new Error("Card not found");
      Object.assign(card, input);
    } else {
      s.lore.push({ id: crypto.randomUUID(), houseId, ...input });
    }
    log(actorId, "lore_updated", `Saved story card "${input.title}"`, houseId);
  },
  async deleteLoreCard(actorId, id) {
    const s = db();
    const card = s.lore.find((l) => l.id === id);
    if (!card) return;
    assertAdmin(actorId, card.houseId);
    s.lore = s.lore.filter((l) => l.id !== id);
    log(actorId, "lore_updated", `Deleted story card "${card.title}"`, card.houseId);
  },
  async saveTrivia(actorId, houseId, id, input) {
    assertAdmin(actorId, houseId);
    const s = db();
    if (id) {
      const t = s.trivia.find((x) => x.id === id && x.houseId === houseId);
      if (!t) throw new Error("Question not found");
      Object.assign(t, input);
    } else {
      s.trivia.push({ id: crypto.randomUUID(), houseId, ...input });
    }
    log(actorId, "trivia_updated", `Saved trivia question "${input.question}"`, houseId);
  },
  async deleteTrivia(actorId, id) {
    const s = db();
    const t = s.trivia.find((x) => x.id === id);
    if (!t) return;
    assertAdmin(actorId, t.houseId);
    s.trivia = s.trivia.filter((x) => x.id !== id);
    log(actorId, "trivia_updated", `Deleted trivia question "${t.question}"`, t.houseId);
  },

  async awardBonus(actorId, memberId, seeds, reason) {
    const member = requireProfile(memberId);
    assertAdmin(actorId, member.houseId);
    member.totalSeeds += seeds;
    const house = db().houses.find((h) => h.id === member.houseId);
    if (house) house.totalSeeds += seeds;
    log(actorId, "bonus", `Gave ${seeds} bonus Seeds to ${member.name}: ${reason}`, member.houseId);
  },
  async setRole(actorId, memberId, role) {
    const actor = requireProfile(actorId);
    if (actor.role !== "super_admin") throw new Error("Only super admins can change roles.");
    const member = requireProfile(memberId);
    member.role = role;
    log(actorId, "role_changed", `Changed ${member.name}'s role to ${role.replace("_", " ")}`, member.houseId);
  },
};
