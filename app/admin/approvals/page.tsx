import Link from "next/link";
import { adminHouseScope, requireAdmin } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { reviewSubmissions } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { AutoRefresh, SubmitButton } from "@/components/client";
import { EmptyState, Notice, TrackPill } from "@/components/ui";
import { SelectAll } from "./SelectAll";

export const metadata = { title: "Approval queue" };

function isImage(url: string) {
  return url.startsWith("data:image/") || /\.(png|jpe?g|gif|webp|avif|heic)(\?|$)/i.test(url) || url.includes("/storage/v1/object/public/proofs/");
}

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const { done } = await searchParams;
  const admin = await requireAdmin();
  const scope = adminHouseScope(admin);
  const repo = await getRepo();
  const [pending, houses, recent] = await Promise.all([
    repo.listSubmissions({ status: "pending", houseId: scope }),
    repo.listHouses(),
    repo.listSubmissions({ houseId: scope, limit: 40 }),
  ]);
  const reviewed = recent
    .filter((s) => s.status !== "pending")
    .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""))
    .slice(0, 8);
  const houseName = (id: string) => houses.find((h) => h.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={15} />
      {done && <Notice tone="success">✅ {done}</Notice>}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-forest">Approval queue</h1>
          <p className="text-sm text-ink/70">Check the proof, then approve or send it back. Approving plants a tree with the member&apos;s name instantly.</p>
        </div>
        {pending.length > 1 && (
          <ActionForm id="bulk" action={reviewSubmissions} className="card flex flex-wrap items-center gap-3 p-3">
            <SelectAll form="bulk" />
            <SubmitButton name="decision" value="approved" className="btn btn-primary btn-sm" pendingText="Approving…">
              ✅ Approve selected
            </SubmitButton>
          </ActionForm>
        )}
      </div>

      {pending.length === 0 ? (
        <EmptyState emoji="🌿" title="All caught up!">
          No proofs are waiting. New submissions appear here automatically.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {pending.map((s) => (
            <li key={s.id} className="card flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <input type="checkbox" name="ids" value={s.id} form="bulk" className="mt-1 size-5 accent-[#2d6a3e]" aria-label={`Select ${s.memberName}: ${s.questTitle}`} />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold leading-tight">{s.questTitle}</p>
                  <p className="text-sm">
                    by{" "}
                    <Link href={`/u/${s.memberHandle}`} className="font-semibold text-forest hover:underline">
                      {s.memberName}
                    </Link>{" "}
                    · {houseName(s.houseId)} · {timeAgo(s.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <TrackPill track={s.questTrack} />
                  <span className="pill bg-leaf">+{s.questSeeds}</span>
                </div>
              </div>
              <div className="rounded-xl bg-cream p-3 text-sm">
                {s.proofUrl &&
                  (isImage(s.proofUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.proofUrl} alt={`Proof photo from ${s.memberName}`} className="max-h-56 rounded-lg border border-ink/20 object-contain" />
                  ) : (
                    <a href={s.proofUrl} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-forest underline">
                      🔗 {s.proofUrl}
                    </a>
                  ))}
                {s.proofText && <p className="mt-1">📝 {s.proofText}</p>}
                {!s.proofUrl && !s.proofText && <p className="text-ink/60">No proof attached.</p>}
              </div>
              <ActionForm action={reviewSubmissions} className="space-y-2">
                <input type="hidden" name="ids" value={s.id} />
                <label className="sr-only" htmlFor={`note-${s.id}`}>
                  Optional note to {s.memberName}
                </label>
                <input id={`note-${s.id}`} name="note" placeholder="Optional note (shown to the member if rejected)" className="field text-sm" maxLength={300} />
                <div className="flex gap-2">
                  <SubmitButton name="decision" value="approved" className="btn btn-primary flex-1" pendingText="Planting…">
                    ✅ Approve
                  </SubmitButton>
                  <SubmitButton name="decision" value="rejected" className="btn btn-ghost flex-1" pendingText="Sending back…">
                    ↩️ Reject
                  </SubmitButton>
                </div>
              </ActionForm>
            </li>
          ))}
        </ul>
      )}

      {reviewed.length > 0 && (
        <section className="card p-4" aria-labelledby="done">
          <h2 id="done" className="mb-2 font-extrabold">
            Recently reviewed
          </h2>
          <ul className="divide-y divide-ink/10 text-sm">
            {reviewed.map((s) => (
              <li key={s.id} className="flex justify-between gap-2 py-1.5">
                <span>
                  {s.status === "approved" ? "✅" : "↩️"} {s.memberName}: {s.questTitle}
                </span>
                <span className="shrink-0 text-xs text-ink/60">{s.reviewedAt ? timeAgo(s.reviewedAt) : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
