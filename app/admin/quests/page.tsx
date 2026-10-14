import Link from "next/link";
import { canManageHouse, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { deleteQuest, setQuestActive } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/client";
import { TrackPill } from "@/components/ui";
import { QuestForm } from "./QuestForm";

export const metadata = { title: "Manage quests" };

export default async function AdminQuestsPage() {
  const admin = await requireAdmin();
  const repo = await getRepo();
  const [quests, houses, completions] = await Promise.all([
    repo.listQuests({ includeInactive: true, houseId: admin.role === "super_admin" ? undefined : admin.houseId }),
    repo.listHouses(),
    repo.questCompletions(),
  ]);

  return (
    <div className="space-y-6">
      <section className="card p-5" aria-labelledby="new">
        <h1 id="new" className="mb-4 text-2xl font-extrabold text-forest">
          ➕ New quest
        </h1>
        <QuestForm houses={houses} admin={admin} />
      </section>

      <section aria-labelledby="all">
        <h2 id="all" className="mb-3 text-lg font-extrabold">
          All quests ({quests.length})
        </h2>
        <ul className="space-y-3">
          {quests.map((q) => {
            const editable = canManageHouse(admin, q.houseId);
            return (
              <li key={q.id} className={`card flex flex-wrap items-center gap-3 p-4 ${q.active ? "" : "opacity-70"}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <TrackPill track={q.track} />
                    <span className="pill bg-leaf">+{q.seeds}</span>
                    <span className="pill">{q.houseId ? `${houses.find((h) => h.id === q.houseId)?.name} only` : "All houses"}</span>
                    {!q.active && <span className="pill bg-rose">⏸ Paused</span>}
                  </div>
                  <p className="mt-1 font-extrabold">{q.title}</p>
                  <p className="text-xs text-ink/60">
                    {completions[q.id] ?? 0} completed{q.endsAt ? ` · ends ${formatDate(q.endsAt)}` : ""}
                  </p>
                </div>
                {editable ? (
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/quests/${q.id}`} className="btn btn-ghost btn-sm">
                      ✏️ Edit
                    </Link>
                    <ActionForm action={setQuestActive}>
                      <input type="hidden" name="id" value={q.id} />
                      <input type="hidden" name="active" value={q.active ? "false" : "true"} />
                      <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">
                        {q.active ? "⏸ Pause" : "▶️ Resume"}
                      </SubmitButton>
                    </ActionForm>
                    <ActionForm action={deleteQuest}>
                      <input type="hidden" name="id" value={q.id} />
                      <SubmitButton className="btn btn-danger btn-sm" pendingText="…" confirm={`Delete "${q.title}"? Trees already planted stay.`}>
                        🗑 Delete
                      </SubmitButton>
                    </ActionForm>
                  </div>
                ) : (
                  <span className="text-xs text-ink/60">Managed by organisers</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
