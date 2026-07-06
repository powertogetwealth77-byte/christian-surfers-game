import type { SaveData } from "../types";
import { SCRIPTURES } from "./scriptures";

/**
 * Scripture Mastery — fill-in-the-blank memory challenges, one per verse.
 * `prompt` shows the verse with the key word replaced by a blank; `options`
 * holds the answer plus three distractors (shuffled at play time). The goal
 * is gentle, natural scripture memorization — no penalty for a wrong guess.
 */
export interface ScriptureChallenge {
  ref: string;
  prompt: string;
  answer: string;
  options: string[];
}

export const MAX_MASTERY = 5; // mastery level per verse caps here (a full crown)

export const CHALLENGES: ScriptureChallenge[] = [
  // ── Identity ──────────────────────────────────────────────────────────────
  {
    ref: "John 3:16",
    prompt:
      "For God so loved the _____, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
    answer: "world",
    options: ["world", "people", "nation", "children"],
  },
  {
    ref: "Romans 8:37",
    prompt: "Nay, in all these things we are more than _____ through him that loved us.",
    answer: "conquerors",
    options: ["conquerors", "victors", "overcomers", "warriors"],
  },
  {
    ref: "1 Peter 2:9",
    prompt:
      "But ye are a chosen generation, a royal _____, an holy nation, a peculiar people; that ye should shew forth the praises of him who hath called you out of darkness into his marvellous light:",
    answer: "priesthood",
    options: ["priesthood", "kingdom", "household", "company"],
  },
  {
    ref: "Ephesians 2:10",
    prompt:
      "For we are his _____, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.",
    answer: "workmanship",
    options: ["workmanship", "creation", "children", "servants"],
  },
  {
    ref: "2 Corinthians 5:17",
    prompt:
      "Therefore if any man be in Christ, he is a new _____: old things are passed away; behold, all things are become new.",
    answer: "creature",
    options: ["creature", "person", "creation", "spirit"],
  },

  // ── Courage ───────────────────────────────────────────────────────────────
  {
    ref: "Joshua 1:9",
    prompt:
      "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou _____: for the LORD thy God is with thee whithersoever thou goest.",
    answer: "dismayed",
    options: ["dismayed", "afraid", "troubled", "shaken"],
  },
  {
    ref: "Psalm 27:1",
    prompt:
      "The LORD is my _____ and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?",
    answer: "light",
    options: ["light", "rock", "strength", "shield"],
  },
  {
    ref: "Isaiah 41:10",
    prompt:
      "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will _____ thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
    answer: "strengthen",
    options: ["strengthen", "comfort", "protect", "uphold"],
  },
  {
    ref: "2 Timothy 1:7",
    prompt:
      "For God hath not given us the spirit of _____; but of power, and of love, and of a sound mind.",
    answer: "fear",
    options: ["fear", "doubt", "worry", "shame"],
  },
  {
    ref: "Deuteronomy 31:6",
    prompt:
      "Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor _____ thee.",
    answer: "forsake",
    options: ["forsake", "leave", "abandon", "forget"],
  },

  // ── Faith ─────────────────────────────────────────────────────────────────
  {
    ref: "Hebrews 11:1",
    prompt:
      "Now faith is the _____ of things hoped for, the evidence of things not seen.",
    answer: "substance",
    options: ["substance", "assurance", "foundation", "promise"],
  },
  {
    ref: "Mark 9:23",
    prompt:
      "Jesus said unto him, If thou canst _____, all things are possible to him that believeth.",
    answer: "believe",
    options: ["believe", "trust", "hope", "endure"],
  },
  {
    ref: "Romans 10:17",
    prompt: "So then faith cometh by hearing, and hearing by the _____ of God.",
    answer: "word",
    options: ["word", "grace", "spirit", "power"],
  },
  {
    ref: "2 Corinthians 5:7",
    prompt: "For we walk by _____, not by sight:",
    answer: "faith",
    options: ["faith", "grace", "hope", "love"],
  },
  {
    ref: "James 1:6",
    prompt:
      "But let him ask in faith, nothing _____. For he that wavereth is like a wave of the sea driven with the wind and tossed.",
    answer: "wavering",
    options: ["wavering", "doubting", "fearing", "hesitating"],
  },

  // ── Protection ────────────────────────────────────────────────────────────
  {
    ref: "Psalm 91:1",
    prompt:
      "He that dwelleth in the secret place of the most High shall abide under the _____ of the Almighty.",
    answer: "shadow",
    options: ["shadow", "shelter", "wings", "cover"],
  },
  {
    ref: "Psalm 121:1-2",
    prompt:
      "I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the _____, which made heaven and earth.",
    answer: "LORD",
    options: ["LORD", "Lord", "God", "Father"],
  },
  {
    ref: "Isaiah 54:17",
    prompt:
      "No _____ that is formed against thee shall prosper; and every tongue that shall rise against thee in judgment thou shalt condemn.",
    answer: "weapon",
    options: ["weapon", "shadow", "trouble", "enemy"],
  },
  {
    ref: "Proverbs 18:10",
    prompt:
      "The name of the LORD is a strong _____: the righteous runneth into it, and is safe.",
    answer: "tower",
    options: ["tower", "fortress", "rock", "shield"],
  },
  {
    ref: "Luke 10:19",
    prompt:
      "Behold, I give unto you _____ to tread on serpents and scorpions, and over all the power of the enemy: and nothing shall by any means hurt you.",
    answer: "power",
    options: ["power", "peace", "mercy", "wisdom"],
  },

  // ── Joy ───────────────────────────────────────────────────────────────────
  {
    ref: "Psalm 16:11",
    prompt:
      "Thou wilt shew me the path of life: in thy presence is fulness of _____; at thy right hand there are pleasures for evermore.",
    answer: "joy",
    options: ["joy", "peace", "life", "light"],
  },
  {
    ref: "Nehemiah 8:10",
    prompt:
      "Then he said unto them, Go your way, eat the fat, and drink the sweet, and send portions unto them for whom nothing is prepared: for this day is holy unto our LORD: neither be ye sorry; for the joy of the LORD is your _____.",
    answer: "strength",
    options: ["strength", "portion", "peace", "refuge"],
  },
  {
    ref: "Philippians 4:4",
    prompt: "Rejoice in the Lord _____: and again I say, Rejoice.",
    answer: "alway",
    options: ["alway", "always", "ever", "daily"],
  },
  {
    ref: "Psalm 118:24",
    prompt:
      "This is the _____ which the LORD hath made; we will rejoice and be glad in it.",
    answer: "day",
    options: ["day", "time", "hour", "season"],
  },
  {
    ref: "John 15:11",
    prompt:
      "These things have I spoken unto you, that my _____ might remain in you, and that your joy might be full.",
    answer: "joy",
    options: ["joy", "peace", "love", "grace"],
  },

  // ── Wisdom ────────────────────────────────────────────────────────────────
  {
    ref: "Proverbs 3:5-6",
    prompt:
      "_____ in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
    answer: "Trust",
    options: ["Trust", "Delight", "Rejoice", "Abide"],
  },
  {
    ref: "James 1:5",
    prompt:
      "If any of you lack _____, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.",
    answer: "wisdom",
    options: ["wisdom", "faith", "strength", "knowledge"],
  },
  {
    ref: "Psalm 119:105",
    prompt: "Thy word is a _____ unto my feet, and a light unto my path.",
    answer: "lamp",
    options: ["lamp", "light", "guide", "fire"],
  },
  {
    ref: "Proverbs 4:7",
    prompt:
      "_____ is the principal thing; therefore get wisdom: and with all thy getting get understanding.",
    answer: "Wisdom",
    options: ["Wisdom", "Knowledge", "Faith", "Understanding"],
  },

  // ── Love ──────────────────────────────────────────────────────────────────
  {
    ref: "Romans 5:8",
    prompt:
      "But God commendeth his love toward us, in that, while we were yet _____, Christ died for us.",
    answer: "sinners",
    options: ["sinners", "lost", "enemies", "weak"],
  },
  {
    ref: "John 15:13",
    prompt:
      "Greater _____ hath no man than this, that a man lay down his life for his friends.",
    answer: "love",
    options: ["love", "gift", "grace", "mercy"],
  },
  {
    ref: "1 John 4:19",
    prompt: "We love him, because he _____ loved us.",
    answer: "first",
    options: ["first", "always", "freely", "greatly"],
  },
  {
    ref: "John 13:34",
    prompt:
      "A new commandment I give unto you, That ye love one another; as I have loved you, that ye also love one _____.",
    answer: "another",
    options: ["another", "neighbor", "other", "friend"],
  },

  // ── Encouragement ─────────────────────────────────────────────────────────
  {
    ref: "Romans 8:28",
    prompt:
      "And we know that all things work together for _____ to them that love God, to them who are the called according to his purpose.",
    answer: "good",
    options: ["good", "glory", "peace", "blessing"],
  },
  {
    ref: "Philippians 4:13",
    prompt: "I can do all things through _____ which strengtheneth me.",
    answer: "Christ",
    options: ["Christ", "faith", "grace", "hope"],
  },
  {
    ref: "Jeremiah 29:11",
    prompt:
      "For I know the thoughts that I think toward you, saith the LORD, thoughts of _____, and not of evil, to give you an expected end.",
    answer: "peace",
    options: ["peace", "hope", "love", "joy"],
  },
  {
    ref: "Galatians 6:9",
    prompt:
      "And let us not be _____ in well doing: for in due season we shall reap, if we faint not.",
    answer: "weary",
    options: ["weary", "afraid", "idle", "slow"],
  },
  {
    ref: "Psalm 46:1",
    prompt: "God is our _____ and strength, a very present help in trouble.",
    answer: "refuge",
    options: ["refuge", "rock", "shield", "fortress"],
  },
];

