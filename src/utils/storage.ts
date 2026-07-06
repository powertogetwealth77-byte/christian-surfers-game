import type { SaveData } from "../types";
import {
  DEFAULT_FAMILY,
  DEFAULT_PROFILE_ID,
  type FamilyData,
  type FamilyProfile,
} from "../data/family";

const KEY = "christian-surfers-save-v1";
const FAMILY_KEY = "christian-surfers-family-v1";

export const DEFAULT_SAVE: SaveData = {
  totalCoins: 0,
  totalXp: 0,
  bestScore: 0,
  bestDistance: 0,
  selectedCharacter: "zion",
  ownedCharacters: ["zion", "grace", "judah", "kai"],
  ownedBoards: ["john316"],
  equippedBoard: "john316",
  ownedShoes: ["gospel"],
  equippedShoe: "gospel",
  selectedVenue: "boardwalk",
  lastDailyClaim: "",
  dailyStreak: 0,
  lifetime: {
    distance: 0,
    coins: 0,
    scrolls: 0,
    runs: 0,
    bestCombo: 0,
    perfectDodges: 0,
    playSeconds: 0,
  },
  claimedAchievements: [],
  completedMissions: [],
  unlockedScriptures: [],
  scriptureMastery: {},
  scriptureHeard: {},
  scriptureLastHeard: {},
  favoriteScriptures: [],
  upgrades: {},
  friendship: {},
  scriptureBadges: 0,
  scriptureStreakDays: 0,
  scriptureStreakLastDate: "",
  scriptureStreakBest: 0,
  finishVictories: 0,
  finishCorrectAnswers: 0,
  finishScriptureTier: 1,
  finishVictoryStreak: 0,
  finishLongestStreak: 0,
  finishAttempts: 0,
  /** Phase 16.5 — Premium cosmetics purchase history and shard tracking. */
  cosmeticPurchases: [],
  cosmeticShards: {},
  settings: {
    muted: false,
    music: true,
    haptics: true,
    screenShake: true,
    voiceScriptures: false,
    voiceVolume: 0.8,
    voiceGender: "auto",
    scriptureIntervalMin: 3,
    scriptureMode: "full",
  },
};

/** Merge a raw parsed blob over the defaults (keeps new fields future-safe). */
function hydrate(parsed: Partial<SaveData>): SaveData {
  return {
    ...structuredClone(DEFAULT_SAVE),
    ...parsed,
    lifetime: { ...DEFAULT_SAVE.lifetime, ...(parsed.lifetime ?? {}) },
    settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings ?? {}) },
    friendship: { ...(parsed.friendship ?? {}) },
    // Phase 16 defaults — safe for players with no finish victories yet
    finishVictories: parsed.finishVictories ?? 0,
    finishCorrectAnswers: parsed.finishCorrectAnswers ?? 0,
    finishScriptureTier: parsed.finishScriptureTier ?? 1,
    finishVictoryStreak: parsed.finishVictoryStreak ?? 0,
    finishLongestStreak: parsed.finishLongestStreak ?? 0,
    // Codex review fix (PR #3, P2) — existing saves predate this field, so
    // fall back to 0 (the dashboard's accuracy calc further falls back to
    // finishVictories for saves that have plays but no attempts recorded).
    finishAttempts: parsed.finishAttempts ?? 0,
    // Phase 16.5 — Cosmetics purchase tracking
    cosmeticPurchases: parsed.cosmeticPurchases ?? [],
    cosmeticShards: { ...DEFAULT_SAVE.cosmeticShards, ...(parsed.cosmeticShards ?? {}) },
  };
}

// ── Family / profile plumbing (Phase 14 §2) ─────────────────────────────────

export function loadFamily(): FamilyData {
  try {
    const raw = localStorage.getItem(FAMILY_KEY);
    if (!raw) return structuredClone(DEFAULT_FAMILY);
    const parsed = JSON.parse(raw) as Partial<FamilyData>;
    const profiles = Array.isArray(parsed.profiles) && parsed.profiles.length
      ? (parsed.profiles as FamilyProfile[])
      : structuredClone(DEFAULT_FAMILY.profiles);
    const activeProfileId =
      parsed.activeProfileId && profiles.some((p) => p.id === parsed.activeProfileId)
        ? parsed.activeProfileId
        : profiles[0].id;
    return { version: 1, activeProfileId, profiles };
  } catch {
    return structuredClone(DEFAULT_FAMILY);
  }
}

export function persistFamily(family: FamilyData) {
  try {
    localStorage.setItem(FAMILY_KEY, JSON.stringify(family));
  } catch {
    // Private browsing — family roster lives in memory for this session.
  }
}

/**
 * The localStorage key holding a given profile's game save. The default/legacy
 * profile maps to the ORIGINAL key so existing progress is preserved exactly.
 */
function saveKeyFor(profileId: string): string {
  return profileId === DEFAULT_PROFILE_ID ? KEY : `${KEY}::${profileId}`;
}

/** The id of the profile currently being played. */
export function activeProfileId(): string {
  return loadFamily().activeProfileId;
}

// ── Save load / persist (profile-aware) ──────────────────────────────────────

/** Load the active profile's save (legacy callers get identical behavior). */
export function loadSave(): SaveData {
  return loadSaveFor(activeProfileId());
}

export function loadSaveFor(profileId: string): SaveData {
  try {
    const raw = localStorage.getItem(saveKeyFor(profileId));
    if (!raw) return structuredClone(DEFAULT_SAVE);
    return hydrate(JSON.parse(raw) as Partial<SaveData>);
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

/** Persist the active profile's save. */
export function persistSave(save: SaveData) {
  persistSaveFor(activeProfileId(), save);
}

export function persistSaveFor(profileId: string, save: SaveData) {
  try {
    localStorage.setItem(saveKeyFor(profileId), JSON.stringify(save));
  } catch {
    // Private browsing or storage full — play session still works in memory.
  }
}

/** Switch the active profile. Each profile's save is untouched on disk. */
export function switchActiveProfile(profileId: string): FamilyData {
  const family = loadFamily();
  if (!family.profiles.some((p) => p.id === profileId)) return family;
  const next: FamilyData = { ...family, activeProfileId: profileId };
  persistFamily(next);
  return next;
}

/** Add a profile (and seed an empty save for it). Returns the new family. */
export function addProfile(profile: FamilyProfile): FamilyData {
  const family = loadFamily();
  const next: FamilyData = {
    ...family,
    profiles: [...family.profiles, profile],
  };
  persistFamily(next);
  persistSaveFor(profile.id, structuredClone(DEFAULT_SAVE));
  return next;
}

/** Remove a child profile and its save blob (parent profile is protected). */
export function removeProfile(profileId: string): FamilyData {
  const family = loadFamily();
  const target = family.profiles.find((p) => p.id === profileId);
  if (!target || target.role === "parent") return family;
  const profiles = family.profiles.filter((p) => p.id !== profileId);
  const activeProfileId =
    family.activeProfileId === profileId ? profiles[0].id : family.activeProfileId;
  const next: FamilyData = { ...family, activeProfileId, profiles };
  persistFamily(next);
  try {
    localStorage.removeItem(saveKeyFor(profileId));
  } catch {
    // ignore
  }
  return next;
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
