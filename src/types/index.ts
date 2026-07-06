export type Screen =
  | "loading"
  | "start"
  | "characters"
  | "boards"
  | "collection"
  | "missions"
  | "scripture"
  | "upgrades"
  | "settings"
  | "game"
  | "gameover"
  | "rewards"
  | "install"
  | "venues"
  | "profile"
  | "dashboard"
  | "shoes"
  | "cosmetics"
  | "finishvictory";

export type VenueId =
  | "boardwalk"
  | "city"
  | "river"
  | "mountain"
  | "crowncity"
  | "victoryharbor"
  | "mercybay";

export interface VenueDef {
  id: VenueId;
  name: string;
  emblem: string;       // emoji for the picker
  desc: string;
  // Palette overrides the renderer reads (all optional → fall back to boardwalk defaults)
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  roadColor: string;    // base road/path color
  roadEdge: string;     // road edge/rail glow color
  accent: string;       // prop accent (windows, water, gates)
  ambient: string;      // atmospheric tint
  /** Phase 16.8 — painted backdrop photo, blended behind the live perspective
   *  road. Falls back to the hand-drawn procedural backdrop while loading or
   *  if the image is missing. */
  bgImage?: string;
}

export type Lane = 0 | 1 | 2;

export type ObstacleKind =
  | "shadowGate"
  | "distractionDrone"
  | "fearFog"
  | "brokenSign"
  | "fallenCrate"
  | "darkChains"
  | "accusationScroll"
  | "pitCrack"
  | "movingBarrier";

/** How the obstacle is avoided. */
export type ObstacleProfile = "jump" | "slide" | "dodge";

export type CollectibleKind = "coin" | "scroll" | "crown" | "key" | "gem";

export type PowerUpKind =
  | "shield"
  | "scriptureBoost"
  | "magnet"
  | "revivalFire"
  | "wings"
  | "holySprint"
  | "angelDash"
  | "livingWater"
  | "armorGod"
  | "kingdomSurge";

/** Collectible rarity tiers, shared by characters and boards. */
export type Rarity = "common" | "rare" | "epic" | "legendary" | "kingdom";

export interface CharacterDef {
  id: string;
  name: string;
  outfit: string;
  clothingText: string;
  theme: string;
  ability: string;
  abilityDesc: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    skin: string;
  };
  unlocked: boolean;
  cost?: number; // Light Coins to unlock; omitted/0 = free starter runner
  // --- Attachment system: who this runner *is* ---
  rarity: Rarity;
  tagline: string; // one-line personality hook
  bio: string; // short character story
  favoriteScripture: string; // their anchor verse
  signaturePower: string; // signature ability name (display)
  voiceLine: string; // spoken/printed catchphrase on select & victory
  /** Phase 16.2 — Generation the character belongs to. */
  generation?: 1 | 2;
  /** Phase 16.2 — Generation 2 heroes not yet purchasable; show Coming Soon. */
  comingSoon?: boolean;
  /** Phase 16.3 — short kid-friendly ability blurb shown on the hero card. */
  abilityShort?: string;
  /** Phase 16.3 — signature scripture board name (UI identity for now). */
  boardName?: string;
  /** Phase 16.3 — signature scripture shoe name (UI identity for now). */
  shoeName?: string;
  /** Phase 16.3 — short victory line shown on the finish-line victory screen. */
  victoryLine?: string;
  /** Phase 16.3 — one-line kid-friendly description for the hero card. */
  kidDescription?: string;
  /** Phase 16.4 — 3D character art. All optional; SVG avatar is the fallback.
   *  `image` is the primary art used everywhere a context-specific art is absent. */
  image?: string;
  portrait?: string;   // tall portrait (character select / Parent Hub)
  cardArt?: string;    // wide card / banner art
  silhouette?: string; // locked / Coming Soon teaser
}

