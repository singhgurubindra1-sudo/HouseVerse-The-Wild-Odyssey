import type {
  ActivityEntry,
  Badge,
  BadgeRule,
  ForestItem,
  House,
  LoreCard,
  MemberBadge,
  Profile,
  Quest,
  Role,
  SiteStats,
  SubmissionStatus,
  SubmissionView,
  TriviaQuestion,
} from "../types";

export interface QuestInput {
  title: string;
  description: string;
  track: Quest["track"];
  seeds: number;
  startsAt: string | null;
  endsAt: string | null;
  houseId: string | null;
  active: boolean;
  needsProof: boolean;
}

export interface HouseLoreInput {
  mascot: string;
  mascotEmoji: string;
  motto: string;
  lore: string;
  values: string[];
  leaders: House["leaders"];
  colorPrimary: string;
  colorAccent: string;
}

export interface ReviewResult {
  approved: number;
  rejected: number;
  newBadges: string[];
}

/**
 * Everything the pages need from storage. Two implementations exist:
 * - memory.ts: demo mode, sample data held in server memory
 * - supabase.ts: the real database (Postgres + Row Level Security)
 *
 * `actorId` is always the logged-in user; permission checks happen in the
 * server actions and again inside the database (RLS) in Supabase mode.
 */
export interface Repo {
  readonly mode: "demo" | "supabase";

  listHouses(): Promise<House[]>;
  getHouse(id: string): Promise<House | null>;
  listForestItems(opts?: { houseId?: string; plantedBy?: string }): Promise<ForestItem[]>;
  lastApprovedByHouse(): Promise<Record<string, string | null>>;
  getStats(): Promise<SiteStats>;

  listProfiles(opts?: { houseId?: string; search?: string }): Promise<Profile[]>;
  getProfile(id: string): Promise<Profile | null>;
  getProfileByHandle(handle: string): Promise<Profile | null>;

  listQuests(opts?: { houseId?: string | null; includeInactive?: boolean }): Promise<Quest[]>;
  getQuest(id: string): Promise<Quest | null>;
  questCompletions(): Promise<Record<string, number>>;

  listSubmissions(opts: { memberId?: string; houseId?: string; status?: SubmissionStatus; limit?: number }): Promise<SubmissionView[]>;

  listBadges(): Promise<Badge[]>;
  listMemberBadges(memberId: string): Promise<MemberBadge[]>;

  listLoreCards(houseId: string): Promise<LoreCard[]>;
  listTrivia(houseId: string): Promise<TriviaQuestion[]>;

  listActivity(opts: { houseId?: string; limit?: number }): Promise<ActivityEntry[]>;
  /** Most recent submission date per member (for "gone quiet"). */
  lastSubmissionByMember(): Promise<Record<string, string>>;

  /* ---- writes ---- */
  chooseHouse(userId: string, houseId: string): Promise<void>;
  updateOwnProfile(userId: string, input: { name: string; avatarUrl: string | null }): Promise<void>;
  completeOnboarding(userId: string): Promise<void>;
  submitProof(userId: string, questId: string, proof: { url: string | null; text: string | null; file: File | null }): Promise<void>;
  reviewSubmissions(actorId: string, ids: string[], decision: "approved" | "rejected", note: string | null): Promise<ReviewResult>;

  saveQuest(actorId: string, id: string | null, input: QuestInput): Promise<string>;
  deleteQuest(actorId: string, id: string): Promise<void>;

  createBadge(actorId: string, input: { name: string; icon: string; description: string; rule: BadgeRule }): Promise<void>;
  awardBadge(actorId: string, memberId: string, badgeId: string): Promise<void>;

  updateHouseLore(actorId: string, houseId: string, input: HouseLoreInput): Promise<void>;
  saveLoreCard(actorId: string, houseId: string, id: string | null, input: { title: string; body: string; emoji: string; position: number }): Promise<void>;
  deleteLoreCard(actorId: string, id: string): Promise<void>;
  saveTrivia(actorId: string, houseId: string, id: string | null, input: { question: string; options: string[]; answerIndex: number; position: number }): Promise<void>;
  deleteTrivia(actorId: string, id: string): Promise<void>;

  awardBonus(actorId: string, memberId: string, seeds: number, reason: string): Promise<void>;
  setRole(actorId: string, memberId: string, role: Role): Promise<void>;
}
