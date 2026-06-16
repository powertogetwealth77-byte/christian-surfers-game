import type { Rarity } from "../types";

export interface RarityMeta {
  label: string;
  /** Badge / border color. */
  color: string;
  /** Soft glow color for cards and unlock moments. */
  glow: string;
  /** Display order, common → kingdom. */
  order: number;
}

export const RARITY: Record<Rarity, RarityMeta> = {
  common: { label: "Common", color: "#9ca3af", glow: "rgba(156,163,175,0.5)", order: 0 },
  rare: { label: "Rare", color: "#38bdf8", glow: "rgba(56,189,248,0.55)", order: 1 },
  epic: { label: "Epic", color: "#a78bfa", glow: "rgba(167,139,250,0.6)", order: 2 },
  legendary: { label: "Legendary", color: "#fbbf24", glow: "rgba(251,191,36,0.65)", order: 3 },
  kingdom: { label: "Kingdom", color: "#f0abfc", glow: "rgba(240,171,252,0.7)", order: 4 },
};

export function rarityMeta(r: Rarity): RarityMeta {
  return RARITY[r];
}
