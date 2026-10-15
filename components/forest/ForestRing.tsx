"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ForestSvg, type SceneItem } from "./ForestSvg";
import { STAGES } from "@/lib/game";

export interface RingHouse {
  id: string;
  name: string;
  emoji: string;
  color: string;
  seeds: number;
  stageIndex: number;
  wilting: boolean;
  items: SceneItem[];
}

/** The nine forests standing in a slowly turning 3D ring. Arrows spin it by hand. */
export function ForestRing({ houses }: { houses: RingHouse[] }) {
  const step = 360 / houses.length;
  const [index, setIndex] = useState<number | null>(null); // null = autoplay
  const spin = (delta: number) => setIndex((i) => (i ?? 0) + delta);
  const front = index === null ? null : houses[((index % houses.length) + houses.length) % houses.length];

  return (
    <div>
      <div className="ring-scene" role="region" aria-roledescription="carousel" aria-label="The nine house forests">
        <div className="ring-floor" aria-hidden />
        <div className={`wl-ring ${index === null ? "autoplay" : ""}`} style={{ "--spin": `${-(index ?? 0) * step}deg` } as CSSProperties}>
          {houses.map((h, i) => (
            <Link
              key={h.id}
              href={`/house/${h.id}`}
              className="ring-panel block overflow-hidden rounded-2xl border border-white/80 bg-white/55 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_24px_40px_-20px_rgba(14,52,30,0.55)]"
              style={{ "--angle": `${i * step}deg` } as CSSProperties}
              aria-label={`${h.name}: ${STAGES[h.stageIndex].name}, ${h.seeds} Seeds`}
              tabIndex={index === null || front?.id === h.id ? 0 : -1}
            >
              <ForestSvg houseId={h.id} houseName={h.name} items={h.items} stageIndex={h.stageIndex} wilting={h.wilting} compact className="block aspect-[1000/520] w-full" />
              <span className="flex items-center justify-between gap-1 px-2.5 py-1.5 text-xs font-extrabold sm:text-sm" style={{ color: h.color }}>
                <span className="truncate">
                  <span aria-hidden>{h.emoji}</span> {h.name}
                </span>
                <span className="shrink-0 text-ink/70">{STAGES[h.stageIndex].emoji}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-1 flex items-center justify-center gap-3">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => spin(-1)} aria-label="Previous forest">
          ◀
        </button>
        <span className="pill min-w-32 justify-center" aria-live="polite">
          {front ? `${front.emoji} ${front.name} · ${front.seeds} Seeds` : "Nine living forests"}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => spin(1)} aria-label="Next forest">
          ▶
        </button>
      </div>
    </div>
  );
}
