import type { CharacterAchievement, FriendshipReward, SaveData } from "../types";

// XP needed to reach level n from level 1 (cumulative)
// Level n costs (n-1)*100 XP to reach from level n-1
// So totalXP for level n = sum of 100*(i) for i=1..n-1 = 100 * n*(n-1)/2
export function friendshipXpForLevel(level: number): number {
  if (level <= 1) return 0;
  const l = Math.min(level, 50);
  return (100 * l * (l - 1)) / 2;
}

export function friendshipLevel(xp: number): number {
  for (let lvl = 50; lvl >= 2; lvl--) {
    if (xp >= friendshipXpForLevel(lvl)) return lvl;
  }
  return 1;
}

export function friendshipProgress(xp: number): number {
  const lvl = friendshipLevel(xp);
  if (lvl >= 50) return 1;
  const current = friendshipXpForLevel(lvl);
  const next = friendshipXpForLevel(lvl + 1);
  return (xp - current) / (next - current);
}

export function friendshipLevelName(level: number): string {
  if (level >= 50) return "Soul Companion 👑";
  if (level >= 40) return "Best Friend";
  if (level >= 30) return "Close Friend";
  if (level >= 20) return "Friend";
  if (level >= 10) return "Acquaintance";
  return "Stranger";
}

export const FRIENDSHIP_REWARDS: FriendshipReward[] = [
  { level: 2, coins: 100, desc: "Friendship begins!" },
  { level: 5, coins: 250, desc: "Growing bond" },
  { level: 10, coins: 500, desc: "True friends" },
  { level: 15, coins: 750, desc: "Kindred spirits" },
  { level: 20, coins: 1000, desc: "Soul companions" },
  { level: 25, coins: 1500, desc: "Faith partners" },
  { level: 30, coins: 2000, desc: "Kingdom allies" },
  { level: 40, coins: 3500, desc: "Legend bond" },
  { level: 50, coins: 5000, desc: "Eternal friendship 👑" },
];

export const CHARACTER_ACHIEVEMENTS: CharacterAchievement[] = [
  // zion
  {
    id: "zion_first_light",
    characterId: "zion",
    title: "First Light",
    desc: "Complete your first run as Zion",
    icon: "🌅",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 1,
  },
  {
    id: "zion_shield_of_faith",
    characterId: "zion",
    title: "Shield of Faith",
    desc: "Reach Friendship Level 5 with Zion",
    icon: "🛡️",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.level ?? 1) >= 5,
  },
  {
    id: "zion_holy_ground",
    characterId: "zion",
    title: "Holy Ground",
    desc: "Complete 10 runs as Zion",
    icon: "⛰️",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 10,
  },
  // grace
  {
    id: "grace_upon_grace",
    characterId: "grace",
    title: "Grace Upon Grace",
    desc: "Complete 5 runs as Grace",
    icon: "🤍",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 5,
  },
  {
    id: "grace_double_blessing",
    characterId: "grace",
    title: "Double Blessing",
    desc: "Reach Friendship Level 5 with Grace",
    icon: "✨",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.level ?? 1) >= 5,
  },
  {
    id: "grace_graceful",
    characterId: "grace",
    title: "Graceful",
    desc: "Complete 20 runs as Grace",
    icon: "🕊️",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 20,
  },
  // judah
  {
    id: "judah_war_cry",
    characterId: "judah",
    title: "War Cry",
    desc: "Complete 3 runs as Judah",
    icon: "🦁",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 3,
  },
  {
    id: "judah_mighty_push",
    characterId: "judah",
    title: "Mighty Push",
    desc: "Reach Friendship Level 5 with Judah",
    icon: "💪",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.level ?? 1) >= 5,
  },
  {
    id: "judah_lion_of_judah",
    characterId: "judah",
    title: "Lion of Judah",
    desc: "Complete 15 runs as Judah",
    icon: "👑",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 15,
  },
  // kai
  {
    id: "kai_high_flyer",
    characterId: "kai",
    title: "High Flyer",
    desc: "Complete 3 runs as Kai",
    icon: "🌊",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 3,
  },
  {
    id: "kai_above_the_storm",
    characterId: "kai",
    title: "Above the Storm",
    desc: "Reach Friendship Level 5 with Kai",
    icon: "⛅",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.level ?? 1) >= 5,
  },
  {
    id: "kai_wave_rider",
    characterId: "kai",
    title: "Wave Rider",
    desc: "Complete 15 runs as Kai",
    icon: "🏄",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 15,
  },
  // mercy
  {
    id: "mercy_new_every_morning",
    characterId: "mercy",
    title: "New Every Morning",
    desc: "Complete 5 runs as Mercy",
    icon: "🌸",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 5,
  },
  {
    id: "mercy_covered",
    characterId: "mercy",
    title: "Covered",
    desc: "Reach Friendship Level 5 with Mercy",
    icon: "🌹",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.level ?? 1) >= 5,
  },
  {
    id: "mercy_merciful",
    characterId: "mercy",
    title: "Merciful",
    desc: "Complete 20 runs as Mercy",
    icon: "💗",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 20,
  },
  // caleb
  {
    id: "caleb_wholehearted",
    characterId: "caleb",
    title: "Wholehearted",
    desc: "Complete 5 runs as Caleb",
    icon: "💚",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 5,
  },
  {
    id: "caleb_well_able",
    characterId: "caleb",
    title: "Well Able",
    desc: "Reach Friendship Level 5 with Caleb",
    icon: "🗡️",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.level ?? 1) >= 5,
  },
  {
    id: "caleb_giant_slayer",
    characterId: "caleb",
    title: "Giant Slayer",
    desc: "Complete 20 runs as Caleb",
    icon: "⚔️",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 20,
  },
  // selah
  {
    id: "selah_be_still",
    characterId: "selah",
    title: "Be Still",
    desc: "Complete 3 runs as Selah",
    icon: "🌙",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 3,
  },
  {
    id: "selah_peaceful_warrior",
    characterId: "selah",
    title: "Peaceful Warrior",
    desc: "Reach Friendship Level 5 with Selah",
    icon: "🔮",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.level ?? 1) >= 5,
  },
  {
    id: "selah_sanctuary",
    characterId: "selah",
    title: "Sanctuary",
    desc: "Complete 15 runs as Selah",
    icon: "🏛️",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 15,
  },
  // malachi
  {
    id: "malachi_rising_son",
    characterId: "malachi",
    title: "Rising Son",
    desc: "Complete 3 runs as Malachi",
    icon: "☀️",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 3,
  },
  {
    id: "malachi_sun_of_righteousness",
    characterId: "malachi",
    title: "Sun of Righteousness",
    desc: "Reach Friendship Level 5 with Malachi",
    icon: "🔥",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.level ?? 1) >= 5,
  },
  {
    id: "malachi_kingdom_come",
    characterId: "malachi",
    title: "Kingdom Come",
    desc: "Complete 10 runs as Malachi",
    icon: "⚡",
    requirement: (save: SaveData, charId: string) =>
      (save.friendship[charId]?.runs ?? 0) >= 10,
  },
];
