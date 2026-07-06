import type { ScriptureDef, ScriptureCategory } from "../types";
import type { SaveData } from "../types";

export type { ScriptureCategory };

/**
 * The scripture rotation — COMPLETE, accurate KJV verses. Categorized for
 * filtering, display badges, and spaced repetition selection.
 */
export const SCRIPTURES: ScriptureDef[] = [
  // ── Identity ──────────────────────────────────────────────────────────────
  {
    ref: "John 3:16",
    category: "identity",
    text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
  },
  {
    ref: "Romans 8:37",
    category: "identity",
    text: "Nay, in all these things we are more than conquerors through him that loved us.",
  },
  {
    ref: "1 Peter 2:9",
    category: "identity",
    text: "But ye are a chosen generation, a royal priesthood, an holy nation, a peculiar people; that ye should shew forth the praises of him who hath called you out of darkness into his marvellous light:",
  },
  {
    ref: "Ephesians 2:10",
    category: "identity",
    text: "For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.",
  },
  {
    ref: "2 Corinthians 5:17",
    category: "identity",
    text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.",
  },

  // ── Courage ───────────────────────────────────────────────────────────────
  {
    ref: "Joshua 1:9",
    category: "courage",
    text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
  },
  {
    ref: "Psalm 27:1",
    category: "courage",
    text: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?",
  },
  {
    ref: "Isaiah 41:10",
    category: "courage",
    text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
  },
  {
    ref: "2 Timothy 1:7",
    category: "courage",
    text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
  },
  {
    ref: "Deuteronomy 31:6",
    category: "courage",
    text: "Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee.",
  },

  // ── Faith ─────────────────────────────────────────────────────────────────
  {
    ref: "Hebrews 11:1",
    category: "faith",
    text: "Now faith is the substance of things hoped for, the evidence of things not seen.",
  },
  {
    ref: "Mark 9:23",
    category: "faith",
    text: "Jesus said unto him, If thou canst believe, all things are possible to him that believeth.",
  },
  {
    ref: "Romans 10:17",
    category: "faith",
    text: "So then faith cometh by hearing, and hearing by the word of God.",
  },
  {
    ref: "2 Corinthians 5:7",
    category: "faith",
    text: "For we walk by faith, not by sight:",
  },
  {
    ref: "James 1:6",
    category: "faith",
    text: "But let him ask in faith, nothing wavering. For he that wavereth is like a wave of the sea driven with the wind and tossed.",
  },

  // ── Protection ────────────────────────────────────────────────────────────
  {
    ref: "Psalm 91:1",
    category: "protection",
    text: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.",
  },
  {
    ref: "Psalm 121:1-2",
    category: "protection",
    text: "I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the LORD, which made heaven and earth.",
  },
  {
    ref: "Isaiah 54:17",
    category: "protection",
    text: "No weapon that is formed against thee shall prosper; and every tongue that shall rise against thee in judgment thou shalt condemn. This is the heritage of the servants of the LORD, and their righteousness is of me, saith the LORD.",
  },
  {
    ref: "Proverbs 18:10",
    category: "protection",
    text: "The name of the LORD is a strong tower: the righteous runneth into it, and is safe.",
  },
  {
    ref: "Luke 10:19",
    category: "protection",
    text: "Behold, I give unto you power to tread on serpents and scorpions, and over all the power of the enemy: and nothing shall by any means hurt you.",
  },

  // ── Joy ───────────────────────────────────────────────────────────────────
  {
    ref: "Psalm 16:11",
    category: "joy",
    text: "Thou wilt shew me the path of life: in thy presence is fulness of joy; at thy right hand there are pleasures for evermore.",
  },
  {
    ref: "Nehemiah 8:10",
    category: "joy",
    text: "Then he said unto them, Go your way, eat the fat, and drink the sweet, and send portions unto them for whom nothing is prepared: for this day is holy unto our LORD: neither be ye sorry; for the joy of the LORD is your strength.",
  },
  {
    ref: "Philippians 4:4",
    category: "joy",
    text: "Rejoice in the Lord alway: and again I say, Rejoice.",
  },
  {
    ref: "Psalm 118:24",
    category: "joy",
    text: "This is the day which the LORD hath made; we will rejoice and be glad in it.",
  },
  {
    ref: "John 15:11",
    category: "joy",
    text: "These things have I spoken unto you, that my joy might remain in you, and that your joy might be full.",
  },

  // ── Wisdom ────────────────────────────────────────────────────────────────
  {
    ref: "Proverbs 3:5-6",
    category: "wisdom",
    text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
  },
  {
    ref: "James 1:5",
    category: "wisdom",
    text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.",
  },
  {
    ref: "Psalm 119:105",
    category: "wisdom",
    text: "Thy word is a lamp unto my feet, and a light unto my path.",
  },
  {
    ref: "Proverbs 4:7",
    category: "wisdom",
    text: "Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding.",
  },

  // ── Love ──────────────────────────────────────────────────────────────────
  {
    ref: "Romans 5:8",
    category: "love",
    text: "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.",
  },
  {
    ref: "John 15:13",
    category: "love",
    text: "Greater love hath no man than this, that a man lay down his life for his friends.",
  },
  {
    ref: "1 John 4:19",
    category: "love",
    text: "We love him, because he first loved us.",
  },
  {
    ref: "John 13:34",
    category: "love",
    text: "A new commandment I give unto you, That ye love one another; as I have loved you, that ye also love one another.",
  },

  // ── Encouragement ─────────────────────────────────────────────────────────
  {
    ref: "Romans 8:28",
    category: "encouragement",
    text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
  },
  {
    ref: "Philippians 4:13",
    category: "encouragement",
    text: "I can do all things through Christ which strengtheneth me.",
  },
  {
    ref: "Jeremiah 29:11",
    category: "encouragement",
    text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.",
  },
  {
    ref: "Galatians 6:9",
    category: "encouragement",
    text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.",
  },
  {
    ref: "Psalm 46:1",
    category: "encouragement",
    text: "God is our refuge and strength, a very present help in trouble.",
  },
];

