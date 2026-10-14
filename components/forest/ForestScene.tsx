"use client";

import Link from "next/link";
import { useState } from "react";
import { ForestSvg, type SceneItem } from "./ForestSvg";
import { KIND_EMOJI, KIND_LABEL } from "./art";
import { timeAgo } from "@/lib/format";

/** The interactive house map: tap any tree to see who planted it and why. */
export function ForestScene({
  houseId,
  houseName,
  items,
  stageIndex,
  wilting,
  freshIds,
  handles,
}: {
  houseId: string;
  houseName: string;
  items: SceneItem[];
  stageIndex: number;
  wilting: boolean;
  freshIds: string[];
  handles: Record<string, string>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(freshIds[freshIds.length - 1] ?? null);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border-2 border-ink/80 shadow-[0_4px_0_rgba(0,0,0,0.15)]">
        <ForestSvg
          houseId={houseId}
          houseName={houseName}
          items={items}
          stageIndex={stageIndex}
          wilting={wilting}
          freshIds={new Set(freshIds)}
          selectedId={selectedId}
          onSelect={setSelectedId}
          className="block h-auto w-full aspect-[1000/420] min-h-[220px]"
        />
      </div>
      <div aria-live="polite" className="mt-3 min-h-[3.5rem] rounded-xl border border-forest/20 bg-white/70 px-4 py-3 text-sm">
        {selected ? (
          <p>
            <span className="mr-1 text-lg" aria-hidden>
              {KIND_EMOJI[selected.kind] ?? "🌳"}
            </span>
            <strong>{KIND_LABEL[selected.kind] ?? "Plant"}</strong>, planted by{" "}
            {selected.plantedByName && handles[selected.id] ? (
              <Link className="font-semibold text-forest underline" href={`/u/${handles[selected.id]}`}>
                {selected.plantedByName}
              </Link>
            ) : (
              <strong>{selected.plantedByName ?? "a ranger"}</strong>
            )}{" "}
            for <em>{selected.label}</em> · <span className="text-ink/60" suppressHydrationWarning>{timeAgo(selected.createdAt)}</span>
          </p>
        ) : (
          <p className="text-ink/70">👆 Tap any tree, bush or flower to see who planted it.</p>
        )}
      </div>
    </div>
  );
}
