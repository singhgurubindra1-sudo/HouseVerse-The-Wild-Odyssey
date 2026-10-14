"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canManageHouse, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { TRACKS, type BadgeRule, type Role, type Track } from "@/lib/types";
import type { ActionState } from "./types";

const fail = (message: string): ActionState => ({ ok: false, message });
const str = (form: FormData, key: string, max = 2000) => String(form.get(key) ?? "").trim().slice(0, max);

function refresh() {
  // Admin changes show up on every page (forests, quests, profiles).
  revalidatePath("/", "layout");
}

async function run(work: () => Promise<string>): Promise<ActionState> {
  try {
    const message = await work();
    refresh();
    return { ok: true, message };
  } catch (e) {
    return fail((e as Error).message || "Something went wrong.");
  }
}

/* ---------- Approval queue ---------- */

export async function reviewSubmissions(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const ids = form.getAll("ids").map(String).filter(Boolean);
  const decision = form.get("decision") === "rejected" ? "rejected" : "approved";
  const note = str(form, "note", 300) || null;
  if (!ids.length) return fail("Tick at least one submission first.");
  const result = await run(async () => {
    const repo = await getRepo();
    const result = await repo.reviewSubmissions(admin.id, ids, decision, note);
    const parts = [];
    if (result.approved) parts.push(`Approved ${result.approved}: ${result.approved === 1 ? "a tree has" : "trees have"} sprouted 🌱`);
    if (result.rejected) parts.push(`Rejected ${result.rejected}`);
    if (result.newBadges.length) parts.push(`New badges: ${result.newBadges.join(", ")}`);
    return parts.join(". ") || "Nothing changed: those submissions were already reviewed.";
  });
  // The reviewed cards leave the queue, so show the result at the top of the page.
  if (result.ok) redirect(`/admin/approvals?done=${encodeURIComponent(result.message)}`);
  return result;
}

/* ---------- Quests ---------- */

export async function saveQuest(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = str(form, "id") || null;
  const title = str(form, "title", 120);
  const track = str(form, "track") as Track;
  const seeds = Number(form.get("seeds"));
  let houseId: string | null = str(form, "houseId") || null;
  if (admin.role === "house_admin") houseId = admin.houseId;
  const startsAt = str(form, "startsAt");
  const endsAt = str(form, "endsAt");

  if (title.length < 3) return fail("Give the quest a title (at least 3 letters).");
  if (!TRACKS.includes(track)) return fail("Pick a track: Tech, Sports or Culture.");
  if (!Number.isInteger(seeds) || seeds < 1 || seeds > 1000) return fail("Seeds must be a whole number between 1 and 1000.");
  if (startsAt && endsAt && endsAt < startsAt) return fail("The end date must be after the start date.");
  if (!canManageHouse(admin, houseId)) return fail("You can only create quests for your own house.");

  return run(async () => {
    const repo = await getRepo();
    await repo.saveQuest(admin.id, id, {
      title,
      description: str(form, "description"),
      track,
      seeds,
      houseId,
      startsAt: startsAt ? new Date(`${startsAt}T00:00:00`).toISOString() : null,
      endsAt: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : null,
      active: form.get("active") === "on",
      needsProof: form.get("needsProof") === "on",
    });
    return id ? `Saved "${title}".` : `Created "${title}" (+${seeds} Seeds). Members can see it now.`;
  });
}

export async function setQuestActive(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const repo = await getRepo();
  const quest = await repo.getQuest(str(form, "id"));
  if (!quest) return fail("Quest not found.");
  const active = form.get("active") === "true";
  return run(async () => {
    const { id, createdAt: _createdAt, ...rest } = quest;
    await repo.saveQuest(admin.id, id, { ...rest, active });
    return active ? `"${quest.title}" is live again.` : `"${quest.title}" is paused.`;
  });
}

export async function deleteQuest(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  return run(async () => {
    const repo = await getRepo();
    await repo.deleteQuest(admin.id, str(form, "id"));
    return "Quest deleted. Trees already planted for it stay in the forest.";
  });
}

/* ---------- Badges ---------- */

export async function createBadge(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin") return fail("Only super admins can create badges.");
  const name = str(form, "name", 40);
  const icon = str(form, "icon", 8) || "🏅";
  const description = str(form, "description", 120);
  const type = str(form, "ruleType");
  const count = Math.max(1, Math.min(100, Number(form.get("count")) || 1));
  const track = str(form, "track") as Track;
  let rule: BadgeRule;
  switch (type) {
    case "quests_total":
    case "streak_weeks":
      rule = { type, count };
      break;
    case "track_count":
      if (!TRACKS.includes(track)) return fail("Pick a track for this rule.");
      rule = { type, track, count };
      break;
    case "all_tracks":
    case "onboarding":
      rule = { type };
      break;
    default:
      rule = { type: "manual" };
  }
  if (name.length < 2) return fail("Give the badge a name.");
  return run(async () => {
    const repo = await getRepo();
    await repo.createBadge(admin.id, { name, icon, description, rule });
    return `Created badge ${icon} ${name}.`;
  });
}

