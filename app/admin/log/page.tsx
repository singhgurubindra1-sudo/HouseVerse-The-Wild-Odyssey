import { adminHouseScope, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "Activity log" };

const ICON: Record<string, string> = {
  approved: "✅",
  rejected: "↩️",
  bonus: "🎁",
  badge_awarded: "🏅",
  badge_created: "✨",
  quest_created: "➕",
  quest_updated: "✏️",
  quest_deleted: "🗑",
  lore_updated: "📜",
  trivia_updated: "❓",
  role_changed: "🛡️",
  onboarded: "🌱",
};

export default async function ActivityLogPage() {
  const admin = await requireAdmin();
  const repo = await getRepo();
  const [entries, houses] = await Promise.all([repo.listActivity({ houseId: adminHouseScope(admin), limit: 200 }), repo.listHouses()]);
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-forest">Activity log</h1>
      <p className="mb-4 text-sm text-ink/70">Every approval, rejection and points change, with who did it and when. Nothing here can be edited.</p>
      {entries.length === 0 ? (
        <EmptyState emoji="🗒️" title="Nothing logged yet" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Admin activity, newest first</caption>
            <thead className="glass-head">
              <tr>
                <th scope="col" className="px-4 py-2.5">When</th>
                <th scope="col" className="px-4 py-2.5">Who</th>
                <th scope="col" className="px-4 py-2.5">What</th>
                <th scope="col" className="px-4 py-2.5">House</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="glass-row border-t border-white/40">
                  <td className="whitespace-nowrap px-4 py-2 text-ink/70">
                    {new Date(e.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-2 font-semibold">{e.actorName ?? "System"}</td>
                  <td className="px-4 py-2">
                    <span aria-hidden>{ICON[e.action] ?? "•"}</span> {e.details}
                  </td>
                  <td className="px-4 py-2">{houses.find((h) => h.id === e.houseId)?.name ?? "All"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
