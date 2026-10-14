import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { TRACK_META } from "@/lib/game";
import { TRACKS, type SubmissionStatus, type Track } from "@/lib/types";
import { QuestCard } from "@/components/QuestCard";
import { EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Questboard" };
export const dynamic = "force-dynamic";

export default async function QuestsPage({ searchParams }: { searchParams: Promise<{ track?: string }> }) {
  const { track: rawTrack } = await searchParams;
  const track = TRACKS.includes(rawTrack as Track) ? (rawTrack as Track) : null;
  const repo = await getRepo();
  const user = await getCurrentUser();
  const [quests, completions, houses, mine] = await Promise.all([
    repo.listQuests({ houseId: user?.houseId ?? null }),
    repo.questCompletions(),
    repo.listHouses(),
    user ? repo.listSubmissions({ memberId: user.id }) : Promise.resolve([]),
  ]);
  const now = new Date().toISOString();
  const open = quests.filter((q) => (!q.startsAt || q.startsAt <= now) && (!q.endsAt || q.endsAt >= now));
  const shown = track ? open.filter((q) => q.track === track) : open;
  const statusOf = new Map<string, SubmissionStatus>();
  for (const s of [...mine].reverse()) statusOf.set(s.questId, s.status);
  const houseName = (id: string | null) => houses.find((h) => h.id === id)?.name;

  const tabs: { key: Track | null; label: string }[] = [{ key: null, label: "All" }, ...TRACKS.map((t) => ({ key: t, label: `${TRACK_META[t].emoji} ${TRACK_META[t].label}` }))];

  return (
    <div>
      <PageHeader eyebrow="Questboard" title="Quests that grow your forest">
        Pick a quest, do it, and submit a photo or link as proof. Once an admin approves it, a tree with your name sprouts in your house&apos;s forest.
        {!user && (
          <>
            {" "}
            <Link href="/login" className="font-bold text-forest underline">
              Join your house
            </Link>{" "}
            to start.
          </>
        )}
      </PageHeader>
      <nav aria-label="Filter by track" className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = track === t.key;
          return (
            <Link key={t.label} href={t.key ? `/quests?track=${t.key}` : "/quests"} aria-current={active ? "page" : undefined} className={`btn btn-sm ${active ? "btn-primary" : "btn-ghost"}`}>
              {t.label}
            </Link>
          );
        })}
      </nav>
      {shown.length === 0 ? (
        <EmptyState emoji="🧭" title="No open quests here yet">
          Check back soon, or try another track.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((q) => (
            <li key={q.id}>
              <QuestCard quest={q} done={completions[q.id] ?? 0} status={statusOf.get(q.id)} houseName={q.houseId ? houseName(q.houseId) : undefined} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
