import Link from "next/link";
import { getHouseSummaries } from "@/lib/views";
import { STAGES } from "@/lib/game";
import { timeAgo } from "@/lib/format";
import { HouseCard } from "@/components/forest/HouseCard";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "All Houses" };
export const dynamic = "force-dynamic";

export default async function WildlandsPage() {
  const summaries = await getHouseSummaries();
  return (
    <div>
      <PageHeader eyebrow="Leaderboard" title="All nine Wildlands">
        Every forest side by side, ranked by how alive it is this season. Friendly competition: the more your house takes part, the wilder it gets.
      </PageHeader>

      <div className="card mb-8 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">House rankings by Seeds</caption>
          <thead className="bg-forest text-white">
            <tr>
              <th scope="col" className="px-4 py-3">#</th>
              <th scope="col" className="px-4 py-3">House</th>
              <th scope="col" className="px-4 py-3">Stage</th>
              <th scope="col" className="px-4 py-3 text-right">Seeds</th>
              <th scope="col" className="px-4 py-3 text-right">New this week</th>
              <th scope="col" className="px-4 py-3">Last growth</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s, i) => (
              <tr key={s.house.id} className="border-t border-ink/10 odd:bg-white even:bg-cream">
                <td className="px-4 py-2.5 font-bold">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/house/${s.house.id}`} className="font-bold hover:underline" style={{ color: s.house.colorPrimary }}>
                    {s.house.mascotEmoji} {s.house.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  {STAGES[s.stageIndex].emoji} {STAGES[s.stageIndex].name} {s.wilting && <span className="pill ml-1 bg-rose">🥀 wilting</span>}
                </td>
                <td className="px-4 py-2.5 text-right font-bold">{s.house.totalSeeds.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right">+{s.growthThisWeek}</td>
                <td className="px-4 py-2.5 text-ink/70">{s.lastGrowth ? timeAgo(s.lastGrowth) : "never"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaries.map((s, i) => (
          <li key={s.house.id}>
            <HouseCard summary={s} rank={i + 1} />
          </li>
        ))}
      </ul>
    </div>
  );
}
