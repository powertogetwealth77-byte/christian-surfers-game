/**
 * Phase 14 §4 — Subscription-Ready Architecture (feature gating ONLY).
 *
 * There are NO payments, billing, checkout, pricing UI, or external services
 * here — and there must never be added to this file casually. This is a pure,
 * local feature-flag layer. A future paid upgrade should require changing
 * exactly ONE thing: the `ACTIVE_TIER` constant below (or, later, swapping how
 * `currentTier()` is resolved). Everything else reads from `planFeatures()`.
 */

export type PlanTier = "free" | "family" | "legacy";

export interface PlanFeatures {
  /** Maximum number of child profiles a family can create. */
  maxChildren: number;
  /** Parent Command Center dashboard. */
  parentDashboard: boolean;
  /** Weekly progress report generator. */
  weeklyReports: boolean;
  /** Full per-child growth analytics (vs. a teaser). */
  fullAnalytics: boolean;
}

/**
 * The single source of truth for every tier's capabilities. To launch paid
 * plans later, the ONLY code change required is flipping `ACTIVE_TIER` (or
 * wiring `currentTier()` to a real entitlement). No screen reads tiers
 * directly — they all go through `planFeatures()` / `hasFeature()`.
 */
export const PLAN_MATRIX: Record<PlanTier, PlanFeatures> = {
  // The current shipping build. Generous on purpose: everything is FREE today.
  free: {
    maxChildren: 5,
    parentDashboard: true,
    weeklyReports: true,
    fullAnalytics: true,
  },
  // Future paid family plan — identical capabilities for now, room to diverge.
  family: {
    maxChildren: 5,
    parentDashboard: true,
    weeklyReports: true,
    fullAnalytics: true,
  },
  // Future lifetime/legacy supporters.
  legacy: {
    maxChildren: 5,
    parentDashboard: true,
    weeklyReports: true,
    fullAnalytics: true,
  },
};

/**
 * The tier this build ships as. Change this ONE constant to gate features
 * behind a paid plan in the future. Today: everything is free.
 */
export const ACTIVE_TIER: PlanTier = "free";

/** Resolve the active plan tier. Future: read a real entitlement here. */
export function currentTier(): PlanTier {
  return ACTIVE_TIER;
}

/** The feature set available to the current tier. */
export function planFeatures(): PlanFeatures {
  return PLAN_MATRIX[currentTier()];
}

/** Convenience: is a given boolean feature available right now? */
export function hasFeature(
  feature: "parentDashboard" | "weeklyReports" | "fullAnalytics",
): boolean {
  return planFeatures()[feature];
}
