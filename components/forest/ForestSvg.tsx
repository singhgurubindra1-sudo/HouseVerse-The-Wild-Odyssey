/**
 * Draws one house's forest as a single SVG scene: sky, hills, ground, water,
 * every planted item, and the animals that appear as the house grows.
 * Pure component (no state) so it renders on the server or inside ForestScene.
 */
import type { KeyboardEvent } from "react";
import { artFor } from "@/lib/houses";
import { hashString } from "@/lib/game";
import { Animal, KIND_LABEL, Plant, SkyBird } from "./art";

export interface SceneItem {
  id: string;
  kind: string;
  x: number;
  y: number;
  plantedByName: string | null;
  label: string;
  createdAt: string;
}

export const W = 1000;
export const H = 420;
const HORIZON = 175;
const GROUND_TOP = 195;
const GROUND_BOTTOM = 405;

/** Where an item's feet land on screen, and how big it is (further away = smaller). */
export function place(item: { x: number; y: number }) {
  const depth = item.y / 1000;
  return { sx: item.x, sy: GROUND_TOP + depth * (GROUND_BOTTOM - GROUND_TOP), scale: 0.85 + depth * 0.85 };
}

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

function Water({ type, color }: { type: string; color: string }) {
  switch (type) {
    case "stream":
      return <path d="M 640 195 C 600 240, 720 270, 650 310 S 560 380, 620 420" stroke={color} strokeWidth="16" fill="none" strokeLinecap="round" />;
    case "river":
      return (
        <g>
          <path d="M 0 250 C 200 230, 320 300, 520 280 S 820 230, 1000 265 L 1000 300 C 820 270, 700 330, 520 318 S 200 270, 0 290 Z" fill={color} />
          <path d="M 120 268 h 40 M 600 290 h 50 M 860 262 h 40" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "pond":
      return (
        <g>
          <ellipse cx="760" cy="300" rx="120" ry="28" fill={color} />
          <path d="M 700 296 h 30 M 790 306 h 40" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "channels":
      return (
        <g fill={color}>
          <path d="M 0 225 C 250 215, 500 240, 1000 222 L 1000 240 C 500 258, 250 233, 0 243 Z" />
          <path d="M 0 320 C 300 300, 600 340, 1000 312 L 1000 338 C 600 362, 300 324, 0 346 Z" />
          <path d="M 0 390 C 300 380, 700 400, 1000 386 L 1000 420 L 0 420 Z" />
        </g>
      );
    case "waterfall":
      return (
        <g>
          <rect x="120" y="70" width="26" height="140" fill={color} opacity="0.9" />
          <path d="M 124 90 v 100 M 134 80 v 120 M 142 100 v 90" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" />
          <ellipse cx="133" cy="215" rx="70" ry="16" fill={color} />
          <path d="M 133 220 C 160 260, 90 300, 140 340 S 220 400, 180 420" stroke={color} strokeWidth="12" fill="none" />
        </g>
      );
    case "wetland":
      return (
        <g fill={color}>
          <ellipse cx="220" cy="270" rx="110" ry="18" />
          <ellipse cx="620" cy="330" rx="150" ry="22" />
          <ellipse cx="880" cy="250" rx="80" ry="14" />
        </g>
      );
    default:
      return null;
  }
}

export interface ForestSvgProps {
  houseId: string;
  houseName: string;
  items: SceneItem[];
  stageIndex: number;
  wilting?: boolean;
  /** Item ids that should play the "sprout" animation. */
  freshIds?: Set<string>;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Lighter version for thumbnails: no animals or sky details. */
  compact?: boolean;
  className?: string;
  title?: string;
}

export function ForestSvg({
  houseId,
  houseName,
  items,
  stageIndex,
  wilting = false,
  freshIds,
  selectedId,
  onSelect,
  compact = false,
  className,
  title,
}: ForestSvgProps) {
  const art = artFor(houseId);
  const ground = mix(art.groundDry, art.groundLush, Math.min(1, stageIndex / 3));
  const groundNear = mix(ground, "#2c4a1f", 0.15);
  const water = "#5fb3d9";
  const sorted = [...items].sort((a, b) => a.y - b.y);
  const interactive = Boolean(onSelect);
  // Only the newest items get keyboard focus, so tabbing stays manageable.
  const focusable = new Set(
    [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20).map((i) => i.id),
  );

  const tufts = stageIndex >= 1 ? Array.from({ length: 26 }, (_, i) => ({ x: (hashString(`${houseId}t${i}`) % 980) + 10, y: hashString(`${houseId}ty${i}`) % 1000 })) : [];
  const seeds = stageIndex === 0 ? Array.from({ length: 10 }, (_, i) => ({ x: (hashString(`${houseId}s${i}`) % 900) + 50, y: hashString(`${houseId}sy${i}`) % 1000 })) : [];

  const smallAnimals =
    stageIndex >= 3 && !compact
      ? [
          { kind: art.smallAnimal, x: 300 + (hashString(houseId) % 120), y: 780 },
          { kind: art.smallAnimal === "boat" ? "heron" : art.smallAnimal, x: 820, y: 620 },
        ]
      : [];
  const legends = stageIndex >= 4 ? art.legendary.map((kind, i) => ({ kind, x: 420 + i * 95, y: 900 - i * 60 })) : [];

  const handleKey = (id: string) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role={interactive ? "group" : "img"}
      aria-label={title ?? `${houseName} forest with ${items.length} planted items`}
      style={wilting ? { filter: "saturate(0.3) brightness(1.05) sepia(0.15)" } : undefined}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`sky-${houseId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={art.sky} />
          <stop offset="1" stopColor="#fbf8ee" />
        </linearGradient>
        <linearGradient id={`ground-${houseId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={ground} />
          <stop offset="1" stopColor={groundNear} />
        </linearGradient>
      </defs>

      <rect width={W} height={H} fill={`url(#sky-${houseId})`} />
      <g className="layer-far">
        <circle cx="880" cy="60" r="28" fill="#f6c445" />
        <circle cx="880" cy="60" r="40" fill="#f6c445" opacity="0.18" />
      </g>

      {art.hills && (
        <g className="layer-mid">
          <ellipse cx="160" cy={HORIZON + 30} rx="260" ry="110" fill={mix(ground, "#4f6f55", 0.45)} />
          <ellipse cx="520" cy={HORIZON + 40} rx="300" ry="95" fill={mix(ground, "#4f6f55", 0.35)} />
          <ellipse cx="900" cy={HORIZON + 30} rx="240" ry="105" fill={mix(ground, "#4f6f55", 0.5)} />
        </g>
      )}
      {art.mist && !compact && (
        <g fill="#ffffff" opacity="0.55" className="layer-mid">
          <rect x="40" y="150" width="380" height="14" rx="7" />
          <rect x="520" y="140" width="420" height="12" rx="6" />
        </g>
      )}

      <path d={`M0 ${HORIZON + 10} Q 250 ${HORIZON - 5} 500 ${HORIZON + 8} T 1000 ${HORIZON + 4} V ${H} H 0 Z`} fill={`url(#ground-${houseId})`} />

      {stageIndex >= 2 && <Water type={art.water} color={water} />}

      {stageIndex >= 3 && !compact && (
        <g className="layer-far">
          <g transform="translate(300 70)"><SkyBird /></g>
          <g transform="translate(330 58) scale(0.8)"><SkyBird /></g>
          <g transform="translate(610 92) scale(0.9)"><SkyBird /></g>
        </g>
      )}

      {seeds.map((s, i) => {
        const p = place(s);
        return <ellipse key={`s${i}`} cx={p.sx} cy={p.sy} rx={3 * p.scale} ry={2 * p.scale} fill="#6b4a2b" />;
      })}
      {tufts.map((t, i) => {
        const p = place(t);
        return (
          <path
            key={`t${i}`}
            d={`M${p.sx - 5} ${p.sy} l2 -${8 * p.scale} l2 ${8 * p.scale} l2 -${10 * p.scale} l2 ${10 * p.scale}`}
            stroke={mix(ground, "#2f5e25", 0.5)}
            strokeWidth="1.5"
            fill="none"
          />
        );
      })}

      <g className="layer-near">
      {[...sorted.map((item) => ({ type: "item" as const, item, y: item.y })), ...smallAnimals.map((a) => ({ type: "animal" as const, a, y: a.y })), ...legends.map((a) => ({ type: "legend" as const, a, y: a.y }))]
        .sort((a, b) => a.y - b.y)
        .map((entry, i) => {
          if (entry.type !== "item") {
            const p = place(entry.a);
            const big = entry.type === "legend" ? 1.25 : 0.9;
            return (
              <g key={`a${i}`} transform={`translate(${p.sx} ${p.sy}) scale(${p.scale * big})`} className={entry.type === "legend" ? "legend-walk" : undefined}>
                <Animal kind={entry.a.kind} />
              </g>
            );
          }
          const item = entry.item;
          const p = place(item);
          const selected = selectedId === item.id;
          const label = `${KIND_LABEL[item.kind] ?? "Plant"} planted by ${item.plantedByName ?? "a ranger"} for ${item.label}`;
          return (
            <g key={item.id} transform={`translate(${p.sx} ${p.sy}) scale(${p.scale})`}>
              <g
                className={`${freshIds?.has(item.id) ? "sprout" : ""} ${interactive ? "forest-item" : ""}`}
                onClick={interactive ? () => onSelect?.(item.id) : undefined}
                onKeyDown={interactive ? handleKey(item.id) : undefined}
                tabIndex={interactive && focusable.has(item.id) ? 0 : undefined}
                role={interactive ? "button" : undefined}
                aria-label={interactive ? label : undefined}
                aria-pressed={interactive ? selected : undefined}
              >
                {interactive && <rect x="-22" y="-70" width="44" height="72" fill="transparent" />}
                <Plant kind={item.kind} seed={item.id} />
                {selected && <circle cx="0" cy="2" r="9" fill="none" stroke="#f6c445" strokeWidth="3" />}
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
