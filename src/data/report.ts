/**
 * Phase 14 §3 — Weekly Progress Report generator.
 *
 * LOCAL generation only. No email, no external integrations, no network. The
 * report is derived from existing SaveData (spaced-repetition `scriptureLastHeard`
 * timestamps + current aggregates), so there is no new tracking system.
 *
 * NOTE: true week-over-week deltas (e.g. "heard 127 this week") would require a
 * weekly baseline snapshot. To keep this foundation 100% stable and additive,
 * we report what existing data faithfully supports: verses *practiced* in the
 * last 7 days, plus the child's standing streak, mastery, and top verse.
 */
import type { SaveData } from "../types";
import {
  totalScripturesMastered,
  mostHeardVerse,
} from "./growth";

export interface WeeklyReport {
  childName: string;
  versesThisWeek: number;
  masteredTotal: number;
  streakDays: number;
  topVerse: string | null;
  /** Pre-formatted, parent-friendly summary lines. */
  lines: string[];
}

const WEEK_MS = 7 * 86_400_000;

/** Count verses whose last-heard timestamp falls within the past 7 days. */
function versesPracticedThisWeek(save: SaveData): number {
  const cutoff = Date.now() - WEEK_MS;
  let n = 0;
  for (const iso of Object.values(save.scriptureLastHeard ?? {})) {
    const t = new Date(iso).getTime();
    if (!Number.isNaN(t) && t >= cutoff) n++;
  }
  return n;
}

export function generateWeeklyReport(
  save: SaveData,
  childName: string,
): WeeklyReport {
  const versesThisWeek = versesPracticedThisWeek(save);
  const masteredTotal = totalScripturesMastered(save);
  const streakDays = Math.max(
    save.scriptureStreakDays ?? 0,
    0,
  );
  const topVerse = mostHeardVerse(save)?.ref ?? null;

  const lines: string[] = [];
  if (versesThisWeek > 0) {
    lines.push(
      `${childName} engaged with ${versesThisWeek} scripture${versesThisWeek === 1 ? "" : "s"} this week.`,
    );
  } else {
    lines.push(`${childName} hasn't practiced a verse yet this week — a fresh start awaits!`);
  }
  lines.push(
    `${masteredTotal} scripture${masteredTotal === 1 ? "" : "s"} fully mastered so far.`,
  );
  lines.push(
    streakDays > 0
      ? `Memory streak: ${streakDays} day${streakDays === 1 ? "" : "s"}.`
      : `Memory streak: ready to begin.`,
  );
  if (topVerse) lines.push(`Most remembered verse: ${topVerse}`);

  return { childName, versesThisWeek, masteredTotal, streakDays, topVerse, lines };
}
