"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import type { ActionState } from "./types";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

export async function finishOnboarding() {
  const user = await requireUser();
  const repo = await getRepo();
  await repo.completeOnboarding(user.id);
  revalidatePath("/", "layout");
  redirect(`/house/${user.houseId}?welcome=1`);
}

export async function submitProof(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const questId = String(form.get("questId") ?? "");
  const url = String(form.get("proofUrl") ?? "").trim();
  const text = String(form.get("proofText") ?? "").trim().slice(0, 1000);
  const file = form.get("photo");
  const photo = file instanceof File && file.size > 0 ? file : null;

  if (url && !/^https?:\/\//i.test(url)) return { ok: false, message: "Links should start with http:// or https://" };
  if (photo && !photo.type.startsWith("image/")) return { ok: false, message: "The photo must be an image file (JPG, PNG…)." };
  if (photo && photo.size > MAX_PHOTO_BYTES) return { ok: false, message: "That photo is too big. Please use one under 4 MB." };

  const repo = await getRepo();
  const quest = await repo.getQuest(questId);
  if (!quest) return { ok: false, message: "This quest no longer exists." };
  if (quest.needsProof && !url && !photo && !text) return { ok: false, message: "Add a photo, a link or a short note as proof." };

  try {
    await repo.submitProof(user.id, questId, { url: url || null, text: text || null, file: photo });
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  revalidatePath(`/quests/${questId}`);
  revalidatePath("/quests");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Submitted! Waiting for approval. Your tree will sprout once an admin approves it." };
}

export async function updateProfile(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  const avatarUrl = String(form.get("avatarUrl") ?? "").trim();
  if (name.length < 2) return { ok: false, message: "Your name needs at least 2 letters." };
  if (avatarUrl && !/^https:\/\//i.test(avatarUrl)) return { ok: false, message: "Photo links must start with https://" };
  const repo = await getRepo();
  await repo.updateOwnProfile(user.id, { name, avatarUrl: avatarUrl || null });
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved." };
}
