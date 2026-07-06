import type { SaveData } from "../types";

export interface FinishQuestion {
  ref: string;
  prompt: string;        // fill-in-the-blank sentence with _____ for the missing word
  answer: string;        // correct fill-in word
  options: [string, string, string, string]; // 4 choices (answer is one of them)
  fullVerse: string;     // complete verse for teaching on wrong answer
}

export interface FinishTierDef {
  tier: number;
  name: string;
  label: string;
  questions: FinishQuestion[];
}

export const FINISH_TIERS: FinishTierDef[] = [
  {
    tier: 1,
    name: "Starter Scriptures",
    label: "Starter",
    questions: [
      {
        ref: "John 3:16",
        prompt: "For God so loved the _____",
        answer: "world",
        options: ["world", "people", "earth", "church"],
        fullVerse: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
      },
      {
        ref: "Philippians 4:13",
        prompt: "I can do all things through _____ which strengtheneth me.",
        answer: "Christ",
        options: ["Christ", "faith", "prayer", "love"],
        fullVerse: "I can do all things through Christ which strengtheneth me.",
      },
      {
        ref: "2 Timothy 1:7",
        prompt: "God hath not given us the spirit of _____",
        answer: "fear",
        options: ["fear", "doubt", "anger", "worry"],
        fullVerse: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
      },
      {
        ref: "Psalm 27:1",
        prompt: "The LORD is my light and my _____",
        answer: "salvation",
        options: ["salvation", "strength", "shield", "hope"],
        fullVerse: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?",
      },
    ],
  },
  {
    tier: 2,
    name: "Courage Scriptures",
    label: "Courage",
    questions: [
      {
        ref: "Joshua 1:9",
        prompt: "Be strong and of a good _____",
        answer: "courage",
        options: ["courage", "heart", "faith", "spirit"],
        fullVerse: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
      },
      {
        ref: "Isaiah 41:10",
        prompt: "Fear thou not; for I am _____ thee",
        answer: "with",
        options: ["with", "near", "for", "behind"],
        fullVerse: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee.",
      },
      {
        ref: "Romans 8:31",
        prompt: "If God be for us, who can be _____ us?",
        answer: "against",
        options: ["against", "above", "ahead of", "over"],
        fullVerse: "What shall we then say to these things? If God be for us, who can be against us?",
      },
      {
        ref: "Deuteronomy 31:6",
        prompt: "Be strong and _____, do not be afraid",
        answer: "courageous",
        options: ["courageous", "faithful", "joyful", "patient"],
        fullVerse: "Be strong and courageous. Do not be afraid or terrified because of them, for the LORD your God goes with you; he will never leave you nor forsake you.",
      },
    ],
  },
  {
    tier: 3,
    name: "Faith Scriptures",
    label: "Faith",
    questions: [
      {
        ref: "Hebrews 11:1",
        prompt: "Now faith is the _____ of things hoped for",
        answer: "substance",
        options: ["substance", "evidence", "promise", "knowledge"],
        fullVerse: "Now faith is the substance of things hoped for, the evidence of things not seen.",
      },
      {
        ref: "2 Corinthians 5:7",
        prompt: "We walk by _____, not by sight",
        answer: "faith",
        options: ["faith", "hope", "grace", "love"],
        fullVerse: "For we walk by faith, not by sight.",
      },
      {
        ref: "Mark 9:23",
        prompt: "All things are possible to him that _____",
        answer: "believeth",
        options: ["believeth", "prayeth", "trusteth", "hopeth"],
        fullVerse: "Jesus said unto him, If thou canst believe, all things are possible to him that believeth.",
      },
      {
        ref: "Romans 10:17",
        prompt: "Faith cometh by _____, and hearing by the word of God",
        answer: "hearing",
        options: ["hearing", "praying", "reading", "seeking"],
        fullVerse: "So then faith cometh by hearing, and hearing by the word of God.",
      },
    ],
  },
  {
    tier: 4,
    name: "Protection Scriptures",
    label: "Protection",
    questions: [
      {
        ref: "Isaiah 54:17",
        prompt: "No weapon formed against thee shall _____",
        answer: "prosper",
        options: ["prosper", "succeed", "remain", "stand"],
        fullVerse: "No weapon that is formed against thee shall prosper; and every tongue that shall rise against thee in judgment thou shalt condemn.",
      },
      {
        ref: "Psalm 91:11",
        prompt: "He shall give his _____ charge over thee",
        answer: "angels",
        options: ["angels", "spirit", "grace", "word"],
        fullVerse: "For he shall give his angels charge over thee, to keep thee in all thy ways.",
      },
      {
        ref: "Luke 10:19",
        prompt: "I give unto you power to tread on _____ and scorpions",
        answer: "serpents",
        options: ["serpents", "demons", "darkness", "shadows"],
        fullVerse: "Behold, I give unto you power to tread on serpents and scorpions, and over all the power of the enemy: and nothing shall by any means hurt you.",
      },
      {
        ref: "Proverbs 18:10",
        prompt: "The name of the LORD is a strong _____",
        answer: "tower",
        options: ["tower", "shield", "fortress", "refuge"],
        fullVerse: "The name of the LORD is a strong tower: the righteous runneth into it, and is safe.",
      },
    ],
  },
  {
    tier: 5,
    name: "Identity Scriptures",
    label: "Identity",
    questions: [
      {
        ref: "1 Peter 2:9",
        prompt: "Ye are a chosen _____, a royal priesthood",
        answer: "generation",
        options: ["generation", "people", "nation", "family"],
        fullVerse: "But ye are a chosen generation, a royal priesthood, an holy nation, a peculiar people; that ye should shew forth the praises of him who hath called you out of darkness into his marvellous light.",
      },
      {
        ref: "Ephesians 2:10",
        prompt: "We are God's _____, created in Christ Jesus",
        answer: "masterpiece",
        options: ["masterpiece", "children", "servants", "temple"],
        fullVerse: "For we are God's masterpiece. He has created us anew in Christ Jesus, so we can do the good things he planned for us long ago.",
      },
      {
        ref: "2 Corinthians 5:17",
        prompt: "If any man be in Christ, he is a new _____",
        answer: "creature",
        options: ["creature", "person", "heart", "spirit"],
        fullVerse: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.",
      },
      {
        ref: "Romans 8:37",
        prompt: "We are more than _____ through him that loved us",
        answer: "conquerors",
        options: ["conquerors", "victors", "warriors", "overcomers"],
        fullVerse: "Nay, in all these things we are more than conquerors through him that loved us.",
      },
    ],
  },
];

