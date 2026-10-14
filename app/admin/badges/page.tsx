import { adminHouseScope, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { describeRule, TRACK_META } from "@/lib/game";
import { TRACKS } from "@/lib/types";
import { awardBadge, createBadge } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/client";

export const metadata = { title: "Badges" };

export default async function AdminBadgesPage() {
  const admin = await requireAdmin();
  const repo = await getRepo();
  const [badges, members] = await Promise.all([repo.listBadges(), repo.listProfiles({ houseId: adminHouseScope(admin) })]);
  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="award">
          <h1 id="award" className="mb-1 text-xl font-extrabold text-forest">
            🎁 Award a badge by hand
          </h1>
          <p className="mb-4 text-sm text-ink/70">For things the system can&apos;t see, like bringing a friend (Guide) or being top 3 for the season (Legend).</p>
          <ActionForm action={awardBadge} className="space-y-3">
            <div>
              <label className="label" htmlFor="memberId">
                Member
              </label>
              <select id="memberId" name="memberId" required className="field">
                {sortedMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="badgeId">
                Badge
              </label>
              <select id="badgeId" name="badgeId" required className="field">
                {badges.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.icon} {b.name}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton>Award badge</SubmitButton>
          </ActionForm>
        </section>

        <section className="card p-5" aria-labelledby="create">
          <h2 id="create" className="mb-1 text-xl font-extrabold text-forest">
            ✨ Create a badge
          </h2>
          {admin.role !== "super_admin" ? (
            <p className="text-sm text-ink/70">Only organisers (super admins) can create new badges, so every house plays by the same rules.</p>
          ) : (
            <ActionForm action={createBadge} resetOnSuccess className="grid grid-cols-[5rem_1fr] gap-3">
              <div>
                <label className="label" htmlFor="icon">
                  Icon
                </label>
                <input id="icon" name="icon" defaultValue="🏅" maxLength={8} className="field text-center text-xl" />
              </div>
              <div>
                <label className="label" htmlFor="name">
                  Name
                </label>
                <input id="name" name="name" required maxLength={40} placeholder="Night Owl" className="field" />
              </div>
              <div className="col-span-2">
                <label className="label" htmlFor="description">
                  Description
                </label>
                <input id="description" name="description" maxLength={120} placeholder="What it is for" className="field" />
              </div>
              <div className="col-span-2 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label" htmlFor="ruleType">
                    Rule
                  </label>
                  <select id="ruleType" name="ruleType" className="field">
                    <option value="manual">Awarded by hand</option>
                    <option value="quests_total">Total approved quests</option>
                    <option value="track_count">Quests in one track</option>
                    <option value="all_tracks">One quest in each track</option>
                    <option value="streak_weeks">Weeks in a row</option>
                    <option value="onboarding">Finished onboarding</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="count">
                    How many
                  </label>
                  <input id="count" name="count" type="number" min={1} max={100} defaultValue={5} className="field" />
                </div>
                <div>
                  <label className="label" htmlFor="track">
                    Track (if needed)
                  </label>
                  <select id="track" name="track" className="field">
                    {TRACKS.map((t) => (
                      <option key={t} value={t}>
                        {TRACK_META[t].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-span-2">
                <SubmitButton>Create badge</SubmitButton>
              </div>
            </ActionForm>
          )}
        </section>
      </div>

      <section aria-labelledby="list">
        <h2 id="list" className="mb-3 text-lg font-extrabold">
          All badges
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <li key={b.id} className="card flex items-start gap-3 p-3">
              <span className="text-2xl" aria-hidden>
                {b.icon}
              </span>
              <div>
                <p className="font-bold">{b.name}</p>
                <p className="text-xs text-ink/70">{b.description}</p>
                <p className="mt-1 text-xs font-semibold text-forest">Rule: {describeRule(b.rule)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
