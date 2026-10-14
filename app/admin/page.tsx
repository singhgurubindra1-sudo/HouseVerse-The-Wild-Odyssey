import Link from "next/link";
import { adminHouseScope, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { QUIET_DAYS, STAGES, stageIndexFor } from "@/lib/game";
import { timeAgo } from "@/lib/format";
import { Avatar, StatTile } from "@/components/ui";

export const metadata = { title: "Admin overview" };

export default async function AdminOverview() {
  const admin = await requireAdmin();
  const scope = adminHouseScope(admin);
  const repo = await getRepo();
  const [houses, members, pending, lastSub, activity, submissions] = await Promise.all([
    repo.listHouses(),
    repo.listProfiles({ houseId: scope }),
    repo.listSubmissions({ status: "pending", houseId: scope }),
    repo.lastSubmissionByMember(),
    repo.listActivity({ houseId: scope, limit: 6 }),
    repo.listSubmissions({ houseId: scope, limit: 1000 }),
  ]);
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 864e5).toISOString();
  const activeThisWeek = new Set(submissions.filter((s) => s.createdAt >= weekAgo).map((s) => s.memberId)).size;
  const quietCutoff = new Date(now - QUIET_DAYS * 864e5).toISOString();
  const quiet = members
    .filter((m) => m.role === "member" && m.createdAt < quietCutoff && (!lastSub[m.id] || lastSub[m.id] < quietCutoff))
    .sort((a, b) => (lastSub[a.id] ?? "").localeCompare(lastSub[b.id] ?? ""));
  const shownHouses = scope ? houses.filter((h) => h.id === scope) : [...houses].sort((a, b) => b.totalSeeds - a.totalSeeds);
  const maxSeeds = Math.max(1, ...shownHouses.map((h) => h.totalSeeds));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile emoji="🏃" label="Active members this week" value={activeThisWeek} />
        <StatTile emoji="⏳" label="Waiting for approval" value={<Link href="/admin/approvals" className="underline">{pending.length}</Link>} />
        <StatTile emoji="🧑‍🤝‍🧑" label="Members" value={members.length} />
        <StatTile emoji="😴" label={`Quiet for ${QUIET_DAYS}+ days`} value={quiet.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="seeds">
          <h2 id="seeds" className="mb-4 text-lg font-extrabold">
            🌰 Seeds earned per house
          </h2>
          <ul className="space-y-2.5">
            {shownHouses.map((h) => (
              <li key={h.id} className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-2 text-sm">
                <span className="truncate font-bold">
                  {h.mascotEmoji} {h.name}
                </span>
                <span className="h-4 overflow-hidden rounded-full bg-ink/10" aria-hidden>
                  <span className="block h-full rounded-full" style={{ width: `${(h.totalSeeds / maxSeeds) * 100}%`, background: h.colorPrimary }} />
                </span>
                <span className="text-right font-bold">
                  {h.totalSeeds}
                  <span className="sr-only"> Seeds, stage {STAGES[stageIndexFor(h.totalSeeds)].name}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5" aria-labelledby="quiet">
          <h2 id="quiet" className="mb-1 text-lg font-extrabold">
            😴 Members going quiet
          </h2>
          <p className="mb-3 text-sm text-ink/70">No quest submitted in {QUIET_DAYS}+ days. A friendly message from a leader can bring them back.</p>
          {quiet.length === 0 ? (
            <p className="text-sm">Everyone is active. 🎉</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {quiet.map((m) => (
                <li key={m.id} className="flex items-center gap-3 text-sm">
                  <Avatar profile={m} size={30} />
                  <Link href={`/u/${m.handle}`} className="flex-1 font-semibold hover:underline">
                    {m.name}
                    <span className="block text-xs font-normal text-ink/60">{houses.find((h) => h.id === m.houseId)?.name}</span>
                  </Link>
                  <span className="text-xs text-ink/60">{lastSub[m.id] ? `last quest ${timeAgo(lastSub[m.id])}` : "no quests yet"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-5" aria-labelledby="recent-activity">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-activity" className="text-lg font-extrabold">
            🗒️ Recent admin activity
          </h2>
          <Link href="/admin/log" className="text-sm font-semibold text-forest underline">
            Full log →
          </Link>
        </div>
        <ul className="divide-y divide-ink/10 text-sm">
          {activity.map((a) => (
            <li key={a.id} className="flex justify-between gap-3 py-2">
              <span>
                <strong>{a.actorName ?? "System"}</strong>: {a.details}
              </span>
              <span className="shrink-0 text-xs text-ink/60">{timeAgo(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
