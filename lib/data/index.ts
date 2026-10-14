import "server-only";
import { isSupabaseConfigured } from "../env";
import { memoryRepo } from "./memory";
import { supabaseRepo } from "./supabase";
import type { Repo } from "./repo";

/** Returns the storage for this request: Supabase when configured, otherwise demo mode. */
export async function getRepo(): Promise<Repo> {
  return isSupabaseConfigured ? supabaseRepo() : memoryRepo;
}

export type { Repo } from "./repo";
