/**
 * Flat-style SVG artwork for the forests. Every drawing sits on its "feet" at
 * (0, 0) and grows upwards, so it can be placed anywhere on the ground.
 * Pure functions, no state: used by both server and client components.
 */
import type { ReactElement } from "react";
import { hashString } from "@/lib/game";

const TRUNK = "#7a5230";
const TRUNK_DARK = "#5e3d22";

const GREENS = ["#2f7d3b", "#3d8f45", "#2a6e35", "#4a9b4c", "#367f3f"];
const FLOWER_COLORS = ["#f2a7c3", "#f6c445", "#f08a5d", "#b48ade", "#ffffff", "#ef6f8f"];

function pickFrom<T>(list: T[], seed: string): T {
  return list[hashString(seed) % list.length];
}

export const KIND_LABEL: Record<string, string> = {
  seedling: "First seed",
  sal: "Sal tree",
  teak: "Teak tree",
  rosewood: "Rosewood tree",
  bamboo: "Bamboo clump",
  grass: "Elephant grass",
  scrub: "Scrub bush",
  bush: "Bush",
  flower: "Wildflowers",
  orchid: "Orchids",
  rainforest: "Rainforest giant",
  mangrove: "Mangrove",
  evergreen: "Evergreen tree",
  coffee: "Coffee plant",
};

export const KIND_EMOJI: Record<string, string> = {
  seedling: "🌱",
  sal: "🌳",
  teak: "🌳",
  rosewood: "🌳",
  bamboo: "🎋",
  grass: "🌾",
  scrub: "🌿",
  bush: "🌿",
  flower: "🌼",
  orchid: "🌸",
  rainforest: "🌴",
  mangrove: "🌳",
  evergreen: "🌲",
  coffee: "☕",
};

/* ------------------------------------------------------------------ */
/* Plants                                                              */
/* ------------------------------------------------------------------ */

