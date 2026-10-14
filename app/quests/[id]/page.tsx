import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { formatDate, timeAgo } from "@/lib/format";
import { submitProof } from "@/app/actions/member";
import { ActionForm } from "@/components/ActionForm";
import { SubmitButton } from "@/components/client";
import { Notice, TrackPill } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quest = await (await getRepo()).getQuest(id).catch(() => null);
  return { title: quest?.title ?? "Quest" };
}

export default async function QuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const repo = await getRepo();
  const [quest, user, completions] = await Promise.all([repo.getQuest(id), getCurrentUser(), repo.questCompletions()]);
  if (!quest) notFound();
  const mine = user ? (await repo.listSubmissions({ memberId: user.id })).filter((s) => s.questId === quest.id) : [];
  const live = mine.find((s) => s.status !== "rejected");
  const lastRejected = mine.find((s) => s.status === "rejected");
  const now = new Date().toISOString();
  const open = quest.active && (!quest.startsAt || quest.startsAt <= now) && (!quest.endsAt || quest.endsAt >= now);
  const wrongHouse = Boolean(user && quest.houseId && quest.houseId !== user.houseId);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/quests" className="inline-flex items-center gap-1 text-sm font-semibold text-forest hover:underline">
        ← Back to the Questboard
      </Link>
      <article className="card space-y-3 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <TrackPill track={quest.track} />
          <span className="pill bg-leaf">+{quest.seeds} Seeds 🌰</span>
          {!open && <span className="pill bg-rose">Closed</span>}
        </div>
        <h1 className="text-3xl font-extrabold text-forest">{quest.title}</h1>
        <p className="whitespace-pre-line text-ink/85">{quest.description}</p>
        <p className="text-sm text-ink/70">
          {quest.endsAt && <>📅 Open until {formatDate(quest.endsAt)} · </>}👣 {completions[quest.id] ?? 0} rangers completed this
        </p>
      </article>

      {!user ? (
        <Notice>
          <Link href="/login" className="font-bold underline">
            Join your house
          </Link>{" "}
          to take on this quest.
        </Notice>
      ) : live?.status === "approved" ? (
        <Notice tone="success">
          ✅ <strong>Done!</strong> Approved {live.reviewedAt ? timeAgo(live.reviewedAt) : ""}. Your tree is growing in the{" "}
          <Link className="font-bold underline" href={`/house/${user.houseId}`}>
            forest
          </Link>
          .
        </Notice>
      ) : live?.status === "pending" ? (
        <Notice tone="warn">
          ⏳ <strong>Waiting for approval.</strong> You submitted this {timeAgo(live.createdAt)}. A house admin will review it soon.
        </Notice>
      ) : wrongHouse ? (
        <Notice tone="info">This quest is only for another house.</Notice>
      ) : !open ? (
        <Notice tone="info">This quest is not open right now.</Notice>
      ) : (
        <section className="card p-6" aria-labelledby="proof">
          <h2 id="proof" className="mb-1 text-xl font-extrabold">
            Submit your proof
          </h2>
          <p className="mb-4 text-sm text-ink/70">Add a photo, paste a link, or write a short note. One is enough.</p>
          {lastRejected && (
            <div className="mb-4">
              <Notice tone="error">
                Your last attempt was sent back{lastRejected.note ? <>: &ldquo;{lastRejected.note}&rdquo;</> : "."} Please try again.
              </Notice>
            </div>
          )}
          <ActionForm action={submitProof} className="space-y-4" encType="multipart/form-data">
            <input type="hidden" name="questId" value={quest.id} />
            <div>
              <label className="label" htmlFor="photo">
                📷 Photo
              </label>
              <input id="photo" name="photo" type="file" accept="image/*" className="field file:mr-3 file:rounded-full file:border-0 file:bg-leaf file:px-3 file:py-1 file:font-bold" />
            </div>
            <div>
              <label className="label" htmlFor="proofUrl">
                🔗 Link
              </label>
              <input id="proofUrl" name="proofUrl" type="url" inputMode="url" placeholder="https://…" className="field" />
            </div>
            <div>
              <label className="label" htmlFor="proofText">
                📝 Note (optional)
              </label>
              <textarea id="proofText" name="proofText" rows={3} maxLength={1000} className="field" placeholder="What did you do?" />
            </div>
            <SubmitButton pendingText="Sending…">Submit proof</SubmitButton>
          </ActionForm>
        </section>
      )}
    </div>
  );
}
