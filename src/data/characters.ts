/**
 * CHRISTIAN SURFERS — OFFICIAL GENERATION ONE ROSTER
 * Phase 16.2 canonical character database.
 *
 * Generation 1 (8 heroes) — the original franchise squad.
 * Generation 2 (2 heroes) — expansion heroes, locked / Coming Soon.
 * The Accuser is the antagonist; he is always DEFEATED.
 */
import type { CharacterDef } from "../types";

export const CHARACTERS: CharacterDef[] = [
  // ═══════════════════════════════════════════════════════════
  //  GENERATION ONE — THE ORIGINAL EIGHT
  // ═══════════════════════════════════════════════════════════

  // 1 ── ZION · The Light Runner ─────────────────────────────
  {
    id: "zion",
    generation: 1,
    name: "Zion",
    outfit: "Royal blue hoodie with glowing cross pattern, gold energy seams, Light Runner X1 sneakers",
    clothingText: "JOHN 3:16",
    theme: "Light · Hope · Salvation",
    ability: "Light of the World",
    abilityDesc: "Starts every run shielded in heavenly light. Burst of light destroys darkness and reveals hidden scripture scrolls.",
    colors: {
      primary: "#1e3a8a",   // Royal Blue
      secondary: "#fbbf24", // Radiant Gold
      accent: "#ffffff",    // White
      skin: "#8d5a3b",
    },
    unlocked: true,
    rarity: "legendary",
    tagline: "The First Runner. The Leader. The Light.",
    bio: "Zion is the franchise mascot and the heart of every team. Born on the boardwalk under the light of John 3:16, he runs not just to win, but to lead others into the light. The darkness has no answer for him.",
    favoriteScripture: "John 3:16",
    signaturePower: "Light of the World — shielded start, destroys darkness, reveals scrolls",
    voiceLine: "Run in the Light!",
    abilityShort: "Reveals scrolls and boosts the light path.",
    boardName: "Light Runner",
    shoeName: "Light Runner X1",
    victoryLine: "Run in the Light.",
    kidDescription: "The brave leader who lights the way for everyone.",
    image: "/assets/characters/zion.png",
  },

  // 2 ── JUDAH · The Lion Runner ─────────────────────────────
  {
    id: "judah",
    generation: 1,
    name: "Judah",
    outfit: "Black streetwear jacket with deep crimson and gold lion mane embroidery, Lion Stride Elite sneakers",
    clothingText: "LION OF JUDAH",
    theme: "Victory · Strength · Courage",
    ability: "Lion of Judah",
    abilityDesc: "Revival Fire pushes the Accuser back twice as far. Kingdom roar destroys fear effects and breaks obstacle chains.",
    colors: {
      primary: "#111111",   // Onyx Black
      secondary: "#f5b82e", // Royal Gold
      accent: "#dc2626",    // Deep Crimson
      skin: "#5c3a21",
    },
    unlocked: true,
    rarity: "legendary",
    tagline: "The Lion Hath Prevailed.",
    bio: "Judah doesn't fear the darkness — he charges straight through it. When he roars, the Accuser remembers that the Lion of the tribe of Judah has already won. Fearless, bold, and impossible to stop.",
    favoriteScripture: "Revelation 5:5",
    signaturePower: "Lion of Judah — Revival Fire drives the Accuser far back",
    voiceLine: "The Lion hath prevailed!",
    abilityShort: "Pushes back fear and breaks chains.",
    boardName: "Lion of Judah",
    shoeName: "Lion Stride Elite",
    victoryLine: "The Lion hath prevailed.",
    kidDescription: "The bold, fearless hero who charges through the dark.",
    image: "/assets/characters/judah.png",
  },

  // 3 ── GRACE · The Grace Runner ────────────────────────────
  {
    id: "grace",
    generation: 1,
    name: "Grace",
    outfit: "Pearl white jacket with royal purple glowing dove emblem and ribbon-light accents, Wings of Grace Runner sneakers",
    clothingText: "SAVED BY GRACE",
    theme: "Grace · Compassion · Hope",
    ability: "Wings of Grace",
    abilityDesc: "Power-ups and blessings last 25% longer. Wave of heavenly grace removes discouragement, protects teammates, and creates golden feather trails.",
    colors: {
      primary: "#f4f1ff",   // Pearl White
      secondary: "#7c3aed", // Royal Purple
      accent: "#d4af37",    // Soft Gold
      skin: "#c68642",
    },
    unlocked: true,
    rarity: "legendary",
    tagline: "Grace Always Leads You Forward.",
    bio: "Grace runs for everyone who was told they're too far gone. Calm under pressure, she makes every blessing last and leaves a trail of golden feathers wherever she goes. Her compassion is her superpower.",
    favoriteScripture: "Ephesians 2:8",
    signaturePower: "Wings of Grace — power-ups linger 25% longer",
    voiceLine: "Grace always leads you forward!",
    abilityShort: "Extends mercy windows and helps recovery.",
    boardName: "Wings of Grace",
    shoeName: "Wings of Grace Runner",
    victoryLine: "Grace leads you forward.",
    kidDescription: "The kind hero who helps everyone get back up.",
    image: "/assets/characters/grace.png",
  },

  // 4 ── KAI · The Faith Explorer ────────────────────────────
  {
    id: "kai",
    generation: 1,
    name: "Kai",
    outfit: "Deep teal and ocean blue explorer jacket with glowing compass map pattern, Faith Explorer Trail X sneakers",
    clothingText: "WALK BY FAITH",
    theme: "Adventure · Discovery · Journey",
    ability: "Faith Trail",
    abilityDesc: "Higher jumps with a faithful glide. Creates a glowing path that reveals hidden treasures and secret Kingdom pathways.",
    colors: {
      primary: "#0d9488",   // Deep Teal
      secondary: "#0369a1", // Ocean Blue
      accent: "#d4af37",    // Compass Bronze
      skin: "#a9714b",
    },
    unlocked: true,
    rarity: "legendary",
    tagline: "Walk by faith, not by sight.",
    bio: "Kai treats every leap as an act of faith. Born to explore, he holds a Faith Compass that reveals paths the eye cannot see. Adventurous, visionary, and always discovering what God has hidden for those who trust.",
    favoriteScripture: "2 Corinthians 5:7",
    signaturePower: "Faith Trail — higher jumps, faithful glide, reveals hidden paths",
    voiceLine: "Walk by faith, not by sight!",
    abilityShort: "Reveals hidden paths and bonus coins.",
    boardName: "Faith Explorer",
    shoeName: "Faith Explorer Trail X",
    victoryLine: "Walk by faith, not by sight.",
    kidDescription: "The explorer who finds secret paths by trusting God.",
    image: "/assets/characters/kai.png",
  },

  // 5 ── SELAH · The Worship Runner ──────────────────────────
  {
    id: "selah",
    generation: 1,
    name: "Selah",
    outfit: "Pearl white jacket with indigo leggings and glowing music note embroidery, ribbon-light accents, Heavenly Praise Glide sneakers",
    clothingText: "BE STILL",
    theme: "Worship · Peace · God's Presence",
    ability: "Heavenly Praise",
    abilityDesc: "All blessings and power-ups last 30% longer. Wave of worship light calms fear effects, attracts scripture scrolls, and fills the atmosphere with God's presence.",
    colors: {
      primary: "#3730a3",   // Indigo
      secondary: "#7c3aed", // Violet
      accent: "#fbbf24",    // Gold
      skin: "#b07a52",
    },
    unlocked: false,
    cost: 4500,
    rarity: "legendary",
    tagline: "Worship changes the atmosphere.",
    bio: "Selah carries quiet strength. Where she runs, the noise of the enemy fades and the presence of God fills the space. Her worship is a weapon — and her peace is impenetrable.",
    favoriteScripture: "Psalm 46:10",
    signaturePower: "Heavenly Praise — blessings linger 30% longer",
    voiceLine: "Be still, and know that I am God.",
    abilityShort: "Calms fear effects and boosts Scripture rewards.",
    boardName: "Heavenly Praise",
    shoeName: "Heavenly Praise Glide",
    victoryLine: "Worship changes the atmosphere.",
    kidDescription: "The peaceful worshipper who quiets every fear.",
    image: "/assets/characters/selah.png",
  },

  // 6 ── MERCY · The Healer's Heart ──────────────────────────
  {
    id: "mercy",
    generation: 1,
    name: "Mercy",
    outfit: "Rose gold and pearl white hoodie with heart & dove emblem and healing light embroidery, Mercy Restore Runner sneakers",
    clothingText: "NEW EVERY MORNING",
    theme: "Mercy · Healing · Restoration",
    ability: "Mercy Wave",
    abilityDesc: "Starts shielded with an extra Revival Fire charge. Wave of healing light removes fear effects, restores hope, and generates rings of restoration.",
    colors: {
      primary: "#fb7185",   // Rose Gold
      secondary: "#fda4af", // Soft Pink
      accent: "#7dd3fc",    // Sky Blue
      skin: "#9a6240",
    },
    unlocked: false,
    cost: 3500,
    rarity: "legendary",
    tagline: "God's mercy gives us another chance.",
    bio: "Mercy sees the good in everyone and runs toward the hurting. Wherever she goes, fear retreats and hope is restored. Her compassion is endless because she has received so much of it herself.",
    favoriteScripture: "Lamentations 3:22-23",
    signaturePower: "Mercy Wave — starts shielded, +1 Revival Fire, healing rings",
    voiceLine: "His mercies are new every morning!",
    abilityShort: "Adds protection and restores confidence.",
    boardName: "Healer's Heart",
    shoeName: "Mercy Restore Runner",
    victoryLine: "Mercy gives another chance.",
    kidDescription: "The caring hero who helps the hurting and restores hope.",
    image: "/assets/characters/mercy.png",
  },

  // 7 ── SAMUEL · The Voice Listener ─────────────────────────
  {
    id: "samuel",
    generation: 1,
    name: "Samuel",
    outfit: "Royal blue and white hoodie with sound-wave embroidery and trumpet pendant, Voice of Truth Precision sneakers",
    clothingText: "1 SAMUEL 3:10",
    theme: "Wisdom · Discernment · Truth",
    ability: "Voice of Truth",
    abilityDesc: "Starts protected by discernment light. The Word pushes back lies and deception — revival fire exposes the Accuser and drives him back with truth.",
    colors: {
      primary: "#1d4ed8",   // Royal Blue
      secondary: "#9ca3af", // Silver
      accent: "#fbbf24",    // Gold
      skin: "#8d6340",
    },
    unlocked: false,
    cost: 6000,
    rarity: "legendary",
    tagline: "Speak, Lord; thy servant heareth.",
    bio: "Samuel learned to hear God's voice when he was still a child. He runs with discernment that reveals what others cannot see. His trumpet pendant calls truth into the atmosphere and exposes every lie.",
    favoriteScripture: "1 Samuel 3:10",
    signaturePower: "Voice of Truth — starts shielded, revival fire enhanced by truth",
    voiceLine: "Speak, Lord; thy servant heareth.",
    abilityShort: "Improves Scripture challenge help and mastery.",
    boardName: "Voice of Truth",
    shoeName: "Voice of Truth Precision",
    victoryLine: "Speak, Lord; thy servant heareth.",
    kidDescription: "The wise listener who hears God and knows the truth.",
    image: "/assets/characters/samuel.png",
  },

  // 8 ── MALACHI · The Blazing Messenger ─────────────────────
  {
    id: "malachi",
    generation: 1,
    name: "Malachi",
    outfit: "White jacket with crimson red accents and radiant gold wing embroidery, Sun of Righteousness crest, Revival Fire Ascension sneakers",
    clothingText: "SUN OF RIGHTEOUSNESS",
    theme: "Revival · Purpose · Kingdom Mission",
    ability: "Revival Fire",
    abilityDesc: "Starts shielded with an extra Revival Fire charge. Drives the Accuser far back. Blazing messenger light destroys darkness barriers and breaks all chains.",
    colors: {
      primary: "#f59e0b",   // Sunlight Gold
      secondary: "#dc2626", // Crimson Red
      accent: "#1e3a8a",    // Deep Navy
      skin: "#6b4226",
    },
    unlocked: false,
    cost: 15000,
    rarity: "kingdom",
    tagline: "Arise and shine, for the Light has come.",
    bio: "Malachi is the final core hero of Generation One. He runs like the dawn breaking over darkness — bold, bright, and unstoppable. He carries the final calling: carrying God's light to the world and finishing the race with faith.",
    favoriteScripture: "Malachi 4:2",
    signaturePower: "Revival Fire — shielded start, +1 Revival, mighty Accuser push",
    voiceLine: "Arise and shine!",
    abilityShort: "Final unlock. Strong light burst and finish-line momentum.",
    boardName: "Revival Fire",
    shoeName: "Revival Fire Ascension",
    victoryLine: "Arise and shine.",
    kidDescription: "The final Gen 1 hero who blazes like the morning sun.",
    image: "/assets/characters/malachi.png",
  },

  // ═══════════════════════════════════════════════════════════
  //  GENERATION TWO — EXPANSION HEROES (Coming Soon)
  // ═══════════════════════════════════════════════════════════

  // G2.1 ── DAVID · The Giant Slayer ─────────────────────────
  {
    id: "david",
    generation: 2,
    comingSoon: true,
    name: "David",
    outfit: "Emerald green and white jacket with shepherd embroidery and scripture-light sling pattern, Giant Slayer sneakers",
    clothingText: "1 SAMUEL 17:45",
    theme: "Courage · Faith · Unlikely Victory",
    ability: "Giant Slayer",
    abilityDesc: "Releases faith-light that defeats giants of fear and darkness. Breaks obstacle chains, boosts speed, attracts scripture scrolls, and creates a courage-light path.",
    colors: {
      primary: "#166534",   // Forest Green
      secondary: "#4ade80", // Emerald
      accent: "#fbbf24",    // Gold
      skin: "#8d6340",
    },
    unlocked: false,
    cost: 12000,
    rarity: "legendary",
    tagline: "I come in the name of the Lord.",
    bio: "David is the ultimate underdog who trusts God against impossible odds. He teaches players that faith is stronger than giants. His shepherd sling fires faith-light that no darkness can withstand.",
    favoriteScripture: "1 Samuel 17:45",
    signaturePower: "Giant Slayer — faith-light leap, breaks chains, courage path",
    voiceLine: "I come in the name of the Lord!",
    abilityShort: "Defeats giants of fear and clears the path.",
    boardName: "Giant Slayer",
    shoeName: "Giant Slayer Runner",
    victoryLine: "I come in the name of the Lord.",
    kidDescription: "The underdog who beats giants with faith in God.",
    image: "/assets/characters/david.png",
  },

  // G2.2 ── ESTHER · The Courage Queen ───────────────────────
  {
    id: "esther",
    generation: 2,
    comingSoon: true,
    name: "Esther",
    outfit: "Royal purple jacket with golden crown-light embroidery, destiny-shine ribbons, Courage Queen sneakers",
    clothingText: "ESTHER 4:14",
    theme: "Courage · Purpose · Royal Destiny",
    ability: "Courage Crown",
    abilityDesc: "Royal courage wave destroys fear and protects all blessings. Crown-energy shields linger. Creates a royal path of light and boosts confidence streaks.",
    colors: {
      primary: "#581c87",   // Royal Purple
      secondary: "#a855f7", // Lavender
      accent: "#fbbf24",    // Gold
      skin: "#b07a52",
    },
    unlocked: false,
    cost: 20000,
    rarity: "kingdom",
    tagline: "For such a time as this.",
    bio: "Esther is a Kingdom Tier hero who stands for courage, purpose, and royal destiny. She reminds every player they were chosen — for such a time as this. She leads with boldness and turns every obstacle into victory.",
    favoriteScripture: "Esther 4:14",
    signaturePower: "Courage Crown — royal shield wave, extended blessings, crown shields",
    voiceLine: "For such a time as this!",
    abilityShort: "Royal courage wave shields every blessing.",
    boardName: "Courage Crown",
    shoeName: "Courage Queen Runner",
    victoryLine: "For such a time as this.",
    kidDescription: "The brave queen who was chosen for a special purpose.",
    image: "/assets/characters/esther.png",
  },
];

export function getCharacter(id: string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

/** Generation 1 heroes only. */
export const GEN1_CHARACTERS = CHARACTERS.filter((c) => c.generation === 1);

/** Generation 2 heroes (locked/Coming Soon). */
export const GEN2_CHARACTERS = CHARACTERS.filter((c) => c.generation === 2);
