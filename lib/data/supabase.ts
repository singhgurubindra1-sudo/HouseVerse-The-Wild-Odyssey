import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "../supabase/server";
import type {
  ActivityEntry,
  Badge,
  ForestItem,
  House,
  LoreCard,
  MemberBadge,
  Profile,
  Quest,
  SubmissionView,
  TriviaQuestion,
} from "../types";
import type { Repo } from "./repo";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

const toHouse = (r: Row): House => ({
  id: r.id,
  name: r.name,
  place: r.place,
  region: r.region,
  landscape: r.landscape,
  legendary: r.legendary,
  legendaryEmoji: r.legendary_emoji,
  mascot: r.mascot,
  mascotEmoji: r.mascot_emoji,
  motto: r.motto,
  lore: r.lore,
  values: r.values ?? [],
  leaders: r.leaders ?? [],
  colorPrimary: r.color_primary,
  colorAccent: r.color_accent,
  totalSeeds: r.total_seeds,
});

const toProfile = (r: Row): Profile => ({
  id: r.id,
  name: r.name,
  handle: r.handle,
  avatarUrl: r.avatar_url,
  houseId: r.house_id,
  role: r.role,
  totalSeeds: r.total_seeds,
  onboarded: r.onboarded,
  createdAt: r.created_at,
});

const toQuest = (r: Row): Quest => ({
  id: r.id,
  title: r.title,
  description: r.description,
  track: r.track,
  seeds: r.seeds,
  startsAt: r.starts_at,
  endsAt: r.ends_at,
  houseId: r.house_id,
  active: r.active,
  needsProof: r.needs_proof,
  createdAt: r.created_at,
});

const toItem = (r: Row): ForestItem => ({
  id: r.id,
  houseId: r.house_id,
  kind: r.kind,
  x: r.x,
  y: r.y,
  plantedBy: r.planted_by,
  plantedByName: r.planter?.name ?? null,
  plantedByHandle: r.planter?.handle ?? null,
  submissionId: r.submission_id,
  source: r.source,
  label: r.label,
  track: r.track,
  seeds: r.seeds,
  createdAt: r.created_at,
});

const toSubmission = (r: Row): SubmissionView => ({
  id: r.id,
  memberId: r.member_id,
  questId: r.quest_id,
  houseId: r.house_id,
  proofUrl: r.proof_url,
  proofText: r.proof_text,
  status: r.status,
  reviewedBy: r.reviewed_by,
  note: r.note,
  createdAt: r.created_at,
  reviewedAt: r.reviewed_at,
  memberName: r.member?.name ?? "Unknown",
  memberHandle: r.member?.handle ?? "",
  questTitle: r.quest?.title ?? "Deleted quest",
  questTrack: r.quest?.track ?? "culture",
  questSeeds: r.quest?.seeds ?? 0,
});

