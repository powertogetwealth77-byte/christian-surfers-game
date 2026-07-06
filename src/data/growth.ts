/**
 * Phase 14 §1 + §5 — Derived family/parent metrics.
 *
 * Everything here is DERIVED from existing SaveData. No new tracking systems,
 * no duplicate counters. These helpers feed the Parent Dashboard, the Weekly
 * Report, and the Kingdom Growth Score.
 */
import type { SaveData } from "../types";
import { CHARACTERS } from "./characters";
import { masteredCount, masteryLevel, MAX_MASTERY } from "./challenges";

/** Total full scriptures heard across the child's lifetime. */
export function totalScripturesHeard(save: SaveData): number {
  const fromCounts = Object.values(save.scriptureHeard ?? {}).reduce(
    (a, b) => a + b,
    0,
  );
  // Fall back to unlocked count if per-verse counts are empty (older saves).
  return fromCounts > 0 ? fromCounts : (save.unlockedScriptures?.length ?? 0);
}

/** Total verses fully mastered (crowned). */
export function totalScripturesMastered(save: SaveData): number {
  return masteredCount(save);
}

/** The verse heard the most times (ref + count), or null. */
export function mostHeardVerse(
  save: SaveData,
): { ref: string; count: number } | null {
  let best: { ref: string; count: number } | null = null;
  for (const [ref, count] of Object.entries(save.scriptureHeard ?? {})) {
    if (!best || count > best.count) best = { ref, count };
  }
  return best;
}

/** The child's favorite verse — first starred, else most heard. */
export function favoriteVerse(save: SaveData): string | null {
  if (save.favoriteScriptures?.length) return save.favoriteScriptures[0];
  return mostHeardVerse(save)?.ref ?? null;
}

/**
 * Retention accuracy (0..1): of the verses they've actually engaged with, how
 * far along the mastery path are they on average? A faithful proxy for "how
 * well are they remembering what they've heard" — no new tracking required.
 */
export function memoryAccuracy(save: SaveData): number {
  const engaged = new Set<string>([
    ...Object.keys(save.scriptureMastery ?? {}),
    ...(save.unlockedScriptures ?? []),
  ]);
  if (engaged.size === 0) return 0;
  let earned = 0;
  for (const ref of engaged) {
    earned += Math.min(MAX_MASTERY, masteryLevel(save, ref)) / MAX_MASTERY;
  }
  return earned / engaged.size;
}

/** The character with the most runs (the child's most-used hero), or null. */
export function mostUsedCharacter(
  save: SaveData,
): { id: string; name: string; runs: number } | null {
  let best: { id: string; name: string; runs: number } | null = null;
  for (const [id, f] of Object.entries(save.friendship ?? {})) {
    const runs = f?.runs ?? 0;
    if (!best || runs > best.runs) {
      const name = CHARACTERS.find((c) => c.id === id)?.name ?? id;
      best = { id, name, runs };
    }
  }
  return best && best.runs > 0 ? best : null;
}

/** Sum of friendship levels across all heroes the child has bonded with. */
export function totalFriendshipLevels(save: SaveData): number {
  return Object.values(save.friendship ?? {}).reduce(
    (a, f) => a + (f?.level ?? 0),
    0,
  );
}

/** Human-friendly play-time string from lifetime.playSeconds. */
export function formatPlayTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

/**
 * §5 — Kingdom Growth Score. ONE simple, motivating number that keeps climbing.
 * Combines the four things parents care about: mastery, accuracy, streak, and
 * how much scripture has been heard.
 */
export function kingdomGrowthScore(save: SaveData): number {
  const heard = totalScripturesHeard(save);
  const mastered = totalScripturesMastered(save);
  const streak = Math.max(
    save.scriptureStreakBest ?? 0,
    save.scriptureStreakDays ?? 0,
  );
  const accuracy = memoryAccuracy(save); // 0..1

  return Math.round(
    heard * 2 + // every verse heard counts
      mastered * 50 + // mastery is the big driver
      streak * 10 + // consistency rewarded
      accuracy * 100, // retention bonus (0..100)
  );
}

/** A short, encouraging label for the current growth score. */
export function growthTier(score: number): string {
  if (score >= 2000) return "Kingdom Heir 👑";
  if (score >= 1000) return "Overcomer 🔥";
  if (score >= 500) return "Disciple 🕊️";
  if (score >= 150) return "Believer ✨";
  return "Seeker 🌱";
}