export async function awardBadge(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  return run(async () => {
    const repo = await getRepo();
    await repo.awardBadge(admin.id, str(form, "memberId"), str(form, "badgeId"));
    return "Badge awarded 🎉";
  });
}

/* ---------- House lore ---------- */

export async function updateHouseLore(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const houseId = str(form, "houseId");
  if (!canManageHouse(admin, houseId)) return fail("You can only edit your own house.");
  const values = str(form, "values").split("\n").map((v) => v.trim()).filter(Boolean).slice(0, 8);
  const leaders = str(form, "leaders")
    .split("\n")
    .map((line) => line.split("|").map((p) => p.trim()))
    .filter(([name]) => name)
    .slice(0, 8)
    .map(([name, role]) => ({ name, role: role ?? "" }));
  const color = (v: string, fallback: string) => (/^#[0-9a-f]{6}$/i.test(v) ? v : fallback);
  return run(async () => {
    const repo = await getRepo();
    await repo.updateHouseLore(admin.id, houseId, {
      mascot: str(form, "mascot", 60),
      mascotEmoji: str(form, "mascotEmoji", 8) || "🐾",
      motto: str(form, "motto", 120),
      lore: str(form, "lore", 1500),
      values,
      leaders,
      colorPrimary: color(str(form, "colorPrimary"), "#2f6b3f"),
      colorAccent: color(str(form, "colorAccent"), "#e3a72f"),
    });
    return "House lore saved. New members will see it in onboarding.";
  });
}

export async function saveLoreCard(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const houseId = str(form, "houseId");
  if (!canManageHouse(admin, houseId)) return fail("You can only edit your own house.");
  const title = str(form, "title", 80);
  if (!title) return fail("Story cards need a title.");
  return run(async () => {
    const repo = await getRepo();
    await repo.saveLoreCard(admin.id, houseId, str(form, "id") || null, {
      title,
      body: str(form, "body", 1000),
      emoji: str(form, "emoji", 8) || "🌿",
      position: Number(form.get("position")) || 1,
    });
    return `Saved story card "${title}".`;
  });
}

export async function deleteLoreCard(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  return run(async () => {
    const repo = await getRepo();
    await repo.deleteLoreCard(admin.id, str(form, "id"));
    return "Story card deleted.";
  });
}

export async function saveTrivia(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const houseId = str(form, "houseId");
  if (!canManageHouse(admin, houseId)) return fail("You can only edit your own house.");
  const question = str(form, "question", 200);
  const raw = [0, 1, 2, 3].map((i) => str(form, `option${i}`, 120));
  const correct = raw[Number(form.get("answerIndex"))];
  const options = raw.filter(Boolean);
  const answerIndex = correct ? options.indexOf(correct) : -1;
  if (!question) return fail("Type the question.");
  if (options.length < 2) return fail("Give at least two answer options.");
  if (answerIndex < 0) return fail("Tick the correct option (it can't be an empty one).");
  return run(async () => {
    const repo = await getRepo();
    await repo.saveTrivia(admin.id, houseId, str(form, "id") || null, { question, options, answerIndex, position: Number(form.get("position")) || 1 });
    return "Trivia question saved.";
  });
}

export async function deleteTrivia(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  return run(async () => {
    const repo = await getRepo();
    await repo.deleteTrivia(admin.id, str(form, "id"));
    return "Trivia question deleted.";
  });
}

/* ---------- Members ---------- */

export async function awardBonus(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const seeds = Number(form.get("seeds"));
  const reason = str(form, "reason", 200);
  if (!Number.isInteger(seeds) || seeds < 1 || seeds > 500) return fail("Bonus Seeds must be a whole number from 1 to 500.");
  if (!reason) return fail("Say why (for example: organised the meetup).");
  return run(async () => {
    const repo = await getRepo();
    await repo.awardBonus(admin.id, str(form, "memberId"), seeds, reason);
    return `Gave ${seeds} bonus Seeds 🌰`;
  });
}

export async function setRole(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin") return fail("Only super admins can change roles.");
  const role = str(form, "role") as Role;
  if (!["member", "house_admin", "super_admin"].includes(role)) return fail("Unknown role.");
  const memberId = str(form, "memberId");
  if (memberId === admin.id && role !== "super_admin") return fail("You cannot remove your own super admin role.");
  return run(async () => {
    const repo = await getRepo();
    await repo.setRole(admin.id, memberId, role);
    return "Role updated.";
  });
}
