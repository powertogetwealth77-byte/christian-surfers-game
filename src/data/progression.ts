import type { SaveData } from "../types";
import { BOARDS } from "./boards";
import { ACHIEVEMENTS, achievementComplete } from "./achievements";
import { masteryFraction } from "./challenges";

const XP_PER_LEVEL = 500;

/** Account Level from lifetime XP — always climbing, never resets. */
export function accountLevel(save: SaveData): number {
  return Math.floor(save.totalXp / XP_PER_LEVEL) + 1;
}

/** Progress (0..1) toward the next account level. */
export function accountLevelProgress(save: SaveData): number {
  return (save.totalXp % XP_PER_LEVEL) / XP_PER_LEVEL;
}

/** Fraction of the board collection owned. */
export function boardFraction(save: SaveData): number {
  return BOARDS.length ? save.ownedBoards.length / BOARDS.length : 0;
}

/** Fraction of achievements completed. */
export function achievementFraction(save: SaveData): number {
  if (!ACHIEVEMENTS.length) return 0;
  const done = ACHIEVEMENTS.filter((a) => achievementComplete(a, save)).length;
  return done / ACHIEVEMENTS.length;
}

export interface KingdomRank {
  name: string;
  icon: string;
}

const RANKS: KingdomRank[] = [
  { name: "Seeker", icon: "🌱" },
  { name: "Believer", icon: "✨" },
  { name: "Disciple", icon: "🕊️" },
  { name: "Overcomer", icon: "🔥" },
  { name: "Kingdom Heir", icon: "👑" },
];

/** Overall completion across every progression track (0..1). */
export function overallProgress(save: SaveData): number {
  return (
    (boardFraction(save) + achievementFraction(save) + masteryFraction(save)) / 3
  );
}

/** Kingdom Rank derived from overall progress — the badge a player wears. */
export function kingdomRank(save: SaveData): KingdomRank {
  const p = overallProgress(save);
  const idx = Math.min(RANKS.length - 1, Math.floor(p * RANKS.length));
  return RANKS[idx];
}
