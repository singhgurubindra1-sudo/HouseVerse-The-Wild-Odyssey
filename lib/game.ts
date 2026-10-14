import type { Badge, BadgeRule, Track } from "./types";

/* ---------- House growth stages (Part 5 of the guide) ---------- */

export interface Stage {
  key: "bare" | "sapling" | "grove" | "forest" | "wildlands";
  name: string;
  emoji: string;
  min: number;
  shows: string;
}

export const STAGES: Stage[] = [
  { key: "bare", name: "Bare Land", emoji: "🌰", min: 0, shows: "Empty ground, a few seeds" },
  { key: "sapling", name: "Sapling", emoji: "🌱", min: 100, shows: "Small plants, grass" },
  { key: "grove", name: "Grove", emoji: "🌿", min: 300, shows: "Young trees, a stream or pond" },
  { key: "forest", name: "Forest", emoji: "🌳", min: 700, shows: "Full trees, birds, smaller animals" },
  { key: "wildlands", name: "Wildlands", emoji: "🐘", min: 1500, shows: "The house's legendary animal returns" },
];

export function stageIndexFor(seeds: number): number {
  let index = 0;
  STAGES.forEach((stage, i) => {
    if (seeds >= stage.min) index = i;
  });
  return index;
}

export function stageFor(seeds: number): Stage {
  return STAGES[stageIndexFor(seeds)];
}

export function nextStage(seeds: number): Stage | null {
  return STAGES[stageIndexFor(seeds) + 1] ?? null;
}

/** 0..1 progress from the current stage threshold to the next one. */
export function stageProgress(seeds: number): number {
  const current = stageFor(seeds);
  const next = nextStage(seeds);
  if (!next) return 1;
  return Math.min(1, (seeds - current.min) / (next.min - current.min));
}

/* ---------- Member rank titles ---------- */

export const RANKS = [
  { title: "Seedling", min: 0 },
  { title: "Scout", min: 50 },
  { title: "Tracker", min: 150 },
  { title: "Ranger", min: 300 },
  { title: "Warden", min: 600 },
  { title: "Guardian of the Wild", min: 1000 },
];

export function rankFor(seeds: number) {
  let rank = RANKS[0];
  for (const r of RANKS) if (seeds >= r.min) rank = r;
  return rank;
}

export function nextRank(seeds: number) {
  return RANKS.find((r) => r.min > seeds) ?? null;
}

/* ---------- Wilting (anti-drift) ---------- */

export const WILT_DAYS = 7;
export const QUIET_DAYS = 14;
const DAY = 24 * 60 * 60 * 1000;

export function isWilting(lastApprovedAt: string | null, now = Date.now()): boolean {
  if (!lastApprovedAt) return true;
  return now - new Date(lastApprovedAt).getTime() > WILT_DAYS * DAY;
}

export function daysAgo(iso: string, now = Date.now()): number {
  return Math.floor((now - new Date(iso).getTime()) / DAY);
}

/* ---------- Tracks ---------- */

export const TRACK_META: Record<Track, { label: string; emoji: string; color: string }> = {
  tech: { label: "Tech", emoji: "💻", color: "#3b82c4" },
  sports: { label: "Sports", emoji: "⚽", color: "#e0912f" },
  culture: { label: "Culture", emoji: "🎭", color: "#b4519b" },
};

/* ---------- Badges ---------- */

export interface BadgeFacts {
  onboarded: boolean;
  approvedByTrack: Record<Track, number>;
  /** ISO dates of approved submissions (when the member did the quest). */
  approvedDates: string[];
}

/** Monday-based week number since epoch, so weeks line up the same everywhere. */
export function weekNumber(iso: string): number {
  const t = new Date(iso).getTime();
  // 1970-01-01 was a Thursday; shift by 3 days so weeks start on Monday.
  return Math.floor((t / DAY + 3) / 7);
}

export function longestWeekStreak(dates: string[]): number {
  const weeks = Array.from(new Set(dates.map(weekNumber))).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const w of weeks) {
    run = prev !== null && w === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = w;
  }
  return best;
}

export function ruleMet(rule: BadgeRule, facts: BadgeFacts): boolean {
  const total = facts.approvedByTrack.tech + facts.approvedByTrack.sports + facts.approvedByTrack.culture;
  switch (rule.type) {
    case "manual":
      return false;
    case "onboarding":
      return facts.onboarded;
    case "quests_total":
      return total >= rule.count;
    case "track_count":
      return facts.approvedByTrack[rule.track] >= rule.count;
    case "all_tracks":
      return facts.approvedByTrack.tech > 0 && facts.approvedByTrack.sports > 0 && facts.approvedByTrack.culture > 0;
    case "streak_weeks":
      return longestWeekStreak(facts.approvedDates) >= rule.count;
  }
}

export function badgesEarned(badges: Badge[], facts: BadgeFacts): Badge[] {
  return badges.filter((b) => ruleMet(b.rule, facts));
}

export function describeRule(rule: BadgeRule): string {
  switch (rule.type) {
    case "manual":
      return "Awarded by hand";
    case "onboarding":
      return "Finish onboarding";
    case "quests_total":
      return `${rule.count} approved quest${rule.count === 1 ? "" : "s"}`;
    case "track_count":
      return `${rule.count} ${TRACK_META[rule.track].label} quests`;
    case "all_tracks":
      return "One quest in each track";
    case "streak_weeks":
      return `A quest ${rule.count} weeks in a row`;
  }
}

/* ---------- Forest placement ---------- */

/** Small deterministic hash so the same id always lands in the same spot. */
export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function positionFor(seed: string): { x: number; y: number } {
  const h = hashString(seed);
  const h2 = hashString(seed + "y");
  return { x: 30 + (h % 940), y: h2 % 1000 };
}
