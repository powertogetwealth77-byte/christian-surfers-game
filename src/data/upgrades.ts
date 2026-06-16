import type { UpgradeDef } from "../types";

export const UPGRADES: UpgradeDef[] = [
  {
    id: "shieldStart",
    name: "Armor Bearer",
    desc: "Chance to begin each run with a Shield of Faith",
    maxLevel: 3,
    baseCost: 200,
  },
  {
    id: "powerDuration",
    name: "Anointing Oil",
    desc: "+1.5s power-up duration per level",
    maxLevel: 5,
    baseCost: 150,
  },
  {
    id: "coinValue",
    name: "Hundredfold",
    desc: "+20% Light Coin score value per level",
    maxLevel: 5,
    baseCost: 180,
  },
  {
    id: "graceWindow",
    name: "New Mercies",
    desc: "The Accuser recovers more slowly after a stumble",
    maxLevel: 3,
    baseCost: 250,
  },
];

export function upgradeCost(def: UpgradeDef, level: number): number {
  return Math.round(def.baseCost * Math.pow(1.8, level));
}
