import type { VenueDef } from "../types";

const BG = "/assets/backgrounds/kingdom-paths";

/**
 * MEGA_GAMEPLAY_UI_FIX_001 — the full seven-venue roster. Each venue is
 * wired to its matching painted backdrop from the kingdom-paths set (all 7
 * images now in use; previously 3 sat orphaned). Existing venue ids keep
 * their values so saved `selectedVenue` fields migrate untouched — only
 * display names/palettes changed, plus three brand-new venues appended.
 */
export const VENUES: VenueDef[] = [
  {
    id: "boardwalk", name: "Sunrise Boardwalk", emblem: "🏖️",
    desc: "Warm sunrise over the golden pier where the journey began.",
    skyTop: "#5a86c9", skyMid: "#a9c9e8", skyBottom: "#ffd98a",
    roadColor: "#8a5a2e", roadEdge: "#ffe08a", accent: "#2a9dc9", ambient: "#ffe6b0",
    bgImage: `${BG}/sunrise-faith-pier.jpg`,
  },
  {
    id: "mercybay", name: "Mercy Bay", emblem: "🕊️",
    desc: "A soft pearl-and-aqua bay — calm water, gentle light, new mercies.",
    skyTop: "#8a6fc9", skyMid: "#c9a9e0", skyBottom: "#ffd9e8",
    roadColor: "#cfc4d8", roadEdge: "#f0d9a8", accent: "#38bdf8", ambient: "#e8d9f5",
    bgImage: `${BG}/pearl-coast-bridge.jpg`,
  },
  {
    id: "river", name: "Living Water Cove", emblem: "🌊",
    desc: "Bright teal water and a great wave arching over the path.",
    skyTop: "#2a8fd4", skyMid: "#6fc8e8", skyBottom: "#bfeaf5",
    roadColor: "#c9a15a", roadEdge: "#a5f3fc", accent: "#38bdf8", ambient: "#cdeffb",
    bgImage: `${BG}/living-water-tunnel.jpg`,
  },
  {
    id: "city", name: "Revival Pier", emblem: "🏮",
    desc: "Warm lanterns and navy-gold evening glow down the revival pier.",
    skyTop: "#0a0e2a", skyMid: "#161c40", skyBottom: "#2a2150",
    roadColor: "#4a2f14", roadEdge: "#ffd54a", accent: "#ffcf6b", ambient: "#ffb35a",
    bgImage: `${BG}/firelight-harbor.jpg`,
  },
  {
    id: "crowncity", name: "Crown City Promenade", emblem: "👑",
    desc: "A royal blue-and-gold promenade of arches, banners and crowns.",
    skyTop: "#1e56c9", skyMid: "#5a90e0", skyBottom: "#bfd9f5",
    roadColor: "#a8b0c0", roadEdge: "#ffd54a", accent: "#2a4fc9", ambient: "#dce8ff",
    bgImage: `${BG}/royal-city-approach.jpg`,
  },
  {
    id: "mountain", name: "Scrollstone Cliffs", emblem: "⛰️",
    desc: "Warm cliffside stone etched with scroll-path gold above the sea.",
    skyTop: "#3a7ac9", skyMid: "#8ac0e8", skyBottom: "#ffe8b8",
    roadColor: "#cdbb8a", roadEdge: "#fff0c0", accent: "#fbbf24", ambient: "#ffe8c0",
    bgImage: `${BG}/cliffside-covenant-path.jpg`,
  },
  {
    id: "victoryharbor", name: "Victory Harbor", emblem: "⚓",
    desc: "A heroic golden harbor — banners, boats, and the victory gate.",
    skyTop: "#c9862a", skyMid: "#e8b56f", skyBottom: "#ffe9bf",
    roadColor: "#9a6a3a", roadEdge: "#ffe08a", accent: "#2a9dc9", ambient: "#ffe0a8",
    bgImage: `${BG}/royal-harbor-gateway.jpg`,
  },
];

export function getVenue(id: string): VenueDef {
  return VENUES.find((v) => v.id === id) ?? VENUES[0];
}
