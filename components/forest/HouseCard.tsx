import Link from "next/link";
import { ForestSvg } from "./ForestSvg";
import { STAGES, stageProgress, nextStage } from "@/lib/game";
import { ProgressBar } from "@/components/ui";
import type { HouseSummary } from "@/lib/views";

export function HouseCard({ summary, rank }: { summary: HouseSummary; rank?: number }) {
  const { house, items, stageIndex, wilting } = summary;
  const stage = STAGES[stageIndex];
  const next = nextStage(house.totalSeeds);
  return (
    <Link href={`/house/${house.id}`} data-tilt className="card group block overflow-hidden" aria-label={`${house.name}: ${stage.name}, ${house.totalSeeds} Seeds`}>
      <div className="relative overflow-hidden rounded-t-[1.5rem]">
        <ForestSvg houseId={house.id} houseName={house.name} items={items} stageIndex={stageIndex} wilting={wilting} compact className="block aspect-[1000/420] w-full" />
        {rank !== undefined && <span className="pill absolute left-2 top-2 bg-sun">#{rank}</span>}
        {wilting && <span className="pill absolute right-2 top-2 bg-rose">🥀 needs rangers</span>}
      </div>
      <div className="border-t border-white/70 p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold" style={{ color: house.colorPrimary }}>
            <span aria-hidden>{house.mascotEmoji}</span> {house.name}
          </h3>
          <span className="text-sm font-bold">🌰 {house.totalSeeds}</span>
        </div>
        <p className="mb-2 text-xs text-ink/70">
          {stage.emoji} {stage.name}
          {next ? ` · ${next.min - house.totalSeeds} to ${next.name}` : " · legendary animal has returned!"}
        </p>
        <ProgressBar value={stageProgress(house.totalSeeds)} color={house.colorPrimary} label={`${house.name} progress to next stage`} />
      </div>
    </Link>
  );
}
