import type { Rarity } from "../types";

export interface KingdomScene {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cost: number;
  rarity: Rarity;
  colors: {
    skyTop: string;
    skyMid: string;
    seaTop: string;
    seaDeep: string;
    glow: string;
  };
}

export const DEFAULT_VENUE_ID = "sunrise-boardwalk";

export const KINGDOM_SCENES: KingdomScene[] = [
  {
    id: "sunrise-boardwalk",
    title: "Sunrise Boardwalk",
    subtitle: "A golden boardwalk into the kingdom light",
    description: "The free starter venue: bright, readable, and built for the first run.",
    image: "/assets/backgrounds/kingdom-paths/royal-harbor-gateway.jpg",
    cost: 0,
    rarity: "common",
    colors: {
      skyTop: "#1e2a78",
      skyMid: "#7a4fb0",
      seaTop: "#1f7ba6",
      seaDeep: "#0c3a5e",
      glow: "#ffd166",
    },
  },
  {
    id: "mercy-bay",
    title: "Mercy Bay",
    subtitle: "Cross banners over a glowing surf runway",
    description: "A peaceful pier venue with soft blue water, gold light, and clear kid-friendly readability.",
    image: "/assets/backgrounds/kingdom-paths/sunrise-faith-pier.jpg",
    cost: 250,
    rarity: "rare",
    colors: {
      skyTop: "#0f3d74",
      skyMid: "#2f80b8",
      seaTop: "#22b8cf",
      seaDeep: "#0b4f6c",
      glow: "#ffe8a3",
    },
  },
  {
    id: "living-water-cove",
    title: "Living Water Cove",
    subtitle: "A wave portal path across crystal water",
    description: "A premium cove with living-water energy and clean blue motion for fast gameplay.",
    image: "/assets/backgrounds/kingdom-paths/living-water-tunnel.jpg",
    cost: 500,
    rarity: "epic",
    colors: {
      skyTop: "#0c2454",
      skyMid: "#145ea8",
      seaTop: "#2dd4bf",
      seaDeep: "#063d57",
      glow: "#67e8f9",
    },
  },
  {
    id: "revival-pier",
    title: "Revival Pier",
    subtitle: "A flame-lit harbor for night runs",
    description: "A dramatic night venue with warm revival-fire lighting and strong button contrast.",
    image: "/assets/backgrounds/kingdom-paths/firelight-harbor.jpg",
    cost: 750,
    rarity: "epic",
    colors: {
      skyTop: "#170b2e",
      skyMid: "#5b2141",
      seaTop: "#c45b38",
      seaDeep: "#221047",
      glow: "#fb923c",
    },
  },
  {
    id: "crown-city-promenade",
    title: "Crown City Promenade",
    subtitle: "Blue-and-gold palace streets beside the sea",
    description: "A royal city approach with crown colors, banners, and bright family-safe fantasy energy.",
    image: "/assets/backgrounds/kingdom-paths/royal-city-approach.jpg",
    cost: 1000,
    rarity: "legendary",
    colors: {
      skyTop: "#17357a",
      skyMid: "#2563eb",
      seaTop: "#38bdf8",
      seaDeep: "#0f3460",
      glow: "#facc15",
    },
  },
  {
    id: "scrollstone-cliffs",
    title: "Scrollstone Cliffs",
    subtitle: "A sacred mountain road above waterfalls",
    description: "An elevated cliffside venue with waterfalls, ancient stone, and a heroic path forward.",
    image: "/assets/backgrounds/kingdom-paths/cliffside-covenant-path.jpg",
    cost: 1250,
    rarity: "legendary",
    colors: {
      skyTop: "#14305f",
      skyMid: "#4f83c2",
      seaTop: "#14b8a6",
      seaDeep: "#123b52",
      glow: "#d9f99d",
    },
  },
  {
    id: "victory-harbor",
    title: "Victory Harbor",
    subtitle: "A bright coastal bridge toward the city of light",
    description: "The kingdom-tier destination: celebratory, bold, and built to feel like a final victory runway.",
    image: "/assets/backgrounds/kingdom-paths/pearl-coast-bridge.jpg",
    cost: 1500,
    rarity: "kingdom",
    colors: {
      skyTop: "#312e81",
      skyMid: "#7c3aed",
      seaTop: "#06b6d4",
      seaDeep: "#172554",
      glow: "#fde68a",
    },
  },
];

const VENUE_IDS = new Set(KINGDOM_SCENES.map((venue) => venue.id));

export function isVenueId(id: unknown): id is string {
  return typeof id === "string" && VENUE_IDS.has(id);
}

export function getVenue(id: string | undefined | null): KingdomScene {
  return KINGDOM_SCENES.find((venue) => venue.id === id) ?? KINGDOM_SCENES[0];
}
