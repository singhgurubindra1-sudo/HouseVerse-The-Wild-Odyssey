import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { STAGES, daysAgo, isWilting, nextStage, rankFor, stageIndexFor, stageProgress } from "@/lib/game";
import { timeAgo } from "@/lib/format";
import { toSceneItem } from "@/lib/views";
import { ForestScene } from "@/components/forest/ForestScene";
import { KIND_EMOJI, KIND_LABEL } from "@/components/forest/art";
import { AutoRefresh } from "@/components/client";
import { Avatar, Notice, ProgressBar } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const house = await (await getRepo()).getHouse(slug);
  return { title: house ? `${house.name} forest` : "Forest not found" };
}

export default async function HousePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const [{ slug }, { welcome }] = await Promise.all([params, searchParams]);
  const repo = await getRepo();
  const [house, user] = await Promise.all([repo.getHouse(slug), getCurrentUser()]);
  if (!house) notFound();
  const [items, last, members] = await Promise.all([repo.listForestItems({ houseId: house.id }), repo.lastApprovedByHouse(), repo.listProfiles({ houseId: house.id })]);

  const stageIndex = stageIndexFor(house.totalSeeds);
  const stage = STAGES[stageIndex];
  const next = nextStage(house.totalSeeds);
  const wilting = isWilting(last[house.id] ?? null);
  const now = Date.now();
  const freshIds = items.filter((i) => now - new Date(i.createdAt).getTime() < 5 * 60_000).map((i) => i.id);
  const handles = Object.fromEntries(items.filter((i) => i.plantedByHandle).map((i) => [i.id, i.plantedByHandle!]));
  const recent = [...items].reverse().slice(0, 8);
  const topRangers = members.filter((m) => m.role === "member").slice(0, 5);
  const isMine = user?.houseId === house.id;

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={8} />
      {welcome && isMine && (
        <Notice tone="success">
          🎉 <strong>Welcome to {house.name}, ranger!</strong> Your first seed is planted on the map below (look for the glowing one), and you earned the 🎖️ Ranger badge.{" "}
          <Link href="/quests" className="font-bold underline">
            Find your first quest →
          </Link>
        </Notice>
      )}
      {wilting && (
        <Notice tone="warn">
          🥀 <strong>{house.name}&apos;s forest needs rangers!</strong>{" "}
          {last[house.id] ? `No quests approved for ${daysAgo(last[house.id]!)} days, so the colours are fading.` : "No quests approved yet."} One new quest brings the colour back.{" "}
          <Link href="/quests" className="font-bold underline">
            Do a quest
          </Link>
        </Notice>
      )}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink/70">
            {house.place} · {house.region}
          </p>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: house.colorPrimary }}>
            <span aria-hidden>{house.mascotEmoji}</span> {house.name}
          </h1>
          <p className="mt-1 italic text-ink/75">&ldquo;{house.motto}&rdquo;</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="pill bg-leaf text-base">
            {stage.emoji} {stage.name}
          </span>
          <span className="pill bg-sand text-base">🌰 {house.totalSeeds.toLocaleString()} Seeds</span>
          <span className="pill bg-white text-base">🌳 {items.length} planted</span>
        </div>
      </header>

      <ForestScene houseId={house.id} houseName={house.name} items={items.map(toSceneItem)} stageIndex={stageIndex} wilting={wilting} freshIds={freshIds} handles={handles} />

      <section className="card p-4" aria-label="Progress to next stage">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <strong>
            {next
              ? `${house.totalSeeds.toLocaleString()} / ${next.min.toLocaleString()} Seeds to ${next.key === "wildlands" ? `unlock the ${house.legendary}` : `reach ${next.name}`}`
              : `${house.legendary} has returned! ${house.name} is a true Wildlands.`}
          </strong>
          {next && <span className="text-ink/70">Next: {next.emoji} {next.shows}</span>}
        </div>
        <ProgressBar value={stageProgress(house.totalSeeds)} color={house.colorPrimary} label={`Progress to ${next?.name ?? "Wildlands"}`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-4 lg:col-span-2" aria-labelledby="recent">
          <h2 id="recent" className="mb-3 text-lg font-extrabold">
            🌱 Latest growth
          </h2>
          {recent.length === 0 ? (
            <p className="text-ink/70">Nothing planted yet. Be the first!</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {recent.map((i) => (
                <li key={i.id} className="flex items-start gap-3 py-2 text-sm">
                  <span className="text-xl" aria-hidden>
                    {KIND_EMOJI[i.kind] ?? "🌳"}
                  </span>
                  <span>
                    {i.plantedByHandle ? (
                      <Link href={`/u/${i.plantedByHandle}`} className="font-bold hover:underline">
                        {i.plantedByName}
                      </Link>
                    ) : (
                      <strong>A ranger</strong>
                    )}{" "}
                    planted a {(KIND_LABEL[i.kind] ?? "plant").toLowerCase()} for <em>{i.label}</em>
                    <span className="block text-xs text-ink/60">{timeAgo(i.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-4" aria-labelledby="rangers">
          <h2 id="rangers" className="mb-3 text-lg font-extrabold">
            🏅 Top rangers
          </h2>
          <ol className="space-y-2">
            {topRangers.map((m, i) => (
              <li key={m.id}>
                <Link href={`/u/${m.handle}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-leaf-soft">
                  <span className="w-5 text-right font-bold text-ink/60">{i + 1}</span>
                  <Avatar profile={m} size={32} />
                  <span className="flex-1">
                    <span className="block text-sm font-bold">{m.name}</span>
                    <span className="text-xs text-ink/60">{rankFor(m.totalSeeds).title}</span>
                  </span>
                  <span className="text-sm font-bold">🌰 {m.totalSeeds}</span>
                </Link>
              </li>
            ))}
          </ol>
          {isMine ? (
            <Link href="/quests" className="btn btn-primary mt-4 w-full">
              🧭 Grow the forest: do a quest
            </Link>
          ) : (
            !user && (
              <Link href="/login" className="btn btn-primary mt-4 w-full">
                Join {house.name}
              </Link>
            )
          )}
        </section>
      </div>

      <section className="card bg-leaf-soft p-5" aria-labelledby="lore">
        <h2 id="lore" className="mb-2 text-lg font-extrabold">
          📜 About {house.name}
        </h2>
        <p className="text-ink/85">{house.lore}</p>
        <p className="mt-3 text-sm">
          <strong>On the map:</strong> {house.landscape}. <strong>Legendary unlock:</strong> {house.legendaryEmoji} {house.legendary}.
        </p>
      </section>
    </div>
  );
}