export interface PowerUpDef {
  kind: PowerUpKind;
  name: string;
  desc: string;
  color: string;
  icon: string;
  baseDuration: number; // seconds; 0 = until consumed
}

export interface MissionDef {
  id: string;
  title: string;
  target: number;
  metric:
    | "coins"
    | "dodges"
    | "scrolls"
    | "shields"
    | "distance"
    | "surviveSeconds";
  rewardCoins: number;
  rewardXp: number;
}

export type ScriptureCategory =
  | "identity"
  | "courage"
  | "faith"
  | "protection"
  | "joy"
  | "wisdom"
  | "love"
  | "encouragement";

export interface ScriptureDef {
  ref: string;
  text: string;
  category: ScriptureCategory;
}

/** A collectible scripture shoe with gameplay modifiers. */
export interface ShoeDef {
  id: string;
  name: string;
  scripture: string; // scripture reference (e.g., "Isaiah 43:2")
  cost: number; // Light Coins; 0 = free
  iapProductId?: string; // RevenueCat product ID for premium shoes
  emblem: string; // emoji shown in picker
  desc: string;
  color: string; // primary color hex
  accent: string; // accent color hex
  mood: string; // theme descriptor (e.g., "courage", "protection")
  setting: string; // visual environment description
  element: string; // specific visual design element
  particleEffect: string; // particle effect description for gameplay
  rarity: Rarity;
  image?: string; // main 1024×1536 hero PNG
  thumb?: string; // 256×256 square thumbnail
  icon?: string; // 64×64 icon for UI chips
  isPremium: boolean;
  seasonal?: string; // "christmas" | "easter" | "pentecost" etc.
  // Gameplay modifiers (multiplicative from 1.0 base)
  gameplayMods: {
    speedMult?: number;
    jumpMult?: number;
    coinMagnetRange?: number;
    revivalFireRange?: number;
    shieldDuration?: number;
    recoveryRegen?: number;
    pathVisibility?: number;
    collectibleRange?: number;
    satanRepel?: number;
  };
}

/** A collectible scripture hoverboard with gameplay modifiers. */
export interface BoardDef {
  id: string;
  name: string;
  cost: number; // Light Coins; 0 = free default
  text: string; // scripture printed on the deck
  emblem: string; // small emoji shown in the store
  desc: string;
  color: string; // deck base color
  edge: string; // glowing edge / rim
  trail: string; // motion-trail color in gameplay
  rarity: Rarity;
  lore: string; // flavor / collection lore
  // Phase 16.5 cosmetics enhancement
  iapProductId?: string; // RevenueCat product ID for premium boards
  scripture?: string; // scripture reference for cosmetic boards
  image?: string; // main 1024×1536 hero PNG
  thumb?: string; // 256×256 square thumbnail
  icon?: string; // 64×64 icon for UI chips
  isPremium?: boolean;
  seasonal?: string; // "christmas" | "easter" | "pentecost" etc.
  // Gameplay modifiers (multiplicative from 1.0 base)
  gameplayMods?: {
    revivalPush?: number;
    powerUpDuration?: number;
    dodgeWindow?: number;
    treasureReveal?: number;
    fearReduction?: number;
    reviverCharge?: number;
    accuserRepel?: number;
  };
}

export type AchievementMetric =
  | "distance"
  | "coins"
  | "scrolls"
  | "runs"
  | "bestCombo"
  | "boards"
  | "bestScore";

export interface AchievementDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  metric: AchievementMetric;
  target: number;
  reward: number; // Light Coins on claim
}

/** Cumulative lifetime totals that drive achievements. */
export interface LifetimeStats {
  distance: number;
  coins: number;
  scrolls: number;
  runs: number;
  bestCombo: number;
  perfectDodges: number;
  /** Phase 14 — cumulative seconds played (summed from per-run surviveSeconds). */
  playSeconds: number;
}

export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  maxLevel: number;
  baseCost: number;
}

