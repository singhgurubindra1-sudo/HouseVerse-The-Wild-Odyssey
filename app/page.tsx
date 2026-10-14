import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { getHouseSummaries } from "@/lib/views";
import { STAGES } from "@/lib/game";
import { HouseCard } from "@/components/forest/HouseCard";
import { AutoRefresh } from "@/components/client";
import { StatTile } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const repo = await getRepo();
  const [user, summaries, stats] = await Promise.all([getCurrentUser(), getHouseSummaries(), repo.getStats()]);
  const mostActive = summaries.find((s) => s.house.id === stats.mostActiveHouseId)?.house;
  // Alphabetical panorama, so the landing page is not a leaderboard.
  const panorama = [...summaries].sort((a, b) => a.house.name.localeCompare(b.house.name));

  return (
    <div className="space-y-12">
      <AutoRefresh seconds={20} />
      <section className="rise grid items-center gap-6 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="pill mb-3 bg-leaf">Saranda House Build-a-Thon &apos;26 · House Odyssey</p>
          <h1 className="text-5xl font-black tracking-tight text-forest sm:text-6xl">Wildlands</h1>
          <p className="mt-3 text-xl font-semibold">A living house ecosystem.</p>
          <p className="mt-3 max-w-xl text-ink/80">
            Every quest you finish plants a tree or brings an animal back to your house&apos;s forest. Over the semester, nine empty patches of land turn into nine living
            national parks, and everyone can see exactly who helped them grow.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {user?.houseId ? (
              <Link href={`/house/${user.houseId}`} className="btn btn-primary">
                🌳 Go to my forest
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary">
                🌱 Join your house
              </Link>
            )}
            <Link href="/wildlands" className="btn btn-ghost">
              See all nine forests
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatTile emoji="🌳" label="Trees planted this week" value={stats.treesThisWeek} />
          <StatTile emoji="✅" label="Quests completed" value={stats.questsCompleted} />
          <StatTile emoji="🔥" label="Most active house" value={mostActive ? `${mostActive.mascotEmoji} ${mostActive.name}` : "—"} />
          <StatTile emoji="🧑‍🤝‍🧑" label="Rangers" value={stats.members} />
        </div>
      </section>

      <section aria-labelledby="panorama">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="panorama" className="text-2xl font-extrabold text-forest">
            The nine forests, right now
          </h2>
          <Link href="/wildlands" className="text-sm font-semibold text-forest underline">
            Leaderboard →
          </Link>
        </div>
        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
          {panorama.map((s) => (
            <li key={s.house.id} className="w-[82%] shrink-0 snap-center sm:w-auto">
              <HouseCard summary={s} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how" className="grid gap-4 md:grid-cols-4">
        <h2 id="how" className="sr-only">
          How Wildlands works
        </h2>
        {[
          ["🌱", "Meet your house", "A short story welcome: your mascot, values, leaders and a 5-question quiz. Finish it to plant your first seed."],
          ["🧭", "Do quests", "Tech, Sports and Culture quests every week. Submit a photo or link as proof."],
          ["🌳", "Watch it grow", "Every approved quest plants something with your name on it. Tap any tree to see who planted it."],
          ["🪪", "Show it off", "Your Habitat Card collects your badges and contributions. Share it anywhere."],
        ].map(([emoji, title, body]) => (
          <div key={title} className="card bg-leaf-soft p-4">
            <p className="text-2xl" aria-hidden>
              {emoji}
            </p>
            <h3 className="mt-1 font-extrabold">{title}</h3>
            <p className="mt-1 text-sm text-ink/75">{body}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="stages" className="card p-5">
        <h2 id="stages" className="mb-4 text-xl font-extrabold text-forest">
          How a house forest grows
        </h2>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STAGES.map((s) => (
            <li key={s.key} className="rounded-xl border-2 border-ink/20 bg-cream p-3 text-center">
              <p className="text-3xl" aria-hidden>
                {s.emoji}
              </p>
              <p className="font-bold">{s.name}</p>
              <p className="text-xs text-ink/70">{s.min.toLocaleString()} Seeds</p>
              <p className="mt-1 text-xs">{s.shows}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-ink/70">
          🥀 If a house has no approved quests for 7 days, its forest gently wilts. One new quest brings the colour back.
        </p>
      </section>
    </div>
  );
}
