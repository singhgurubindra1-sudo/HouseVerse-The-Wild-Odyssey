import Link from "next/link";
import { adminHouseScope, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { rankFor } from "@/lib/game";
import { timeAgo } from "@/lib/format";
import { awardBonus, setRole } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/client";
import { Avatar, EmptyState } from "@/components/ui";

export const metadata = { title: "Members" };

const ROLE_LABEL = { member: "Member", house_admin: "House admin", super_admin: "Super admin" } as const;

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const admin = await requireAdmin();
  const repo = await getRepo();
  const [members, houses, lastSub] = await Promise.all([repo.listProfiles({ houseId: adminHouseScope(admin), search: q }), repo.listHouses(), repo.lastSubmissionByMember()]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-forest">Members</h1>
          <p className="text-sm text-ink/70">Search, open a profile, give bonus Seeds{admin.role === "super_admin" ? " or change someone's role" : ""}.</p>
        </div>
        <form role="search" className="flex gap-2">
          <label htmlFor="q" className="sr-only">
            Search members
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Search by name…" className="field" />
          <button className="btn btn-ghost" type="submit">
            🔍
          </button>
        </form>
      </div>

      {members.length === 0 ? (
        <EmptyState emoji="🔍" title="No members found" />
      ) : (
        <ul className="space-y-2">
          {members.map((m) => {
            const house = houses.find((h) => h.id === m.houseId);
            return (
              <li key={m.id} className="card">
                <details>
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
                    <Avatar profile={m} size={38} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{m.name}</span>
                      <span className="block text-xs text-ink/60">
                        {house ? `${house.mascotEmoji} ${house.name}` : "No house"} · {rankFor(m.totalSeeds).title} · {lastSub[m.id] ? `last quest ${timeAgo(lastSub[m.id])}` : "no quests yet"}
                      </span>
                    </span>
                    {m.role !== "member" && <span className="pill bg-sky">{ROLE_LABEL[m.role]}</span>}
                    <span className="pill bg-leaf">🌰 {m.totalSeeds}</span>
                    <span aria-hidden className="text-ink/50">▾</span>
                  </summary>
                  <div className="grid gap-4 border-t-2 border-ink/10 p-4 md:grid-cols-[1fr_1fr_auto]">
                    <ActionForm action={awardBonus} resetOnSuccess className="space-y-2">
                      <input type="hidden" name="memberId" value={m.id} />
                      <p className="text-sm font-bold">🎁 Bonus Seeds</p>
                      <div className="flex gap-2">
                        <input name="seeds" type="number" min={1} max={500} defaultValue={10} aria-label="Seeds" className="field w-24" />
                        <input name="reason" required placeholder="Why? e.g. organised the meetup" aria-label="Reason" className="field" />
                      </div>
                      <SubmitButton className="btn btn-leaf btn-sm">Give Seeds</SubmitButton>
                    </ActionForm>
                    {admin.role === "super_admin" ? (
                      <ActionForm action={setRole} className="space-y-2">
                        <input type="hidden" name="memberId" value={m.id} />
                        <label className="block text-sm font-bold" htmlFor={`role-${m.id}`}>
                          🛡️ Role
                        </label>
                        <select id={`role-${m.id}`} name="role" defaultValue={m.role} className="field">
                          <option value="member">Member</option>
                          <option value="house_admin">House admin (their own house)</option>
                          <option value="super_admin">Super admin (all houses)</option>
                        </select>
                        <SubmitButton className="btn btn-ghost btn-sm">Change role</SubmitButton>
                      </ActionForm>
                    ) : (
                      <div />
                    )}
                    <Link href={`/u/${m.handle}`} className="btn btn-ghost btn-sm self-start">
                      View Habitat Card →
                    </Link>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
