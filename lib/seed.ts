/**
 * Demo "seed data": 9 houses, 30 members, 20 quests and a few hundred forest
 * items spread unevenly, so some forests look lush and others look bare.
 *
 * Times are stored as "minutes ago" so the data always looks fresh: demo mode
 * turns them into real dates at start-up, and scripts/generate-seed-sql.ts
 * turns them into `now() - interval` for Supabase.
 */
import { HOUSE_SEED, kindForTrack } from "./houses";
import { hashString, positionFor } from "./game";
import type { Badge, Role, Track } from "./types";

export const DEFAULT_BADGES: Badge[] = [
  { id: "ranger", name: "Ranger", icon: "🎖️", description: "Finished onboarding", rule: { type: "onboarding" } },
  { id: "first-sprout", name: "First Sprout", icon: "🌱", description: "First approved quest", rule: { type: "quests_total", count: 1 } },
  { id: "code-tracker", name: "Code Tracker", icon: "💻", description: "3 Tech quests", rule: { type: "track_count", track: "tech", count: 3 } },
  { id: "field-runner", name: "Field Runner", icon: "⚽", description: "3 Sports quests", rule: { type: "track_count", track: "sports", count: 3 } },
  { id: "storyteller", name: "Storyteller", icon: "🎭", description: "3 Culture quests", rule: { type: "track_count", track: "culture", count: 3 } },
  { id: "all-rounder", name: "All-Rounder", icon: "🦁", description: "One quest in each track", rule: { type: "all_tracks" } },
  { id: "streak-keeper", name: "Streak Keeper", icon: "🔥", description: "A quest 4 weeks in a row", rule: { type: "streak_weeks", count: 4 } },
  { id: "guide", name: "Guide", icon: "🤝", description: "Brought a friend who finished onboarding", rule: { type: "manual" } },
  { id: "legend", name: "Legend", icon: "🏆", description: "Top 3 in house for a season", rule: { type: "manual" } },
];

export interface SeedProfile {
  id: string;
  name: string;
  handle: string;
  houseId: string;
  role: Role;
  agoMin: number;
}
export interface SeedQuest {
  id: string;
  title: string;
  description: string;
  track: Track;
  seeds: number;
  houseId: string | null;
  startsAgoMin: number;
  endsInMin: number;
  active: boolean;
}
export interface SeedSubmission {
  id: string;
  memberId: string;
  questId: string;
  houseId: string;
  status: "pending" | "approved" | "rejected";
  proofUrl: string | null;
  proofText: string | null;
  note: string | null;
  reviewedBy: string | null;
  agoMin: number;
  reviewedAgoMin: number | null;
}
export interface SeedForestItem {
  id: string;
  houseId: string;
  kind: string;
  x: number;
  y: number;
  plantedBy: string;
  submissionId: string | null;
  source: "quest" | "onboarding";
  label: string;
  track: Track | null;
  seeds: number;
  agoMin: number;
}
export interface SeedLore {
  id: string;
  houseId: string;
  position: number;
  title: string;
  body: string;
  emoji: string;
}
export interface SeedTrivia {
  id: string;
  houseId: string;
  position: number;
  question: string;
  options: string[];
  answerIndex: number;
}
export interface SeedActivity {
  id: string;
  actorId: string;
  action: string;
  details: string;
  houseId: string | null;
  agoMin: number;
}

