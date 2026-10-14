import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "./env";
import { getRepo } from "./data";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

export const DEMO_COOKIE = "wl_demo_user";

/** The logged-in member's profile, or null. Cached for the length of one request. */
export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  const repo = await getRepo();
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return repo.getProfile(data.user.id);
  }
  const id = (await cookies()).get(DEMO_COOKIE)?.value;
  return id ? repo.getProfile(id) : null;
});

/** For member pages: sends visitors to log in, and new members to pick a house. */
export async function requireUser(options: { allowNoHouse?: boolean } = {}): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.houseId && !options.allowNoHouse) redirect("/login/house");
  return user;
}

export function isAdmin(user: Profile | null): boolean {
  return user?.role === "house_admin" || user?.role === "super_admin";
}

/** House admins manage their own house; super admins manage every house. */
export function canManageHouse(user: Profile | null, houseId: string | null): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return user.role === "house_admin" && houseId !== null && user.houseId === houseId;
}

export async function requireAdmin(): Promise<Profile> {
  const user = await requireUser({ allowNoHouse: true });
  if (!isAdmin(user)) redirect("/");
  return user;
}

/** Which house an admin page should show: the admin's own, or any (for super admins). */
export function adminHouseScope(user: Profile): string | undefined {
  return user.role === "super_admin" ? undefined : (user.houseId ?? "__none__");
}
