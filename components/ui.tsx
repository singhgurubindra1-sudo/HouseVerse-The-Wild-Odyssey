import Link from "next/link";
import type { ReactNode } from "react";
import { initials } from "@/lib/format";
import { TRACK_META, rankFor } from "@/lib/game";
import type { Badge, Profile, Track } from "@/lib/types";

export function PageHeader({ eyebrow, title, children, back }: { eyebrow?: string; title: string; children?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-6">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-forest hover:underline">
          ← {back.label}
        </Link>
      )}
      {eyebrow && <p className="pill mb-2 bg-leaf">{eyebrow}</p>}
      <h1 className="text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">{title}</h1>
      {children && <div className="mt-2 max-w-2xl text-ink/75">{children}</div>}
      <div className="mt-4 h-px w-full bg-gradient-to-r from-white via-white/70 to-transparent" />
    </header>
  );
}

export function ProgressBar({ value, color = "var(--color-forest)", label }: { value: number; color?: string; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-4 w-full overflow-hidden rounded-full border border-white/80 bg-white/40 shadow-[inset_0_2px_4px_rgba(14,52,30,0.18)]">
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${pct}%`, background: `linear-gradient(180deg, rgb(255 255 255 / 0.45), rgb(255 255 255 / 0) 55%), ${color}`, boxShadow: "0 0 12px -2px " + color }}
      />
    </div>
  );
}

export function Avatar({ profile, size = 40 }: { profile: Pick<Profile, "name" | "avatarUrl">; size?: number }) {
  if (profile.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={profile.avatarUrl} alt="" width={size} height={size} className="shrink-0 rounded-full border border-white/80 object-cover shadow-md" style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/80 bg-gradient-to-br from-[#c6ecaa] to-[#7cc35b] font-bold text-ink shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_4px_10px_-4px_rgba(14,52,30,0.5)]"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(profile.name)}
    </span>
  );
}

export function TrackPill({ track }: { track: Track }) {
  const meta = TRACK_META[track];
  return (
    <span className="pill" style={{ background: `${meta.color}22`, borderColor: meta.color, color: "#1d2a20" }}>
      <span aria-hidden>{meta.emoji}</span> {meta.label}
    </span>
  );
}

export function RankTitle({ seeds }: { seeds: number }) {
  return <span className="pill bg-sand">{rankFor(seeds).title}</span>;
}

export function BadgeTile({ badge, earned, earnedAt }: { badge: Badge; earned: boolean; earnedAt?: string }) {
  return (
    <div data-tilt="14" className={`card flex items-start gap-3 p-3 ${earned ? "" : "opacity-45 grayscale"}`} title={earnedAt ? `Earned ${new Date(earnedAt).toLocaleDateString()}` : undefined}>
      <span className={`text-3xl ${earned ? "pop drop-shadow-[0_6px_6px_rgba(14,52,30,0.35)]" : ""}`} aria-hidden>
        {badge.icon}
      </span>
      <div>
        <p className="font-bold leading-tight">
          {badge.name}
          {!earned && <span className="sr-only"> (not earned yet)</span>}
        </p>
        <p className="text-xs text-ink/70">{badge.description}</p>
      </div>
    </div>
  );
}

export function StatTile({ label, value, emoji }: { label: string; value: ReactNode; emoji: string }) {
  return (
    <div data-tilt className="card p-4">
      <p className="text-sm font-semibold text-ink/70">
        <span aria-hidden>{emoji}</span> {label}
      </p>
      <p className="pop-sm mt-1 text-2xl font-extrabold text-forest">{value}</p>
    </div>
  );
}

export function EmptyState({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-8 text-center">
      <span className="text-4xl" aria-hidden>
        {emoji}
      </span>
      <p className="text-lg font-bold">{title}</p>
      {children && <div className="text-sm text-ink/70">{children}</div>}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "error" | "warn"; children: ReactNode }) {
  const styles = {
    info: "bg-sky",
    success: "bg-leaf-soft",
    error: "bg-rose",
    warn: "bg-[#fff1c9]",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-2xl border border-white/75 px-4 py-3 text-sm shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_10px_24px_-14px_rgba(14,52,30,0.45)] backdrop-blur-xl ${styles}`}>
      {children}
    </div>
  );
}
