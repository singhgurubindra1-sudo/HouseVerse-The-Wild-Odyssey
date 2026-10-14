import { TRACK_META } from "@/lib/game";
import { TRACKS, type Track } from "@/lib/types";

/** Three-colour donut of a member's Tech / Sports / Culture Seeds. */
export function TrackChart({ seeds, quests }: { seeds: Record<Track, number>; quests: Record<Track, number> }) {
  const total = TRACKS.reduce((sum, t) => sum + seeds[t], 0);
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const summary = TRACKS.map((t) => `${TRACK_META[t].label} ${seeds[t]} Seeds`).join(", ");
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 120 120" className="size-36 shrink-0" role="img" aria-label={`Contributions: ${summary}`}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1d2a2014" strokeWidth="18" />
        {total > 0 &&
          TRACKS.map((t) => {
            const len = (seeds[t] / total) * c;
            const el = (
              <circle
                key={t}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={TRACK_META[t].color}
                strokeWidth="18"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 60 60)"
              />
            );
            offset += len;
            return el;
          })}
        <text x="60" y="57" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1d2a20">
          {total}
        </text>
        <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#1d2a20aa">
          quest Seeds
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {TRACKS.map((t) => (
          <li key={t} className="flex items-center gap-2">
            <span className="inline-block size-3.5 rounded-sm border border-ink/40" style={{ background: TRACK_META[t].color }} aria-hidden />
            <span className="w-20 font-bold">
              {TRACK_META[t].emoji} {TRACK_META[t].label}
            </span>
            <span>
              {seeds[t]} Seeds · {quests[t]} {quests[t] === 1 ? "quest" : "quests"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