/** Supabase-backed storage. Runs as the logged-in user, so every query is filtered by Row Level Security. */
export async function supabaseRepo(): Promise<Repo> {
  const sb: SupabaseClient = await createClient();

  async function logAction(actorId: string, action: string, details: string, houseId: string | null) {
    check(await sb.from("activity_log").insert({ actor_id: actorId, action, details, house_id: houseId }));
  }

  return {
    mode: "supabase",

    async listHouses() {
      return check(await sb.from("houses").select("*").order("name")).map(toHouse);
    },
    async getHouse(id) {
      const row = check(await sb.from("houses").select("*").eq("id", id).maybeSingle());
      return row ? toHouse(row) : null;
    },
    async listForestItems(opts = {}) {
      let query = sb.from("forest_items").select("*, planter:profiles!forest_items_planted_by_fkey(name, handle)").order("created_at");
      if (opts.houseId) query = query.eq("house_id", opts.houseId);
      if (opts.plantedBy) query = query.eq("planted_by", opts.plantedBy);
      return check(await query.limit(2000)).map(toItem);
    },
    async lastApprovedByHouse() {
      const rows = check(await sb.from("house_last_growth").select("house_id, last_at")) as Row[];
      const houses = check(await sb.from("houses").select("id")) as Row[];
      const result: Record<string, string | null> = {};
      for (const h of houses) result[h.id] = null;
      for (const r of rows) result[r.house_id] = r.last_at;
      return result;
    },
    async getStats() {
      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
      const recent = check(await sb.from("forest_items").select("house_id").gte("created_at", weekAgo)) as Row[];
      const completed = await sb.from("forest_items").select("id", { count: "exact", head: true }).eq("source", "quest");
      const members = await sb.from("profiles").select("id", { count: "exact", head: true }).not("house_id", "is", null);
      const perHouse: Record<string, number> = {};
      for (const r of recent) perHouse[r.house_id] = (perHouse[r.house_id] ?? 0) + 1;
      return {
        treesThisWeek: recent.length,
        questsCompleted: completed.count ?? 0,
        mostActiveHouseId: Object.entries(perHouse).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
        members: members.count ?? 0,
      };
    },

    async listProfiles(opts = {}) {
      let query = sb.from("profiles").select("*").order("total_seeds", { ascending: false });
      if (opts.houseId) query = query.eq("house_id", opts.houseId);
      const search = opts.search?.trim().replace(/[%,()]/g, "");
      if (search) query = query.or(`name.ilike.%${search}%,handle.ilike.%${search}%`);
      return check(await query.limit(1000)).map(toProfile);
    },
    async getProfile(id) {
      const row = check(await sb.from("profiles").select("*").eq("id", id).maybeSingle());
      return row ? toProfile(row) : null;
    },
    async getProfileByHandle(handle) {
      const row = check(await sb.from("profiles").select("*").eq("handle", handle).maybeSingle());
      return row ? toProfile(row) : null;
    },

    async listQuests(opts = {}) {
      let query = sb.from("quests").select("*").order("created_at", { ascending: false });
      if (!opts.includeInactive) query = query.eq("active", true);
      if (opts.houseId !== undefined) {
        query = opts.houseId ? query.or(`house_id.is.null,house_id.eq.${opts.houseId}`) : query.is("house_id", null);
      }
      return check(await query).map(toQuest);
    },
    async getQuest(id) {
      const row = check(await sb.from("quests").select("*").eq("id", id).maybeSingle());
      return row ? toQuest(row) : null;
    },
    async questCompletions() {
      const rows = check(await sb.from("quest_completions").select("*")) as Row[];
      return Object.fromEntries(rows.map((r) => [r.quest_id, r.completions]));
    },

    async listSubmissions(opts) {
      let query = sb
        .from("submissions")
        .select("*, member:profiles!submissions_member_id_fkey(name, handle), quest:quests(title, track, seeds)")
        .order("created_at", { ascending: opts.status === "pending" });
      if (opts.memberId) query = query.eq("member_id", opts.memberId);
      if (opts.houseId) query = query.eq("house_id", opts.houseId);
      if (opts.status) query = query.eq("status", opts.status);
      return check(await query.limit(opts.limit ?? 500)).map(toSubmission);
    },

    async listBadges() {
      return check(await sb.from("badges").select("*").order("name")) as Badge[];
    },
    async listMemberBadges(memberId) {
      const rows = check(await sb.from("member_badges").select("*").eq("member_id", memberId).order("earned_at")) as Row[];
      return rows.map((r): MemberBadge => ({ memberId: r.member_id, badgeId: r.badge_id, earnedAt: r.earned_at }));
    },

    async listLoreCards(houseId) {
      const rows = check(await sb.from("lore_cards").select("*").eq("house_id", houseId).order("position")) as Row[];
      return rows.map((r): LoreCard => ({ id: r.id, houseId: r.house_id, position: r.position, title: r.title, body: r.body, emoji: r.emoji }));
    },
    async listTrivia(houseId) {
      const rows = check(await sb.from("trivia_questions").select("*").eq("house_id", houseId).order("position")) as Row[];
      return rows.map(
        (r): TriviaQuestion => ({ id: r.id, houseId: r.house_id, position: r.position, question: r.question, options: r.options, answerIndex: r.answer_index }),
      );
    },

    async listActivity(opts) {
      let query = sb
        .from("activity_log")
        .select("*, actor:profiles!activity_log_actor_id_fkey(name)")
        .order("created_at", { ascending: false })
        .limit(opts.limit ?? 100);
      if (opts.houseId) query = query.eq("house_id", opts.houseId);
      const rows = check(await query) as Row[];
      return rows.map(
        (r): ActivityEntry => ({
          id: r.id,
          actorId: r.actor_id,
          actorName: r.actor?.name ?? null,
          action: r.action,
          details: r.details,
          houseId: r.house_id,
          createdAt: r.created_at,
        }),
      );
    },
    async lastSubmissionByMember() {
      const rows = check(await sb.from("submissions").select("member_id, created_at").order("created_at").limit(5000)) as Row[];
      const result: Record<string, string> = {};
      for (const r of rows) result[r.member_id] = r.created_at;
      return result;
    },

    /* ---------------- writes ---------------- */

    async chooseHouse(_userId, houseId) {
      check(await sb.rpc("choose_house", { p_house: houseId }));
    },
    async updateOwnProfile(userId, input) {
      check(await sb.from("profiles").update({ name: input.name, avatar_url: input.avatarUrl }).eq("id", userId));
    },
    async completeOnboarding() {
      check(await sb.rpc("complete_onboarding"));
    },
    async submitProof(userId, questId, proof) {
      const me = check(await sb.from("profiles").select("house_id").eq("id", userId).single()) as Row;
      let url = proof.url;
      if (proof.file && proof.file.size > 0) {
        const ext = (proof.file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const upload = await sb.storage.from("proofs").upload(path, proof.file, { contentType: proof.file.type || "image/jpeg" });
        if (upload.error) throw new Error(upload.error.message);
        url = sb.storage.from("proofs").getPublicUrl(path).data.publicUrl;
      }
      const res = await sb.from("submissions").insert({
        member_id: userId,
        quest_id: questId,
        house_id: me.house_id,
        proof_url: url,
        proof_text: proof.text,
      });
      if (res.error?.code === "23505") throw new Error("You have already submitted this quest.");
      check(res);
    },
    async reviewSubmissions(_actorId, ids, decision, note) {
      const data = check(await sb.rpc("review_submissions", { p_ids: ids, p_decision: decision, p_note: note })) as Row;
      return { approved: data.approved, rejected: data.rejected, newBadges: data.new_badges ?? [] };
    },

    async saveQuest(actorId, id, input) {
      const row = {
        title: input.title,
        description: input.description,
        track: input.track,
        seeds: input.seeds,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        house_id: input.houseId,
        active: input.active,
        needs_proof: input.needsProof,
      };
      if (id) {
        const updated = check(await sb.from("quests").update(row).eq("id", id).select("id")) as Row[];
        if (!updated.length) throw new Error("You do not have permission to edit this quest.");
        await logAction(actorId, "quest_updated", `Updated quest "${input.title}"`, input.houseId);
        return id;
      }
      const created = check(await sb.from("quests").insert(row).select("id").single()) as Row;
      await logAction(actorId, "quest_created", `Created quest "${input.title}" (+${input.seeds} Seeds)`, input.houseId);
      return created.id;
    },
    async deleteQuest(actorId, id) {
      const quest = check(await sb.from("quests").select("title, house_id").eq("id", id).maybeSingle()) as Row | null;
      if (!quest) return;
      const deleted = check(await sb.from("quests").delete().eq("id", id).select("id")) as Row[];
      if (!deleted.length) throw new Error("You do not have permission to delete this quest.");
      await logAction(actorId, "quest_deleted", `Deleted quest "${quest.title}"`, quest.house_id);
    },

    async createBadge(actorId, input) {
      let id = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "badge";
      const existing = check(await sb.from("badges").select("id").like("id", `${id}%`)) as Row[];
      if (existing.some((b) => b.id === id)) id = `${id}-${existing.length + 1}`;
      check(await sb.from("badges").insert({ id, name: input.name, icon: input.icon, description: input.description, rule: input.rule }));
      await logAction(actorId, "badge_created", `Created badge ${input.icon} ${input.name}`, null);
    },
    async awardBadge(_actorId, memberId, badgeId) {
      check(await sb.rpc("award_badge", { p_member: memberId, p_badge: badgeId }));
    },

    async updateHouseLore(actorId, houseId, input) {
      const updated = check(
        await sb
          .from("houses")
          .update({
            mascot: input.mascot,
            mascot_emoji: input.mascotEmoji,
            motto: input.motto,
            lore: input.lore,
            values: input.values,
            leaders: input.leaders,
            color_primary: input.colorPrimary,
            color_accent: input.colorAccent,
          })
          .eq("id", houseId)
          .select("name"),
      ) as Row[];
      if (!updated.length) throw new Error("You do not have permission to edit this house.");
      await logAction(actorId, "lore_updated", `Updated ${updated[0].name} house lore`, houseId);
    },
    async saveLoreCard(actorId, houseId, id, input) {
      if (id) check(await sb.from("lore_cards").update(input).eq("id", id).eq("house_id", houseId));
      else check(await sb.from("lore_cards").insert({ ...input, house_id: houseId }));
      await logAction(actorId, "lore_updated", `Saved story card "${input.title}"`, houseId);
    },
    async deleteLoreCard(actorId, id) {
      const deleted = check(await sb.from("lore_cards").delete().eq("id", id).select("title, house_id")) as Row[];
      if (deleted[0]) await logAction(actorId, "lore_updated", `Deleted story card "${deleted[0].title}"`, deleted[0].house_id);
    },
    async saveTrivia(actorId, houseId, id, input) {
      const row = { question: input.question, options: input.options, answer_index: input.answerIndex, position: input.position };
      if (id) check(await sb.from("trivia_questions").update(row).eq("id", id).eq("house_id", houseId));
      else check(await sb.from("trivia_questions").insert({ ...row, house_id: houseId }));
      await logAction(actorId, "trivia_updated", `Saved trivia question "${input.question}"`, houseId);
    },
    async deleteTrivia(actorId, id) {
      const deleted = check(await sb.from("trivia_questions").delete().eq("id", id).select("question, house_id")) as Row[];
      if (deleted[0]) await logAction(actorId, "trivia_updated", `Deleted trivia question "${deleted[0].question}"`, deleted[0].house_id);
    },

    async awardBonus(_actorId, memberId, seeds, reason) {
      check(await sb.rpc("award_bonus", { p_member: memberId, p_seeds: seeds, p_reason: reason }));
    },
    async setRole(_actorId, memberId, role) {
      check(await sb.rpc("set_member_role", { p_member: memberId, p_role: role }));
    },
  };
}