/** Deterministic UUID from a string, so seed ids are stable between runs. */
export function seedUuid(key: string): string {
  const hex = [0, 1, 2, 3].map((i) => hashString(`${key}#${i}`).toString(16).padStart(8, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MIN = 1;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const MEMBER_NAMES: Record<string, string[]> = {
  saranda: ["Rahul Verma", "Ananya Iyer", "Kabir Singh", "Meera Nair", "Arjun Das", "Sneha Kulkarni"],
  gir: ["Vikram Patel", "Ishita Shah", "Rohan Mehta", "Diya Joshi"],
  kanha: ["Aditya Rao", "Nisha Gupta", "Karan Malhotra"],
  bandipur: ["Lakshmi Reddy", "Siddharth Hegde", "Pooja Shetty"],
  corbett: ["Aman Rawat", "Tanvi Bisht", "Yash Negi", "Riya Pant", "Dev Chauhan"],
  namdapha: ["Tenzing Dorjee", "Mira Tayeng"],
  pichavaram: ["Karthik Raman", "Divya Subramanian", "Vignesh Kumar"],
  wayanad: ["Anjali Menon", "Joel Thomas"],
  kaziranga: ["Bhaskar Bora", "Priyanka Saikia"],
};

/** Target house Seeds, so forests land at different stages. */
const HOUSE_TARGET: Record<string, { seeds: number; lastActiveDays: number }> = {
  saranda: { seeds: 760, lastActiveDays: 0 },
  gir: { seeds: 420, lastActiveDays: 1 },
  kanha: { seeds: 310, lastActiveDays: 2 },
  bandipur: { seeds: 180, lastActiveDays: 3 },
  corbett: { seeds: 1520, lastActiveDays: 0 },
  namdapha: { seeds: 40, lastActiveDays: 20 },
  pichavaram: { seeds: 330, lastActiveDays: 4 },
  wayanad: { seeds: 210, lastActiveDays: 10 },
  kaziranga: { seeds: 880, lastActiveDays: 1 },
};

const QUEST_DEFS: Omit<SeedQuest, "id" | "active" | "startsAgoMin" | "endsInMin">[] = [
  { title: "Attend the regional meetup", description: "Show up at your region's meetup and say hello to at least two housemates. Proof: a photo from the meetup.", track: "culture", seeds: 30, houseId: null },
  { title: "Solve this week's tech quiz", description: "Take the weekly tech quiz in the house group and score at least 6/10. Proof: a screenshot of your score.", track: "tech", seeds: 20, houseId: null },
  { title: "Play in the house football match", description: "Turn up and play in the inter-house football match. Win or lose, you showed up. Proof: a team photo.", track: "sports", seeds: 40, houseId: null },
  { title: "Write a poem for the house magazine", description: "Write a short poem about your house's forest and send it to the magazine team. Proof: a link to your poem.", track: "culture", seeds: 25, houseId: null },
  { title: "Build a tiny web page", description: "Make a one-page website about your favourite animal and publish it for free. Proof: the link.", track: "tech", seeds: 40, houseId: null },
  { title: "Run 5 km this week", description: "Run or walk 5 km in one go. Proof: a screenshot from any running app.", track: "sports", seeds: 20, houseId: null },
  { title: "Join the house chess night", description: "Play at least two games at the online chess night. Proof: a screenshot of a finished game.", track: "sports", seeds: 15, houseId: null },
  { title: "Help a newcomer with a doubt", description: "Answer a course doubt from a first-term student in the house group. Proof: a link or screenshot.", track: "tech", seeds: 15, houseId: null },
  { title: "Share a photo of local nature", description: "Take a photo of a tree, bird or animal near you and share it with the house. Proof: the photo.", track: "culture", seeds: 10, houseId: null },
  { title: "Join a hackathon team", description: "Join a team for any hackathon (this one counts!). Proof: a link to the team's project.", track: "tech", seeds: 30, houseId: null },
  { title: "Volunteer at a house event", description: "Help organise any house event: host, design posters or manage the chat. Proof: a short note and a photo.", track: "culture", seeds: 35, houseId: null },
  { title: "Badminton doubles league", description: "Play one match in the doubles league. Proof: a photo with your partner.", track: "sports", seeds: 25, houseId: null },
  { title: "Present a 5-minute tech talk", description: "Give a short talk on anything techy at the house meetup. Proof: your slides.", track: "tech", seeds: 45, houseId: null },
  { title: "Perform at the cultural night", description: "Sing, dance, recite or play at the house cultural night. Proof: a photo or video link.", track: "culture", seeds: 40, houseId: null },
  { title: "Morning yoga streak", description: "Do 15 minutes of yoga for 5 days in a week. Proof: a short note or photos.", track: "sports", seeds: 20, houseId: null },
  { title: "Open-source your first pull request", description: "Make your first contribution to any open-source project. Proof: the PR link.", track: "tech", seeds: 50, houseId: null },
  { title: "Design the next event poster", description: "Design a poster for an upcoming house event. Proof: the image.", track: "culture", seeds: 20, houseId: null },
  { title: "Saranda hill trek", description: "Join the Saranda hill trek weekend and photograph a sal tree. Proof: the photo.", track: "sports", seeds: 35, houseId: "saranda" },
  { title: "Corbett river clean-up", description: "Join the riverside clean-up drive. Proof: a before-and-after photo.", track: "culture", seeds: 30, houseId: "corbett" },
  { title: "Gir lion fact-sheet", description: "Make a one-page fact-sheet about Asiatic lions for the house wiki. Proof: the link.", track: "tech", seeds: 25, houseId: "gir" },
];

function handleFor(name: string, taken: Set<string>) {
  const base = name.split(" ")[0].toLowerCase();
  let handle = base;
  let i = 2;
  while (taken.has(handle)) handle = `${base}${i++}`;
  taken.add(handle);
  return handle;
}

export interface SeedData {
  profiles: SeedProfile[];
  quests: SeedQuest[];
  submissions: SeedSubmission[];
  forestItems: SeedForestItem[];
  memberBadges: { memberId: string; badgeId: string; agoMin: number }[];
  lore: SeedLore[];
  trivia: SeedTrivia[];
  activity: SeedActivity[];
  houseSeeds: Record<string, number>;
  profileSeeds: Record<string, number>;
}

export function buildSeed(): SeedData {
  const rand = rng(2026);
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  const taken = new Set<string>();

  const profiles: SeedProfile[] = [];
  for (const house of HOUSE_SEED) {
    for (const name of MEMBER_NAMES[house.id]) {
      profiles.push({
        id: seedUuid(`profile:${name}`),
        name,
        handle: handleFor(name, taken),
        houseId: house.id,
        role: "member",
        agoMin: Math.floor((30 + rand() * 50) * DAY),
      });
    }
  }
  // Demo staff accounts.
  const sarandaAdmin: SeedProfile = {
    id: seedUuid("profile:saranda-admin"),
    name: "Saranda House Admin",
    handle: handleFor("saranda-admin", taken),
    houseId: "saranda",
    role: "house_admin",
    agoMin: 90 * DAY,
  };
  const organiser: SeedProfile = {
    id: seedUuid("profile:organiser"),
    name: "Programme Organiser",
    handle: handleFor("organiser", taken),
    houseId: "corbett",
    role: "super_admin",
    agoMin: 120 * DAY,
  };
  profiles.push(sarandaAdmin, organiser);

  const quests: SeedQuest[] = QUEST_DEFS.map((q, i) => ({
    ...q,
    id: seedUuid(`quest:${q.title}`),
    active: true,
    startsAgoMin: 70 * DAY,
    endsInMin: (i % 4 === 0 ? 7 : i % 4 === 1 ? 14 : 30) * DAY,
  }));
  // One paused quest so the admin screen has something to un-pause.
  quests[6].active = false;

  const submissions: SeedSubmission[] = [];
  const forestItems: SeedForestItem[] = [];
  const houseSeeds: Record<string, number> = {};
  const profileSeeds: Record<string, number> = {};
  const done = new Set<string>();
  const reviewerFor = (houseId: string) => (houseId === "saranda" ? sarandaAdmin.id : organiser.id);

  // Onboarding seedlings for every member.
  for (const p of profiles) {
    if (p.role !== "member") continue;
    const ago = p.agoMin - 30;
    const pos = positionFor(`onboard:${p.id}`);
    forestItems.push({
      id: seedUuid(`item:onboard:${p.id}`),
      houseId: p.houseId,
      kind: "seedling",
      ...pos,
      plantedBy: p.id,
      submissionId: null,
      source: "onboarding",
      label: "finishing Ranger Onboarding",
      track: null,
      seeds: 0,
      agoMin: ago,
    });
  }

  for (const house of HOUSE_SEED) {
    const target = HOUSE_TARGET[house.id];
    const members = profiles.filter((p) => p.houseId === house.id && p.role === "member");
    const eligible = quests.filter((q) => q.houseId === null || q.houseId === house.id);
    houseSeeds[house.id] = 0;
    let guard = 0;
    let n = 0;
    while (houseSeeds[house.id] < target.seeds && guard++ < 2000) {
      const member = pick(members);
      const quest = pick(eligible);
      const key = `${member.id}:${quest.id}`;
      if (done.has(key)) continue;
      done.add(key);
      // Spread over the last ~60 days; the newest one lands on lastActiveDays.
      const ago =
        n === 0
          ? target.lastActiveDays * DAY + Math.floor(rand() * 6 * HOUR) + 20
          : target.lastActiveDays * DAY + Math.floor(rand() * Math.min(55, member.agoMin / DAY) * DAY) + HOUR;
      n++;
      const id = seedUuid(`sub:${key}`);
      submissions.push({
        id,
        memberId: member.id,
        questId: quest.id,
        houseId: house.id,
        status: "approved",
        proofUrl: "https://example.com/proof",
        proofText: null,
        note: null,
        reviewedBy: reviewerFor(house.id),
        agoMin: ago + 2 * HOUR,
        reviewedAgoMin: ago,
      });
      forestItems.push({
        id: seedUuid(`item:${id}`),
        houseId: house.id,
        kind: kindForTrack(house.id, quest.track),
        ...positionFor(`item:${id}`),
        plantedBy: member.id,
        submissionId: id,
        source: "quest",
        label: quest.title,
        track: quest.track,
        seeds: quest.seeds,
        agoMin: ago,
      });
      houseSeeds[house.id] += quest.seeds;
      profileSeeds[member.id] = (profileSeeds[member.id] ?? 0) + quest.seeds;
    }
  }

  // Pending proofs waiting in the approval queue, and a couple of rejections.
  const pendingPlan: [string, number][] = [
    ["Ananya Iyer", 0],
    ["Kabir Singh", 2],
    ["Vikram Patel", 1],
    ["Lakshmi Reddy", 9],
    ["Tenzing Dorjee", 3],
    ["Joel Thomas", 13],
    ["Meera Nair", 4],
  ];
  pendingPlan.forEach(([name, questIndex], i) => {
    const member = profiles.find((p) => p.name === name)!;
    let quest = quests[questIndex];
    let k = questIndex;
    while (done.has(`${member.id}:${quest.id}`) || (quest.houseId && quest.houseId !== member.houseId)) {
      quest = quests[++k % quests.length];
    }
    done.add(`${member.id}:${quest.id}`);
    submissions.push({
      id: seedUuid(`sub:pending:${member.id}:${quest.id}`),
      memberId: member.id,
      questId: quest.id,
      houseId: member.houseId,
      status: "pending",
      proofUrl: i % 2 === 0 ? "https://example.com/photo-proof" : null,
      proofText: i % 2 === 0 ? null : "I did this on Saturday with three housemates!",
      note: null,
      reviewedBy: null,
      agoMin: (i + 1) * 3 * HOUR,
      reviewedAgoMin: null,
    });
  });
  const rejected = profiles.find((p) => p.name === "Rohan Mehta")!;
  const rejectedQuest = quests.find((q) => q.houseId === null && !done.has(`${rejected.id}:${q.id}`))!;
  submissions.push({
    id: seedUuid(`sub:rejected:${rejected.id}`),
    memberId: rejected.id,
    questId: rejectedQuest.id,
    houseId: rejected.houseId,
    status: "rejected",
    proofUrl: null,
    proofText: "will do it later",
    note: "Please add a photo or link as proof and submit again.",
    reviewedBy: organiser.id,
    agoMin: 5 * DAY,
    reviewedAgoMin: 4 * DAY,
  });

  // Badges earned by seed members (only rule-based ones we can work out simply).
  const memberBadges: SeedData["memberBadges"] = [];
  for (const p of profiles) {
    if (p.role !== "member") continue;
    memberBadges.push({ memberId: p.id, badgeId: "ranger", agoMin: p.agoMin - 30 });
    const approved = submissions.filter((s) => s.memberId === p.id && s.status === "approved");
    const byTrack: Record<Track, number> = { tech: 0, sports: 0, culture: 0 };
    for (const s of approved) byTrack[quests.find((q) => q.id === s.questId)!.track]++;
    const latest = approved.length ? Math.min(...approved.map((s) => s.reviewedAgoMin ?? 0)) : 0;
    if (approved.length >= 1) memberBadges.push({ memberId: p.id, badgeId: "first-sprout", agoMin: latest });
    if (byTrack.tech >= 3) memberBadges.push({ memberId: p.id, badgeId: "code-tracker", agoMin: latest });
    if (byTrack.sports >= 3) memberBadges.push({ memberId: p.id, badgeId: "field-runner", agoMin: latest });
    if (byTrack.culture >= 3) memberBadges.push({ memberId: p.id, badgeId: "storyteller", agoMin: latest });
    if (byTrack.tech && byTrack.sports && byTrack.culture) memberBadges.push({ memberId: p.id, badgeId: "all-rounder", agoMin: latest });
  }
  memberBadges.push({ memberId: profiles.find((p) => p.name === "Rahul Verma")!.id, badgeId: "guide", agoMin: 20 * DAY });
  memberBadges.push({ memberId: profiles.find((p) => p.name === "Aman Rawat")!.id, badgeId: "legend", agoMin: 15 * DAY });

  const lore: SeedLore[] = [];
  const trivia: SeedTrivia[] = [];
  for (const h of HOUSE_SEED) {
    const cards = [
      { emoji: "🌄", title: `Welcome to ${h.name}`, body: `Welcome, ranger! ${h.name} is named after ${h.place} in ${h.region}. ${h.lore}` },
      { emoji: h.mascotEmoji, title: `Meet ${h.mascot}`, body: `${h.mascot} is our mascot. When our forest grows big enough, the ${h.legendary.toLowerCase()} returns to the map. Every quest you finish brings that day closer.` },
      { emoji: "🗺️", title: "How our forest grows", body: `Every quest you complete plants something in the ${h.name} forest with your name on it: ${h.landscape.toLowerCase()}. If nobody does a quest for a week, the forest starts to wilt. One quest brings the colour back.` },
    ];
    cards.forEach((c, i) => lore.push({ id: seedUuid(`lore:${h.id}:${i}`), houseId: h.id, position: i + 1, ...c }));

    const otherRegions = HOUSE_SEED.filter((o) => o.id !== h.id).map((o) => o.region);
    const otherLegendary = HOUSE_SEED.filter((o) => o.id !== h.id && o.legendary !== h.legendary).map((o) => o.legendary);
    const otherLandscapes = HOUSE_SEED.filter((o) => o.id !== h.id).map((o) => o.landscape);
    const questions: { q: string; right: string; wrong: string[] }[] = [
      { q: `Which state is the real ${h.place} in?`, right: h.region, wrong: otherRegions.slice(0, 3) },
      { q: `Which legendary animal returns when the ${h.name} forest reaches Wildlands?`, right: h.legendary, wrong: otherLegendary.slice(1, 4) },
      { q: `What grows on the ${h.name} map?`, right: h.landscape, wrong: otherLandscapes.slice(2, 5) },
      { q: `What is the ${h.name} house motto?`, right: h.motto, wrong: HOUSE_SEED.filter((o) => o.id !== h.id).map((o) => o.motto).slice(3, 6) },
      { q: "What are the points you earn from quests called?", right: "Seeds", wrong: ["Leaves", "Coins", "Acorns"] },
    ];
    questions.forEach((item, i) => {
      const options = [item.right, ...item.wrong];
      // Rotate so the right answer is not always first.
      const shift = hashString(`${h.id}${i}`) % options.length;
      const rotated = options.map((_, j) => options[(j + shift) % options.length]);
      trivia.push({
        id: seedUuid(`trivia:${h.id}:${i}`),
        houseId: h.id,
        position: i + 1,
        question: item.q,
        options: rotated,
        answerIndex: rotated.indexOf(item.right),
      });
    });
  }

  const activity: SeedActivity[] = submissions
    .filter((s) => s.status !== "pending")
    .sort((a, b) => (a.reviewedAgoMin ?? 0) - (b.reviewedAgoMin ?? 0))
    .slice(0, 25)
    .map((s) => {
      const member = profiles.find((p) => p.id === s.memberId)!;
      const quest = quests.find((q) => q.id === s.questId)!;
      return {
        id: seedUuid(`log:${s.id}`),
        actorId: s.reviewedBy!,
        action: s.status === "approved" ? "approved" : "rejected",
        details: `${s.status === "approved" ? "Approved" : "Rejected"} "${quest.title}" for ${member.name}`,
        houseId: s.houseId,
        agoMin: s.reviewedAgoMin ?? 0,
      };
    });

  return { profiles, quests, submissions, forestItems, memberBadges, lore, trivia, activity, houseSeeds, profileSeeds };
}
