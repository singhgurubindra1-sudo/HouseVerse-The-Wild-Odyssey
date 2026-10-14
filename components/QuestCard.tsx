import Link from "next/link";
import { formatDate } from "@/lib/format";
import { TRACK_META } from "@/lib/game";
import type { Quest, SubmissionStatus } from "@/lib/types";
import { TrackPill } from "./ui";

const STATUS: Record<SubmissionStatus, { label: string; cls: string }> = {
  pending: { label: "⏳ Waiting for approval", cls: "bg-[#fff1c9]" },
  approved: { label: "✅ Done: tree planted", cls: "bg-leaf-soft" },
  rejected: { label: "↩️ Try again", cls: "bg-rose" },
};

export function QuestCard({ quest, done, status, houseName }: { quest: Quest; done: number; status?: SubmissionStatus; houseName?: string }) {
  const meta = TRACK_META[quest.track];
  return (
    <Link href={`/quests/${quest.id}`} className="card flex h-full flex-col gap-2 p-4 transition hover:-translate-y-0.5" style={{ borderLeftWidth: 8, borderLeftColor: meta.color }}>
      <div className="flex items-start justify-between gap-2">
        <TrackPill track={quest.track} />
        <span className="pill bg-leaf text-sm">+{quest.seeds} 🌰</span>
      </div>
      <h3 className="text-lg font-extrabold leading-snug">{quest.title}</h3>
      <p className="line-clamp-2 text-sm text-ink/70">{quest.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-ink/70">
        {quest.endsAt && <span>📅 Until {formatDate(quest.endsAt)}</span>}
        <span>👣 {done} {done === 1 ? "ranger" : "rangers"} did this</span>
        {houseName && <span className="pill">{houseName} only</span>}
      </div>
      {status && <p className={`rounded-lg px-2 py-1 text-xs font-bold ${STATUS[status].cls}`}>{STATUS[status].label}</p>}
    </Link>
  );
}
