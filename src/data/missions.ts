import type { MissionDef, RunStats } from "../types";

export const MISSIONS: MissionDef[] = [
  {
    id: "coins-100",
    title: "Collect 100 Light Coins",
    target: 100,
    metric: "coins",
    rewardCoins: 150,
    rewardXp: 50,
  },
  {
    id: "dodge-25",
    title: "Dodge 25 obstacles",
    target: 25,
    metric: "dodges",
    rewardCoins: 100,
    rewardXp: 40,
  },
  {
    id: "scrolls-5",
    title: "Collect 5 Scripture Scrolls",
    target: 5,
    metric: "scrolls",
    rewardCoins: 120,
    rewardXp: 60,
  },
  {
    id: "shield-3",
    title: "Use Shield of Faith 3 times",
    target: 3,
    metric: "shields",
    rewardCoins: 130,
    rewardXp: 50,
  },
  {
    id: "run-1000",
    title: "Run 1,000 meters",
    target: 1000,
    metric: "distance",
    rewardCoins: 200,
    rewardXp: 80,
  },
  {
    id: "escape-60",
    title: "Escape the Accuser for 60 seconds",
    target: 60,
    metric: "surviveSeconds",
    rewardCoins: 180,
    rewardXp: 70,
  },
];

export function missionProgress(mission: MissionDef, stats: RunStats): number {
  switch (mission.metric) {
    case "coins":
      return stats.coins;
    case "dodges":
      return stats.dodges;
    case "scrolls":
      return stats.scrolls;
    case "shields":
      return stats.shieldsUsed;
    case "distance":
      return Math.floor(stats.distance);
    case "surviveSeconds":
      return Math.floor(stats.surviveSeconds);
  }
}
