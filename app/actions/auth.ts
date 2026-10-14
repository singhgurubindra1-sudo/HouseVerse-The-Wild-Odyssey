"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { DEMO_COOKIE, getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { memoryRepo } from "@/lib/data/memory";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "./types";

const COOKIE_OPTIONS = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === "production" };

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/* ---------- Demo mode ---------- */

export async function demoSignup(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (isSupabaseConfigured) return { ok: false, message: "Demo sign-up is switched off once Supabase is connected." };
  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  const houseId = String(form.get("house") ?? "");
  if (name.length < 2) return { ok: false, message: "Please type your name (at least 2 letters)." };
  if (!houseId) return { ok: false, message: "Please pick your house." };
  const profile = await memoryRepo.createDemoMember(name, houseId);
  (await cookies()).set(DEMO_COOKIE, profile.id, COOKIE_OPTIONS);
  redirect("/onboarding");
}

export async function demoLogin(form: FormData) {
  if (isSupabaseConfigured) return;
  const id = String(form.get("profileId") ?? "");
  const profile = await memoryRepo.getProfile(id);
  if (!profile) redirect("/login");
  (await cookies()).set(DEMO_COOKIE, profile.id, COOKIE_OPTIONS);
  redirect(profile.role === "member" ? `/house/${profile.houseId}` : "/admin");
}

/* ---------- Supabase ---------- */

export async function passwordAuth(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const mode = String(form.get("mode") ?? "signin");
  if (!email || password.length < 6) return { ok: false, message: "Enter your email and a password of at least 6 characters." };

  if (mode === "signup") {
    const name = String(form.get("name") ?? "").trim().slice(0, 40);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name || email.split("@")[0] }, emailRedirectTo: `${await siteUrl()}/auth/callback` },
    });
    if (error) return { ok: false, message: error.message };
    if (!data.session) return { ok: true, message: "Check your inbox and click the link to confirm your email, then log in." };
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
  }
  redirect("/login/house");
}

export async function googleLogin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await siteUrl()}/auth/callback` },
  });
  if (error || !data.url) redirect(`/login?error=${encodeURIComponent(error?.message ?? "Google login is not set up")}`);
  redirect(data.url);
}

/* ---------- Both modes ---------- */

export async function chooseHouse(form: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const houseId = String(form.get("house") ?? "");
  if (!user.houseId) {
    const repo = await getRepo();
    await repo.chooseHouse(user.id, houseId);
  }
  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function logout() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } else {
    (await cookies()).delete(DEMO_COOKIE);
  }
  revalidatePath("/", "layout");
  redirect("/");
}
