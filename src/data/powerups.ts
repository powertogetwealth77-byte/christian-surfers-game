import type { PowerUpDef, PowerUpKind } from "../types";

export const POWER_UPS: Record<PowerUpKind, PowerUpDef> = {
  shield: {
    kind: "shield",
    name: "Shield of Faith",
    desc: "Protects you from one collision",
    color: "#f5b82e",
    icon: "🛡️",
    baseDuration: 0,
  },
  scriptureBoost: {
    kind: "scriptureBoost",
    name: "Scripture Boost",
    desc: "Doubles your score for 10 seconds",
    color: "#a78bfa",
    icon: "📖",
    baseDuration: 10,
  },
  magnet: {
    kind: "magnet",
    name: "Crown Magnet",
    desc: "Pulls Light Coins and Crowns toward you",
    color: "#38bdf8",
    icon: "👑",
    baseDuration: 8,
  },
  revivalFire: {
    kind: "revivalFire",
    name: "Revival Fire",
    desc: "Burns through obstacles and pushes the Accuser back",
    color: "#fb7185",
    icon: "🔥",
    baseDuration: 8,
  },
  wings: {
    kind: "wings",
    name: "Wings of Mercy",
    desc: "Longer jumps with a gentle hover",
    color: "#fdf4ff",
    icon: "🕊️",
    baseDuration: 8,
  },
  // ---- Premium tier: rarer spawns, massive impact ----
  holySprint: {
    kind: "holySprint",
    name: "Holy Sprint",
    desc: "Burst of speed — the Accuser falls behind",
    color: "#fbbf24",
    icon: "⚡",
    baseDuration: 6,
  },
  angelDash: {
    kind: "angelDash",
    name: "Angel Dash",
    desc: "Untouchable for 3 seconds — dash through danger",
    color: "#60a5fa",
    icon: "💨",
    baseDuration: 3,
  },
  livingWater: {
    kind: "livingWater",
    name: "Living Water Wave",
    desc: "A wave washes every obstacle from your lane",
    color: "#22d3ee",
    icon: "🌊",
    baseDuration: 0,
  },
  armorGod: {
    kind: "armorGod",
    name: "Armor of God",
    desc: "Blocks two collisions instead of one",
    color: "#a78bfa",
    icon: "⚔️",
    baseDuration: 0,
  },
  kingdomSurge: {
    kind: "kingdomSurge",
    name: "Kingdom Surge",
    desc: "Speed + magnet + 3× score — Satan knocked far back",
    color: "#34d399",
    icon: "👑",
    baseDuration: 10,
  },
};

export const COMMON_POWER_UPS: PowerUpKind[] = [
  "shield",
  "scriptureBoost",
  "magnet",
  "revivalFire",
  "wings",
];

export const PREMIUM_POWER_UPS: PowerUpKind[] = [
  "holySprint",
  "angelDash",
  "livingWater",
  "armorGod",
  "kingdomSurge",
];

export const POWER_UP_LIST = Object.values(POWER_UPS);
