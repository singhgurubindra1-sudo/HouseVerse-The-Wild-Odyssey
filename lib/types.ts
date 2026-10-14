export type Track = "tech" | "sports" | "culture";
export const TRACKS: Track[] = ["tech", "sports", "culture"];

export type Role = "member" | "house_admin" | "super_admin";

export interface Leader {
  name: string;
  role: string;
}

export interface House {
  id: string; // slug, e.g. "saranda"
  name: string;
  place: string;
  region: string;
  landscape: string;
  legendary: string;
  legendaryEmoji: string;
  mascot: string;
  mascotEmoji: string;
  motto: string;
  lore: string;
  values: string[];
  leaders: Leader[];
  colorPrimary: string;
  colorAccent: string;
  totalSeeds: number;
}

export interface Profile {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  houseId: string | null;
  role: Role;
  totalSeeds: number;
  onboarded: boolean;
  createdAt: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  track: Track;
  seeds: number;
  startsAt: string | null;
  endsAt: string | null;
  houseId: string | null; // null = all houses
  active: boolean;
  needsProof: boolean;
  createdAt: string;
}

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface Submission {
  id: string;
  memberId: string;
  questId: string;
  houseId: string;
  proofUrl: string | null;
  proofText: string | null;
  status: SubmissionStatus;
  reviewedBy: string | null;
  note: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface SubmissionView extends Submission {
  memberName: string;
  memberHandle: string;
  questTitle: string;
  questTrack: Track;
  questSeeds: number;
}

export type ForestSource = "quest" | "onboarding";

export interface ForestItem {
  id: string;
  houseId: string;
  kind: string;
  x: number; // 0..1000
  y: number; // 0..1000 (depth inside the ground band)
  plantedBy: string | null;
  plantedByName: string | null;
  plantedByHandle: string | null;
  submissionId: string | null;
  source: ForestSource;
  label: string;
  track: Track | null;
  seeds: number;
  createdAt: string;
}

export type BadgeRule =
  | { type: "manual" }
  | { type: "onboarding" }
  | { type: "quests_total"; count: number }
  | { type: "track_count"; track: Track; count: number }
  | { type: "all_tracks" }
  | { type: "streak_weeks"; count: number };

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  rule: BadgeRule;
}

export interface MemberBadge {
  memberId: string;
  badgeId: string;
  earnedAt: string;
}

export interface LoreCard {
  id: string;
  houseId: string;
  position: number;
  title: string;
  body: string;
  emoji: string;
}

export interface TriviaQuestion {
  id: string;
  houseId: string;
  position: number;
  question: string;
  options: string[];
  answerIndex: number;
}

export interface ActivityEntry {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  details: string;
  houseId: string | null;
  createdAt: string;
}

export interface SiteStats {
  treesThisWeek: number;
  questsCompleted: number;
  mostActiveHouseId: string | null;
  members: number;
}