/** Scripture tier index (1–5) based on lifetime finish victories. */
export function getFinishTierNumber(victories: number): number {
  if (victories >= 21) return 5;
  if (victories >= 11) return 4;
  if (victories >= 6) return 3;
  if (victories >= 3) return 2;
  return 1;
}

export function getFinishTier(victories: number): FinishTierDef {
  return FINISH_TIERS[getFinishTierNumber(victories) - 1];
}

/** Pick a question, preferring verses the player hasn't mastered yet. */
export function pickFinishQuestion(
  tier: FinishTierDef,
  save: SaveData,
): FinishQuestion {
  const mastery = save.scriptureMastery ?? {};
  // Sort by mastery ascending — show least-mastered first
  const sorted = [...tier.questions].sort(
    (a, b) => (mastery[a.ref] ?? 0) - (mastery[b.ref] ?? 0),
  );
  // Pick randomly from the two least mastered to add variety
  return sorted[Math.floor(Math.random() * Math.min(2, sorted.length))];
}

/** Shuffle option order so the correct answer isn't always in position 0. */
export function shuffleOptions(q: FinishQuestion): string[] {
  const opts = [...q.options];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

export interface FinishBadge {
  victories: number;
  name: string;
  icon: string;
}

export const FINISH_BADGES: FinishBadge[] = [
  { victories: 3, name: "Courage Badge", icon: "🛡" },
  { victories: 5, name: "Victory Trail", icon: "🏃" },
  { victories: 10, name: "Accuser Defeated", icon: "⚔️" },
  { victories: 20, name: "Kingdom Champion", icon: "👑" },
  { victories: 50, name: "Overcomer Crown", icon: "✨" },
];

/** Reward coins and XP for a finish-line victory. */
export function finishRewards(tier: number, correct: boolean) {
  const base = correct ? 100 + tier * 50 : 25;
  return {
    coins: base,
    xp: correct ? 50 + tier * 25 : 10,
    masteryXp: correct ? 1 : 0,
    friendshipXp: correct ? 30 + tier * 10 : 5,
    kgsBoost: correct ? tier * 10 : 0,
  };
}
