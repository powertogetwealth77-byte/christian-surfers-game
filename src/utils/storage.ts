import type { SaveData } from "../types";

const KEY = "christian-surfers-save-v1";

export const DEFAULT_SAVE: SaveData = {
  totalCoins: 0,
  totalXp: 0,
  bestScore: 0,
  bestDistance: 0,
  selectedCharacter: "zion",
  ownedBoards: ["john316"],
  equippedBoard: "john316",
  lastDailyClaim: "",
  dailyStreak: 0,
  lifetime: { distance: 0, coins: 0, scrolls: 0, runs: 0, bestCombo: 0, perfectDodges: 0 },
  claimedAchievements: [],
  completedMissions: [],
  unlockedScriptures: [],
  upgrades: {},
  settings: {
    muted: false,
    music: true,
    haptics: true,
    screenShake: true,
    voiceScriptures: false,
  },
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...structuredClone(DEFAULT_SAVE),
      ...parsed,
      settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function persistSave(save: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Private browsing or storage full — play session still works in memory.
  }
}

/** Local calendar day key, e.g. "2026-06-13". */
export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Yesterday's key — used to continue a daily streak. */
export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}
