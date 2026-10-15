import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { nextRank, rankFor, stageIndexFor, RANKS } from "@/lib/game";
import { formatDate, timeAgo } from "@/lib/format";
import type { Track } from "@/lib/types";
import { toSceneItem } from "@/lib/views";
import { updateProfile } from "@/app/actions/member";
import { ForestSvg } from "@/components/forest/ForestSvg";
import { TrackChart } from "@/components/TrackChart";
import { ActionForm } from "@/components/ActionForm";
import { ShareButton, SubmitButton } from "@/components/client";
import { Avatar, BadgeTile, ProgressBar } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await (await getRepo()).getProfileByHandle(handle);
  return {
    title: profile ? `${profile.name}'s Habitat Card` : "Ranger not found",
    description: profile ? `${profile.name} is a ${rankFor(profile.totalSeeds).title} with ${profile.totalSeeds} Seeds in Wildlands.` : undefined,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const repo = await getRepo();
  const [profile, viewer] = await Promise.all([repo.getProfileByHandle(handle), getCurrentUser()]);
  if (!profile) notFound();
  const isMe = viewer?.id === profile.id;
  const [house, items, badges, earned, mySubs] = await Promise.all([
    profile.houseId ? repo.getHouse(profile.houseId) : Promise.resolve(null),
    repo.listForestItems({ plantedBy: profile.id }),
    repo.listBadges(),
    repo.listMemberBadges(profile.id),
    isMe ? repo.listSubmissions({ memberId: profile.id, limit: 20 }) : Promise.resolve([]),
  ]);

  const seedsByTrack = { tech: 0, sports: 0, culture: 0 } as Record<Track, number>;
  const questsByTrack = { tech: 0, sports: 0, culture: 0 } as Record<Track, number>;
  for (const i of items) {
    if (i.source === "quest" && i.track) {
      seedsByTrack[i.track] += i.seeds;
      questsByTrack[i.track]++;
    }
  }
  const earnedMap = new Map(earned.map((e) => [e.badgeId, e.earnedAt]));
  const sortedBadges = [...badges].sort((a, b) => Number(earnedMap.has(b.id)) - Number(earnedMap.has(a.id)));
  const rank = rankFor(profile.totalSeeds);
  const next = nextRank(profile.totalSeeds);
  const rankProgress = next ? (profile.totalSeeds - rank.min) / (next.min - rank.min) : 1;
  const color = house?.colorPrimary ?? "#2d6a3e";

  return (
    <div className="space-y-6">
      <section className="card rise overflow-hidden">
        <div className="h-24 sm:h-28" style={{ background: `linear-gradient(120deg, ${color}cc, ${house?.colorAccent ?? "#9ccf6a"}99)` }} aria-hidden />
        <div className="-mt-14 flex flex-wrap items-end gap-5 p-6 pt-0">
          <span data-tilt="18" className="rounded-full">
            <Avatar profile={profile} size={104} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/60">Habitat Card</p>
            <h1 className="text-3xl font-black">{profile.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="pill bg-sun">🎖️ {rank.title}</span>
              {house && (
                <Link href={`/house/${house.id}`} className="pill hover:underline" style={{ background: `${color}22` }}>
                  {house.mascotEmoji} {house.name}
                </Link>
              )}
              <span className="pill bg-leaf">🌰 {profile.totalSeeds} Seeds</span>
              <span className="pill">🌳 {items.length} planted</span>
              {profile.role !== "member" && <span className="pill bg-sky">{profile.role === "super_admin" ? "Organiser" : "House admin"}</span>}
            </div>
            <p className="mt-2 text-xs text-ink/60">Ranger since {formatDate(profile.createdAt)}</p>
          </div>
          {isMe && <ShareButton path={`/u/${profile.handle}`} title={`${profile.name}'s Habitat Card on Wildlands`} />}
        </div>
        <div className="border-t border-white/50 px-6 py-4">
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-bold">{next ? `${next.min - profile.totalSeeds} Seeds to ${next.title}` : "Highest rank reached!"}</span>
            <span className="hidden text-ink/60 sm:inline">{RANKS.map((r) => r.title).join(" → ")}</span>
          </div>
          <ProgressBar value={rankProgress} color={color} label="Progress to next rank" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="tracks">
          <h2 id="tracks" className="mb-4 text-lg font-extrabold">
            Contributions by track
          </h2>
          <TrackChart seeds={seedsByTrack} quests={questsByTrack} />
        </section>
        <section className="card p-5" aria-labelledby="trees">
          <h2 id="trees" className="mb-3 text-lg font-extrabold">
            🌳 {isMe ? "Trees I planted" : `Trees ${profile.name.split(" ")[0]} planted`}
          </h2>
          {house && (
            <div data-tilt="6" className="overflow-hidden rounded-2xl border border-white/80 shadow-lg">
              <ForestSvg
                houseId={house.id}
                houseName={house.name}
                items={items.map(toSceneItem)}
                stageIndex={Math.min(2, stageIndexFor(house.totalSeeds))}
                compact
                className="block aspect-[1000/420] w-full"
                title={`Mini map of the ${items.length} items ${profile.name} planted in ${house.name}`}
              />
            </div>
          )}
          <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm">
            {[...items].reverse().map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span>{i.label}</span>
                <span className="shrink-0 text-ink/60">{i.seeds ? `+${i.seeds}` : "🌱"}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="badges">
        <h2 id="badges" className="mb-3 text-lg font-extrabold">
          Badges · {earned.length} / {badges.length}
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedBadges.map((b) => (
            <li key={b.id}>
              <BadgeTile badge={b} earned={earnedMap.has(b.id)} earnedAt={earnedMap.get(b.id)} />
            </li>
          ))}
        </ul>
      </section>

      {isMe && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card p-5" aria-labelledby="subs">
            <h2 id="subs" className="mb-3 text-lg font-extrabold">
              My submissions
            </h2>
            {mySubs.length === 0 ? (
              <p className="text-sm text-ink/70">
                Nothing yet. <Link href="/quests" className="font-bold text-forest underline">Pick a quest</Link>.
              </p>
            ) : (
              <ul className="divide-y divide-ink/10 text-sm">
                {mySubs.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 py-2">
                    <Link href={`/quests/${s.questId}`} className="hover:underline">
                      {s.questTitle}
                      <span className="block text-xs text-ink/60">{timeAgo(s.createdAt)}</span>
                    </Link>
                    <span className={`pill ${s.status === "approved" ? "bg-leaf-soft" : s.status === "pending" ? "bg-[#fff1c9]" : "bg-rose"}`}>
                      {s.status === "approved" ? "✅ Approved" : s.status === "pending" ? "⏳ Pending" : "↩️ Rejected"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="card p-5" aria-labelledby="edit">
            <h2 id="edit" className="mb-3 text-lg font-extrabold">
              Edit my profile
            </h2>
            <ActionForm action={updateProfile} className="space-y-3">
              <div>
                <label className="label" htmlFor="name">
                  Name
                </label>
                <input id="name" name="name" defaultValue={profile.name} required minLength={2} maxLength={40} className="field" />
              </div>
              <div>
                <label className="label" htmlFor="avatarUrl">
                  Photo link (optional)
                </label>
                <input id="avatarUrl" name="avatarUrl" type="url" defaultValue={profile.avatarUrl ?? ""} placeholder="https://…" className="field" />
              </div>
              <SubmitButton>Save profile</SubmitButton>
            </ActionForm>
          </section>
        </div>
      )}
    </div>
  );
}