export function getChallenge(ref: string): ScriptureChallenge | undefined {
  return CHALLENGES.find((c) => c.ref === ref);
}

/** Mastery level (0–5) for a verse. */
export function masteryLevel(save: SaveData, ref: string): number {
  return save.scriptureMastery[ref] ?? 0;
}

/** Overall Scripture Mastery as a 0..1 fraction across every verse. */
export function masteryFraction(save: SaveData): number {
  const total = CHALLENGES.length * MAX_MASTERY;
  if (total === 0) return 0;
  const earned = CHALLENGES.reduce(
    (sum, c) => sum + Math.min(MAX_MASTERY, masteryLevel(save, c.ref)),
    0,
  );
  return earned / total;
}

/** How many verses are fully mastered (crowned). */
export function masteredCount(save: SaveData): number {
  return CHALLENGES.filter((c) => masteryLevel(save, c.ref) >= MAX_MASTERY).length;
}

/**
 * Pick the next challenge to serve. Prefer verses the player has actually
 * heard (unlockedScriptures) and not yet mastered; otherwise fall back to any
 * not-yet-mastered verse, then to a random verse for endless practice.
 */
export function pickChallenge(save: SaveData): ScriptureChallenge {
  const heard = new Set(save.unlockedScriptures);
  const heardUnmastered = CHALLENGES.filter(
    (c) => heard.has(c.ref) && masteryLevel(save, c.ref) < MAX_MASTERY,
  );
  const anyUnmastered = CHALLENGES.filter((c) => masteryLevel(save, c.ref) < MAX_MASTERY);
  const pool =
    heardUnmastered.length > 0
      ? heardUnmastered
      : anyUnmastered.length > 0
        ? anyUnmastered
        : CHALLENGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Full verse text for the celebratory reveal after a correct answer. */
export function verseText(ref: string): string {
  return SCRIPTURES.find((s) => s.ref === ref)?.text ?? "";
}