export interface RunStats {
  score: number;
  distance: number;
  coins: number;
  scrolls: number;
  crowns: number;
  keys: number;
  gems: number;
  dodges: number;
  perfectDodges: number;
  bestCombo: number;
  shieldsUsed: number;
  surviveSeconds: number;
  scripturesSeen: string[];
  /** Per-verse count of full scriptures heard this run (Section 3A). */
  scripturesHeard: Record<string, number>;
  /** Spaced repetition: last heard date per verse ref. */
  scriptureLastHeardUpdates: Record<string, string>;
  missionsCompleted: string[];
  xpEarned: number;
}

/** Scripture delivery mode (Section 3A). Full Scripture is always the default. */
export type ScriptureMode = "full" | "memory" | "repeat" | "encouragement";

export interface CharacterAchievement {
  id: string;
  characterId: string;
  title: string;
  desc: string;
  icon: string;
  requirement: (save: SaveData, charId: string) => boolean;
}

export interface FriendshipReward {
  level: number;
  coins: number;
  desc: string;
}

export interface CosmeticPurchase {
  cosmeticId: string;
  type: "shoe" | "board";
  purchasedAt: string; // ISO 8601 date string
  price: number; // in cents (e.g., 499 = $4.99)
  iapTransactionId?: string; // RevenueCat transaction ID
  currency?: string; // "USD", "EUR", etc.
}

export interface SaveData {
  totalCoins: number;
  totalXp: number;
  bestScore: number;
  bestDistance: number;
  selectedCharacter: string;
  ownedCharacters: string[];
  ownedBoards: string[];
  equippedBoard: string;
  /** Phase 15 §2 — Scripture Shoes. */
  ownedShoes: string[];
  equippedShoe: string;
  selectedVenue: VenueId;
  lastDailyClaim: string; // YYYY-MM-DD of the last claimed Daily Blessing
  dailyStreak: number; // consecutive days claimed
  lifetime: LifetimeStats;
  claimedAchievements: string[];
  completedMissions: string[];
  unlockedScriptures: string[];
  /** Scripture Mastery: verse ref → mastery level (0–5). Drives the memory system. */
  scriptureMastery: Record<string, number>;
  /** Scripture Memory: verse ref → lifetime count of full scriptures heard. */
  scriptureHeard: Record<string, number>;
  /** Spaced repetition: verse ref → ISO date string of last heard. */
  scriptureLastHeard: Record<string, string>;
  /** Favorite verses by ref. */
  favoriteScriptures: string[];
  upgrades: Record<string, number>;
  friendship: Record<string, { xp: number; level: number; runs: number }>;
  /** Scripture Badges earned by fully mastering verses. */
  scriptureBadges: number;
  /** Scripture hearing streak: consecutive days with at least one scripture heard. */
  scriptureStreakDays: number;
  /** Last date scriptures were heard (YYYY-MM-DD). */
  scriptureStreakLastDate: string;
  /** Phase 14 — longest scripture-hearing streak ever reached. */
  scriptureStreakBest: number;
  /** Phase 16 — Finish Line victory stats. */
  finishVictories: number;
  finishCorrectAnswers: number;
  finishScriptureTier: number;
  finishVictoryStreak: number;
  finishLongestStreak: number;
  /** Phase 16.5 — Premium cosmetics (shoes & boards) purchase history. */
  cosmeticPurchases: CosmeticPurchase[];
  /** Phase 16.5 — Cosmetic shards earned (5 shards = 1 free cosmetic unlock). */
  cosmeticShards: Record<string, number>; // cosmeticId → shard count
  settings: {
    muted: boolean;
    music: boolean;
    haptics: boolean;
    screenShake: boolean;
    voiceScriptures: boolean;
    voiceVolume: number; // 0..1 spoken-scripture loudness
    voiceGender: "auto" | "male" | "female";
    scriptureIntervalMin: number; // minutes between timed Heavenly Scriptures
    scriptureMode: ScriptureMode; // how verses are delivered (default "full")
  };
}