export function Plant({ kind, seed }: { kind: string; seed: string }): ReactElement {
  const green = pickFrom(GREENS, seed);
  switch (kind) {
    case "seedling":
      return (
        <g>
          <path d="M0 0 V-12" stroke="#5b8a3a" strokeWidth="2" />
          <ellipse cx="-5" cy="-12" rx="5" ry="2.6" fill="#7cc35b" transform="rotate(-25 -5 -12)" />
          <ellipse cx="5" cy="-14" rx="5" ry="2.6" fill="#6db14f" transform="rotate(25 5 -14)" />
          <ellipse cx="0" cy="0.5" rx="6" ry="1.6" fill="#6b4a2b" opacity="0.5" />
        </g>
      );
    case "sal":
      return (
        <g>
          <rect x="-3" y="-34" width="6" height="34" rx="2" fill={TRUNK} />
          <ellipse cx="0" cy="-58" rx="17" ry="30" fill={green} />
          <ellipse cx="-5" cy="-66" rx="7" ry="13" fill="#ffffff" opacity="0.12" />
        </g>
      );
    case "teak":
      return (
        <g>
          <rect x="-3" y="-30" width="6" height="30" rx="2" fill={TRUNK} />
          <circle cx="-14" cy="-38" r="14" fill={green} />
          <circle cx="14" cy="-38" r="14" fill={green} />
          <circle cx="0" cy="-48" r="17" fill={green} />
          <circle cx="-5" cy="-54" r="6" fill="#ffffff" opacity="0.12" />
        </g>
      );
    case "rosewood":
      return (
        <g>
          <rect x="-3" y="-28" width="6" height="28" rx="2" fill={TRUNK_DARK} />
          <circle cx="0" cy="-44" r="20" fill="#2b5e32" />
          <circle cx="-10" cy="-36" r="11" fill="#336b39" />
          <circle cx="11" cy="-38" r="10" fill="#336b39" />
        </g>
      );
    case "bamboo":
      return (
        <g stroke="#8fae3c" strokeWidth="3" strokeLinecap="round">
          <path d="M-8 0 V-58" />
          <path d="M-2 0 V-72" />
          <path d="M4 0 V-64" />
          <path d="M9 0 V-50" />
          <g stroke="#6f9a2c" strokeWidth="1.5">
            <path d="M-8 -40 l-9 -5 M-2 -55 l9 -6 M4 -46 l9 -4 M9 -32 l8 -6 M-2 -25 l-8 -5" />
          </g>
          <g stroke="#5e7f25" strokeWidth="3.4" opacity="0.6">
            <path d="M-8 -20 v1 M-2 -30 v1 M4 -24 v1 M-2 -50 v1" />
          </g>
        </g>
      );
    case "grass":
      return (
        <g>
          <path d="M-12 0 L-8 -40 L-5 0 Z" fill="#a8c35a" />
          <path d="M-6 0 L-1 -52 L2 0 Z" fill="#b9cf63" />
          <path d="M0 0 L5 -46 L8 0 Z" fill="#9cba4f" />
          <path d="M6 0 L12 -36 L13 0 Z" fill="#c2d36e" />
          <path d="M-3 -48 l-3 -8 M4 -42 l3 -8" stroke="#d8c78a" strokeWidth="2" />
        </g>
      );
    case "scrub":
      return (
        <g>
          <circle cx="-8" cy="-7" r="8" fill="#8a9a45" />
          <circle cx="6" cy="-8" r="9" fill="#7c8d3c" />
          <circle cx="0" cy="-13" r="8" fill="#94a44e" />
        </g>
      );
    case "bush":
      return (
        <g>
          <circle cx="-9" cy="-7" r="8" fill={green} />
          <circle cx="8" cy="-7" r="8" fill={green} />
          <circle cx="0" cy="-13" r="10" fill={green} />
          <circle cx="-3" cy="-16" r="3.5" fill="#ffffff" opacity="0.15" />
        </g>
      );
    case "flower": {
      const c = pickFrom(FLOWER_COLORS, seed);
      const c2 = pickFrom(FLOWER_COLORS, seed + "b");
      return (
        <g>
          <path d="M-5 0 V-12 M3 0 V-16 M8 0 V-10" stroke="#4f8a3a" strokeWidth="1.6" />
          <circle cx="-5" cy="-13" r="3.6" fill={c} />
          <circle cx="3" cy="-17" r="4" fill={c2} />
          <circle cx="8" cy="-11" r="3.2" fill={c} />
          <circle cx="3" cy="-17" r="1.4" fill="#f6d55c" />
        </g>
      );
    }
    case "orchid":
      return (
        <g>
          <path d="M0 0 C 2 -10, -4 -16, 2 -26" stroke="#4f8a3a" strokeWidth="1.8" fill="none" />
          <ellipse cx="-7" cy="-3" rx="7" ry="2.5" fill="#3f7f3a" />
          <circle cx="3" cy="-26" r="4.5" fill="#c86fc9" />
          <circle cx="-2" cy="-19" r="3.8" fill="#e19ae0" />
          <circle cx="4" cy="-13" r="3.2" fill="#c86fc9" />
        </g>
      );
    case "rainforest":
      return (
        <g>
          <rect x="-3.5" y="-60" width="7" height="60" rx="2" fill={TRUNK} />
          <ellipse cx="0" cy="-82" rx="24" ry="14" fill="#1f6a3a" />
          <ellipse cx="-12" cy="-64" rx="14" ry="8" fill="#2a7b44" />
          <ellipse cx="13" cy="-56" rx="12" ry="7" fill="#2a7b44" />
          <ellipse cx="0" cy="-94" rx="14" ry="8" fill="#2f8a4b" />
        </g>
      );
    case "mangrove":
      return (
        <g>
          <path d="M-14 0 Q -10 -14 -2 -16 M14 0 Q 10 -14 2 -16 M-6 0 Q -4 -10 0 -16 M6 0 Q 4 -10 0 -16" stroke={TRUNK} strokeWidth="2.2" fill="none" />
          <rect x="-2.5" y="-30" width="5" height="16" fill={TRUNK} />
          <ellipse cx="0" cy="-38" rx="20" ry="13" fill={green} />
          <ellipse cx="-9" cy="-33" rx="10" ry="7" fill="#2a6e35" />
        </g>
      );
    case "evergreen":
      return (
        <g>
          <rect x="-3" y="-14" width="6" height="14" fill={TRUNK} />
          <path d="M0 -70 L-16 -40 L16 -40 Z" fill="#256b3a" />
          <path d="M0 -56 L-20 -24 L20 -24 Z" fill="#2c7a42" />
          <path d="M0 -42 L-23 -10 L23 -10 Z" fill="#33874a" />
        </g>
      );
    case "coffee":
      return (
        <g>
          <circle cx="-6" cy="-9" r="8" fill="#2f6f3a" />
          <circle cx="6" cy="-10" r="8" fill="#367a40" />
          <circle cx="0" cy="-16" r="8" fill="#2f6f3a" />
          <circle cx="-4" cy="-11" r="1.8" fill="#c0392b" />
          <circle cx="5" cy="-14" r="1.8" fill="#c0392b" />
          <circle cx="2" cy="-7" r="1.8" fill="#d35400" />
        </g>
      );
    default:
      return (
        <g>
          <rect x="-3" y="-28" width="6" height="28" fill={TRUNK} />
          <circle cx="0" cy="-42" r="18" fill={green} />
        </g>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Animals                                                             */
/* ------------------------------------------------------------------ */

export function Animal({ kind }: { kind: string }): ReactElement {
  switch (kind) {
    case "elephant":
      return (
        <g>
          <rect x="-20" y="-16" width="8" height="16" rx="2" fill="#7d7f85" />
          <rect x="8" y="-16" width="8" height="16" rx="2" fill="#7d7f85" />
          <ellipse cx="-2" cy="-26" rx="26" ry="17" fill="#8e9097" />
          <circle cx="24" cy="-32" r="12" fill="#8e9097" />
          <ellipse cx="18" cy="-31" rx="8" ry="11" fill="#7d7f85" />
          <path d="M33 -30 Q 40 -16 34 -4" stroke="#8e9097" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="28" cy="-35" r="1.6" fill="#222" />
          <path d="M30 -24 l6 3" stroke="#f4efe2" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "lion":
      return (
        <g>
          <rect x="-16" y="-12" width="5" height="12" rx="2" fill="#c8913f" />
          <rect x="8" y="-12" width="5" height="12" rx="2" fill="#c8913f" />
          <ellipse cx="-2" cy="-18" rx="20" ry="10" fill="#d9a552" />
          <path d="M-22 -20 Q -32 -26 -30 -14" stroke="#d9a552" strokeWidth="3" fill="none" />
          <circle cx="18" cy="-26" r="12" fill="#8a5323" />
          <circle cx="20" cy="-25" r="7.5" fill="#e0b062" />
          <circle cx="22" cy="-27" r="1.3" fill="#222" />
        </g>
      );
    case "tiger":
      return (
        <g>
          <rect x="-16" y="-12" width="5" height="12" rx="2" fill="#e07b22" />
          <rect x="9" y="-12" width="5" height="12" rx="2" fill="#e07b22" />
          <ellipse cx="-2" cy="-18" rx="21" ry="10" fill="#f08a24" />
          <path d="M-12 -27 v8 M-5 -28 v9 M2 -28 v9 M9 -27 v8" stroke="#2b1d12" strokeWidth="2.2" />
          <path d="M-23 -20 Q -33 -28 -31 -12" stroke="#f08a24" strokeWidth="3" fill="none" />
          <circle cx="19" cy="-24" r="9" fill="#f08a24" />
          <circle cx="21" cy="-21" r="4" fill="#fff4e0" />
          <circle cx="21" cy="-26" r="1.3" fill="#222" />
          <path d="M14 -32 l2 4 M24 -31 l-2 4" stroke="#2b1d12" strokeWidth="1.6" />
        </g>
      );
    case "deer":
      return (
        <g>
          <path d="M-10 0 V-14 M-6 0 V-14 M8 0 V-14 M12 0 V-14" stroke="#8b5a2b" strokeWidth="2.2" />
          <ellipse cx="0" cy="-19" rx="15" ry="7" fill="#b07a45" />
          <path d="M12 -22 L18 -34" stroke="#b07a45" strokeWidth="5" strokeLinecap="round" />
          <ellipse cx="20" cy="-35" rx="5" ry="3.5" fill="#b07a45" />
          <path d="M18 -38 l-4 -10 m2 5 l-5 -2 M21 -38 l4 -10 m-2 5 l5 -2" stroke="#6b4a2b" strokeWidth="1.4" fill="none" />
          <circle cx="22" cy="-36" r="0.9" fill="#222" />
        </g>
      );
    case "rhino":
      return (
        <g>
          <rect x="-18" y="-13" width="8" height="13" rx="2" fill="#6f747a" />
          <rect x="8" y="-13" width="8" height="13" rx="2" fill="#6f747a" />
          <ellipse cx="-2" cy="-23" rx="24" ry="14" fill="#80868c" />
          <ellipse cx="24" cy="-20" rx="11" ry="8" fill="#80868c" />
          <path d="M31 -24 L35 -36 L36 -24 Z" fill="#e8e1cf" />
          <path d="M-10 -36 q 6 -3 12 0" stroke="#6f747a" strokeWidth="2" fill="none" />
          <circle cx="24" cy="-23" r="1.3" fill="#222" />
        </g>
      );
    case "redpanda":
      return (
        <g>
          <path d="M-12 -10 Q -26 -12 -24 -26" stroke="#c4512a" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M-20 -14 l3 -3 M-23 -20 l4 -1" stroke="#7a2e14" strokeWidth="2.4" />
          <ellipse cx="0" cy="-10" rx="13" ry="8" fill="#c4512a" />
          <circle cx="12" cy="-18" r="7.5" fill="#c4512a" />
          <circle cx="14" cy="-16" r="3.4" fill="#fbeee0" />
          <circle cx="13" cy="-20" r="1.1" fill="#222" />
          <path d="M-6 0 v-4 M6 0 v-4" stroke="#3b1d10" strokeWidth="3" />
        </g>
      );
    case "heron":
      return (
        <g>
          <path d="M-2 0 V-14 M3 0 V-14" stroke="#d4a35a" strokeWidth="1.5" />
          <ellipse cx="0" cy="-19" rx="9" ry="6" fill="#f7f7f2" />
          <path d="M6 -22 Q 10 -30 7 -36" stroke="#f7f7f2" strokeWidth="3" fill="none" />
          <circle cx="8" cy="-37" r="3" fill="#f7f7f2" />
          <path d="M10 -37 l7 1" stroke="#e0a32e" strokeWidth="1.6" />
        </g>
      );
    case "peacock":
      return (
        <g>
          <path d="M-4 -10 Q -28 -30 -6 -40 Q 10 -34 -4 -10" fill="#2f8f5b" />
          <circle cx="-12" cy="-28" r="2.2" fill="#2b63b5" />
          <circle cx="-6" cy="-34" r="2.2" fill="#2b63b5" />
          <ellipse cx="2" cy="-11" rx="7" ry="5" fill="#1f5fa8" />
          <path d="M6 -14 Q 9 -22 7 -26" stroke="#1f5fa8" strokeWidth="3" fill="none" />
          <path d="M0 0 V-6 M3 0 V-6" stroke="#8a6a3a" strokeWidth="1.3" />
        </g>
      );
    case "boat":
      return (
        <g>
          <path d="M-26 -6 Q 0 8 26 -6 L 20 -2 Q 0 6 -20 -2 Z" fill="#7a4b2a" />
          <path d="M-22 -6 Q 0 4 22 -6" stroke="#9c6a3f" strokeWidth="2" fill="none" />
          <path d="M4 -6 L10 -30" stroke="#5e3d22" strokeWidth="1.6" />
        </g>
      );
    default:
      return <g />;
  }
}

/** A small bird in flight, for the sky. */
export function SkyBird() {
  return <path d="M-7 0 Q -3.5 -5 0 0 Q 3.5 -5 7 0" stroke="#2f3b33" strokeWidth="1.6" fill="none" strokeLinecap="round" />;
}
