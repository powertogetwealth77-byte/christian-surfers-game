/**
 * Phase 16.5 §2 — Cosmetics analytics instrumentation.
 *
 * Every cosmetic-related action funnels through here so the monetization
 * dashboards described in MONETIZATION_STRATEGY.md (conversion funnel,
 * cosmetic popularity, ARPU cohorts) have real data to read from day one.
 *
 * No analytics vendor is wired up yet — events are buffered in memory and
 * mirrored to console in dev. Swap `emit()` for a real SDK call (Firebase,
 * Amplitude, PostHog, …) when one is chosen; every call site above this
 * function stays unchanged.
 */

export type CosmeticType = "shoe" | "board";

interface CosmeticBrowseEvent {
  cosmeticId: string;
  type: CosmeticType;
}

interface PurchaseInitiatedEvent {
  cosmeticId: string;
  type: CosmeticType;
  priceCents: number;
}

interface PurchaseCompletedEvent {
  cosmeticId: string;
  type: CosmeticType;
  priceCents: number;
  method: "iap" | "earned";
  transactionId?: string;
}

interface PurchaseFailedEvent {
  cosmeticId: string;
  type: CosmeticType;
  reason: string;
}

interface CosmeticEquippedEvent {
  cosmeticId: string;
  type: CosmeticType;
}

interface CosmeticUsageEvent {
  cosmeticId: string;
  type: CosmeticType;
  sessionSeconds: number;
}

type AnalyticsEvent =
  | { name: "cosmetic_browse"; payload: CosmeticBrowseEvent }
  | { name: "purchase_initiated"; payload: PurchaseInitiatedEvent }
  | { name: "purchase_completed"; payload: PurchaseCompletedEvent }
  | { name: "purchase_failed"; payload: PurchaseFailedEvent }
  | { name: "cosmetic_equipped"; payload: CosmeticEquippedEvent }
  | { name: "cosmetic_ingame_usage"; payload: CosmeticUsageEvent };

const buffer: Array<AnalyticsEvent & { at: string }> = [];
const isDev = typeof import.meta !== "undefined" && Boolean(import.meta.env?.DEV);

function emit(event: AnalyticsEvent) {
  const stamped = { ...event, at: new Date().toISOString() };
  buffer.push(stamped);
  if (isDev) {
    // eslint-disable-next-line no-console
    console.info(`[analytics] ${event.name}`, event.payload);
  }
}

export function trackCosmeticBrowse(cosmeticId: string, type: CosmeticType) {
  emit({ name: "cosmetic_browse", payload: { cosmeticId, type } });
}

export function trackPurchaseInitiated(
  cosmeticId: string,
  type: CosmeticType,
  priceCents: number
) {
  emit({ name: "purchase_initiated", payload: { cosmeticId, type, priceCents } });
}

export function trackPurchaseCompleted(
  cosmeticId: string,
  type: CosmeticType,
  priceCents: number,
  method: "iap" | "earned",
  transactionId?: string
) {
  emit({
    name: "purchase_completed",
    payload: { cosmeticId, type, priceCents, method, transactionId },
  });
}

export function trackPurchaseFailed(cosmeticId: string, type: CosmeticType, reason: string) {
  emit({ name: "purchase_failed", payload: { cosmeticId, type, reason } });
}

export function trackCosmeticEquipped(cosmeticId: string, type: CosmeticType) {
  emit({ name: "cosmetic_equipped", payload: { cosmeticId, type } });
}

export function trackCosmeticInGameUsage(
  cosmeticId: string,
  type: CosmeticType,
  sessionSeconds: number
) {
  emit({ name: "cosmetic_ingame_usage", payload: { cosmeticId, type, sessionSeconds } });
}

/** Read-only access to buffered events — used by QA/debug overlays. */
export function getBufferedEvents(): ReadonlyArray<AnalyticsEvent & { at: string }> {
  return buffer;
}