/** Power verses receive 3× weight in scripture rotation (§4). */
export const POWER_VERSES = new Set([
  "John 3:16", "Joshua 1:9", "Psalm 27:1", "Isaiah 41:10",
  "2 Timothy 1:7", "Romans 8:28", "Philippians 4:13", "Jeremiah 29:11",
  "Psalm 91:1", "Luke 10:19",
]);

/** Category icon map for display badges. */
export const CATEGORY_ICONS: Record<string, string> = {
  identity: "✨",
  courage: "⚔️",
  faith: "🕊️",
  protection: "🛡️",
  joy: "🎉",
  wisdom: "💡",
  love: "❤️",
  encouragement: "🌟",
};

/**
 * Spaced repetition: pick the next scripture to speak during gameplay.
 * Prioritizes verses not heard recently; never picks the same ref as lastRef.
 * Power verses receive 3× weight in the candidate pool (§4).
 */
export function pickNextScripture(save: SaveData, lastRef?: string): string {
  const now = Date.now();
  const MS_PER_DAY = 86_400_000;
  const RECENT_THRESHOLD_MS = 24 * MS_PER_DAY;

  // Score each verse: higher = needs to be heard sooner
  const scored = SCRIPTURES.map((s) => {
    const lastIso = save.scriptureLastHeard?.[s.ref];
    const lastTime = lastIso ? new Date(lastIso).getTime() : 0;
    const daysSince = lastTime ? (now - lastTime) / MS_PER_DAY : 999;
    return { ref: s.ref, score: daysSince, lastTime };
  });

  // Filter out the last ref if we have choices
  const withoutLast = scored.filter((x) => x.ref !== lastRef);
  const base = withoutLast.length > 0 ? withoutLast : scored;

  // Filter out recently heard (last 24h), unless all are recent
  const fresh = base.filter((x) => !x.lastTime || now - x.lastTime >= RECENT_THRESHOLD_MS);
  const pool = fresh.length > 0 ? fresh : base;

  // Sort descending by score (most overdue first), pick top quartile
  pool.sort((a, b) => b.score - a.score);
  const topCount = Math.max(1, Math.ceil(pool.length * 0.25));
  const topPool = pool.slice(0, topCount);

  // Build weighted list: power verses appear 3×, others 1×
  const weighted: string[] = [];
  for (const item of topPool) {
    const times = POWER_VERSES.has(item.ref) ? 3 : 1;
    for (let i = 0; i < times; i++) weighted.push(item.ref);
  }

  return weighted[Math.floor(Math.random() * weighted.length)];
}
