export type Screen =
  | "loading"
  | "start"
  | "characters"
  | "boards"
  | "collection"
  | "missions"
  | "upgrades"
  | "settings"
  | "game"
  | "gameover"
  | "rewards"
  | "install";

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
  title: string;
  outfit: string;
  clothingText: string;
  theme: string;
  ability: string;
  abilityDesc: string;
  price: number;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    skin: string;
  };
  unlocked: boolean;
  // --- Attachment system: who this runner *is* ---
  rarity: Rarity;
  tagline: string; // one-line personality hook
  bio: string; // short character story
  scripture: string; // their anchor verse
  signaturePower: string; // signature ability name (display)
  voiceLine: string; // spoken/printed catchphrase on select & victory
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

export interface ScriptureDef {
  ref: string;
  text: string;
}

/** A collectible scripture hoverboard. */
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
  missionsCompleted: string[];
  xpEarned: number;
}

export interface SaveData {
  totalCoins: number;
  totalXp: number;
  bestScore: number;
  bestDistance: number;
  ownedCharacters: string[];
  selectedCharacter: string;
  ownedBoards: string[];
  equippedBoard: string;
  lastDailyClaim: string; // YYYY-MM-DD of the last claimed Daily Blessing
  dailyStreak: number; // consecutive days claimed
  lifetime: LifetimeStats;
  claimedAchievements: string[];
  completedMissions: string[];
  unlockedScriptures: string[];
  upgrades: Record<string, number>;
  settings: {
    muted: boolean;
    music: boolean;
    haptics: boolean;
    screenShake: boolean;
    voiceScriptures: boolean;
  };
}
