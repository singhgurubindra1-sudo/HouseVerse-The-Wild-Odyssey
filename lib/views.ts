import "server-only";
import { getRepo } from "./data";
import { isWilting, stageIndexFor } from "./game";
import type { ForestItem, House } from "./types";
import type { SceneItem } from "@/components/forest/ForestSvg";

export interface HouseSummary {
  house: House;
  items: SceneItem[];
  stageIndex: number;
  wilting: boolean;
  lastGrowth: string | null;
  growthThisWeek: number;
  members: number;
}

export function toSceneItem(i: ForestItem): SceneItem {
  return { id: i.id, kind: i.kind, x: i.x, y: i.y, plantedByName: i.plantedByName, label: i.label, createdAt: i.createdAt };
}

/** Every house with its forest, ranked by how alive it is this season. */
export async function getHouseSummaries(): Promise<HouseSummary[]> {
  const repo = await getRepo();
  const [houses, items, last, profiles] = await Promise.all([repo.listHouses(), repo.listForestItems(), repo.lastApprovedByHouse(), repo.listProfiles()]);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  return houses
    .map((house) => {
      const mine = items.filter((i) => i.houseId === house.id);
      return {
        house,
        items: mine.map(toSceneItem),
        stageIndex: stageIndexFor(house.totalSeeds),
        wilting: isWilting(last[house.id] ?? null),
        lastGrowth: last[house.id] ?? null,
        growthThisWeek: mine.filter((i) => i.createdAt >= weekAgo).length,
        members: profiles.filter((p) => p.houseId === house.id).length,
      };
    })
    .sort((a, b) => b.house.totalSeeds - a.house.totalSeeds);
}
