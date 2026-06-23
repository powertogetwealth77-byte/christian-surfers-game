/** Venue tier determines pricing category and availability. */
export type VenueTier = "starter" | "earnable" | "premium";

/** How a venue can be unlocked. */
export type VenueUnlockType = "coins" | "event" | "bundle";

/** Definition of a venue (gameplay environment / background theme). */
export interface VenueDef {
  id: string;
  displayName: string;
  tier: VenueTier;
  unlockType: VenueUnlockType;
  coinCost: number;
  ownedByDefault: boolean;
  flavorTag: string;
  description: string;
  cardArt: string;
  heroArt: string;
  thumbArt: string;
  environmentKey: string;
  assetReady: boolean;
}

/** All venues in the Christian Surfers game. */
export const VENUES: VenueDef[] = [
  // ---- Starter (free default) ----
  {
    id: "sunrise_boardwalk",
    displayName: "Sunrise Boardwalk",
    tier: "starter",
    unlockType: "coins",
    coinCost: 0,
    ownedByDefault: true,
    flavorTag: "Where every run begins with hope",
    description: "A peaceful wooden pier stretching into the dawn-lit sea.",
    cardArt: "/assets/venues/sunrise_boardwalk/preview.png",
    heroArt: "/assets/venues/sunrise_boardwalk/hero.png",
    thumbArt: "/assets/venues/sunrise_boardwalk/thumb.png",
    environmentKey: "sunrise_boardwalk",
    assetReady: false,
  },
  // ---- Earnable (mid-tier coin grind) ----
  {
    id: "mercy_bay",
    displayName: "Mercy Bay",
    tier: "earnable",
    unlockType: "coins",
    coinCost: 25000,
    ownedByDefault: false,
    flavorTag: "Waves of mercy crash upon the shore",
    description: "A serene coastal cove where grace meets the ocean.",
    cardArt: "/assets/venues/mercy_bay/preview.png",
    heroArt: "/assets/venues/mercy_bay/hero.png",
    thumbArt: "/assets/venues/mercy_bay/thumb.png",
    environmentKey: "mercy_bay",
    assetReady: false,
  },
  {
    id: "kingdom_gate_harbor",
    displayName: "Kingdom Gate Harbor",
    tier: "earnable",
    unlockType: "coins",
    coinCost: 60000,
    ownedByDefault: false,
    flavorTag: "Step through the gates into Kingdom glory",
    description: "A golden gateway of light, courage, and holy adventure.",
    cardArt: "/assets/venues/kingdom_gate_harbor/preview.png",
    heroArt: "/assets/venues/kingdom_gate_harbor/hero.png",
    thumbArt: "/assets/venues/kingdom_gate_harbor/thumb.png",
    environmentKey: "kingdom_gate_harbor",
    assetReady: true,
  },
  // ---- Premium (high-tier coin grind) ----
  {
    id: "living_water_cove",
    displayName: "Living Water Cove",
    tier: "premium",
    unlockType: "coins",
    coinCost: 95000,
    ownedByDefault: false,
    flavorTag: "Rivers of living water flow here",
    description: "Crystal waters shimmer with the Spirit's presence.",
    cardArt: "/assets/venues/living_water_cove/preview.png",
    heroArt: "/assets/venues/living_water_cove/hero.png",
    thumbArt: "/assets/venues/living_water_cove/thumb.png",
    environmentKey: "living_water_cove",
    assetReady: false,
  },
  {
    id: "scrollstone_cliffs",
    displayName: "Scrollstone Cliffs",
    tier: "premium",
    unlockType: "coins",
    coinCost: 125000,
    ownedByDefault: false,
    flavorTag: "Ancient stones whisper scripture",
    description: "Towering cliffs carved with timeless truth.",
    cardArt: "/assets/venues/scrollstone_cliffs/preview.png",
    heroArt: "/assets/venues/scrollstone_cliffs/hero.png",
    thumbArt: "/assets/venues/scrollstone_cliffs/thumb.png",
    environmentKey: "scrollstone_cliffs",
    assetReady: false,
  },
  {
    id: "crown_city_promenade",
    displayName: "Crown City Promenade",
    tier: "premium",
    unlockType: "coins",
    coinCost: 160000,
    ownedByDefault: false,
    flavorTag: "Walk the streets of the King's city",
    description: "A golden boulevard leading to the throne room.",
    cardArt: "/assets/venues/crown_city_promenade/preview.png",
    heroArt: "/assets/venues/crown_city_promenade/hero.png",
    thumbArt: "/assets/venues/crown_city_promenade/thumb.png",
    environmentKey: "crown_city_promenade",
    assetReady: false,
  },
  {
    id: "revival_pier",
    displayName: "Revival Pier",
    tier: "premium",
    unlockType: "coins",
    coinCost: 185000,
    ownedByDefault: false,
    flavorTag: "Fire falls and hearts awaken",
    description: "Where the Spirit ignites passion and purpose.",
    cardArt: "/assets/venues/revival_pier/preview.png",
    heroArt: "/assets/venues/revival_pier/hero.png",
    thumbArt: "/assets/venues/revival_pier/thumb.png",
    environmentKey: "revival_pier",
    assetReady: false,
  },
];

/** Get a venue by its ID. Returns the first venue (sunrise_boardwalk) if not found. */
export function getVenueById(id: string): VenueDef {
  return VENUES.find((v) => v.id === id) ?? VENUES[0];
}

/** Get the default venue (sunrise_boardwalk). */
export function getDefaultVenue(): VenueDef {
  return VENUES.find((v) => v.ownedByDefault) ?? VENUES[0];
}

/** Get the card art URL for a venue. Falls back to a safe placeholder if assetReady is false. */
export function getVenueCardArt(venue: VenueDef): string {
  return venue.assetReady ? venue.cardArt : "/assets/venues/placeholder_card.png";
}

/** Get the hero art URL for a venue. Falls back to a safe placeholder if assetReady is false. */
export function getVenueHeroArt(venue: VenueDef): string {
  return venue.assetReady ? venue.heroArt : "/assets/venues/placeholder_hero.png";
}

/** Get the thumb art URL for a venue. Falls back to a safe placeholder if assetReady is false. */
export function getVenueThumbArt(venue: VenueDef): string {
  return venue.assetReady ? venue.thumbArt : "/assets/venues/placeholder_thumb.png";
}

/** Check if a venue's assets are ready for display. */
export function isVenueAssetReady(venue: VenueDef): boolean {
  return venue.assetReady;
}

/** Get all venues filtered by tier. */
export function getVenuesByTier(tier: VenueTier): VenueDef[] {
  return VENUES.filter((v) => v.tier === tier);
}

/** Get all earnable venues (including starter). */
export function getEarnableVenues(): VenueDef[] {
  return VENUES.filter((v) => v.tier === "starter" || v.tier === "earnable");
}

/** Get all premium venues. */
export function getPremiumVenues(): VenueDef[] {
  return VENUES.filter((v) => v.tier === "premium");
}
