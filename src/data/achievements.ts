import type { AchievementDef, SaveData } from "../types";

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "faithfulRunner", name: "Faithful Runner", icon: "🏃", desc: "Run 5,000m total across all runs.", metric: "distance", target: 5000, reward: 300 },
  { id: "scriptureCollector", name: "Scripture Collector", icon: "📜", desc: "Collect 50 scripture scrolls.", metric: "scrolls", target: 50, reward: 300 },
  { id: "lionhearted", name: "Lionhearted", icon: "🦁", desc: "Reach a 25-combo in a single run.", metric: "bestCombo", target: 25, reward: 400 },
  { id: "kingdomBuilder", name: "Kingdom Builder", icon: "🏰", desc: "Collect 10 different boards.", metric: "boards", target: 10, reward: 500 },
  { id: "revivalRunner", name: "Revival Runner", icon: "🔥", desc: "Complete 25 runs.", metric: "runs", target: 25, reward: 300 },
  { id: "overcomer", name: "Overcomer", icon: "🏆", desc: "Score 5,000 in a single run.", metric: "bestScore", target: 5000, reward: 500 },
  { id: "livingWaterChampion", name: "Living Water Champion", icon: "🌊", desc: "Gather 2,000 Light Coins in total.", metric: "coins", target: 2000, reward: 400 },
];

/** Current progress value for an achievement metric. */
export function achievementProgress(a: AchievementDef, save: SaveData): number {
  switch (a.metric) {
    case "distance": return save.lifetime.distance;
    case "coins": return save.lifetime.coins;
    case "scrolls": return save.lifetime.scrolls;
    case "runs": return save.lifetime.runs;
    case "bestCombo": return save.lifetime.bestCombo;
    case "boards": return save.ownedBoards.length;
    case "bestScore": return save.bestScore;
  }
}

export function achievementComplete(a: AchievementDef, save: SaveData): boolean {
  return achievementProgress(a, save) >= a.target;
}

export function getAchievement(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
