/**
 * Phase 16.5 §2 — Cosmetics purchase service.
 *
 * Wraps whatever billing provider is actually wired up behind one interface
 * so CosmeticShopScreen (Week 3) never has to know if it's talking to
 * RevenueCat, Stripe, or a local dev stub. Today there is no RevenueCat
 * account and no native shell (Capacitor) around this PWA, so the default
 * provider is `LocalDevPurchaseProvider` — it grants the cosmetic
 * immediately and fabricates a transaction id, which is enough to build and
 * test the shop UI and SaveData plumbing end-to-end.
 *
 * To go live with real money:
 *   1. `npm install @revenuecat/purchases-capacitor` (mobile) or wire
 *      RevenueCat's Web Billing SDK (web), inside a new
 *      `RevenueCatPurchaseProvider implements CosmeticPurchaseProvider`.
 *   2. Swap the `provider` passed to `purchaseService` below.
 *   3. Nothing else in the app changes — screens call `purchaseService.*`.
 */

import type { CosmeticType } from "./AnalyticsService";
import { trackPurchaseCompleted, trackPurchaseFailed } from "./AnalyticsService";
import { validateReceipt, type Receipt } from "./ReceiptValidator";

export interface PurchaseResult {
  success: boolean;
  cosmeticId: string;
  type: CosmeticType;
  transactionId?: string;
  error?: string;
}

/** Anything that can fulfil a cosmetic purchase implements this. */
export interface CosmeticPurchaseProvider {
  /** Whether this cosmetic is already owned according to the provider. */
  hasOwned(cosmeticId: string, type: CosmeticType): Promise<boolean>;
  /** Kick off the native/web purchase flow for a priced cosmetic. */
  purchase(cosmeticId: string, type: CosmeticType, priceCents: number): Promise<PurchaseResult>;
  /** Re-sync ownership from the store (e.g. after "Restore Purchases"). */
  restoredCosmeticIds(): Promise<string[]>;
}

/**
 * Dev-safe provider used until a real billing SDK is wired up. Purchases
 * always "succeed" instantly — there is no real money involved, and no
 * server to record the transaction against, so ownership only lives in
 * SaveData (handled by the caller, same as free cosmetics).
 */
export class LocalDevPurchaseProvider implements CosmeticPurchaseProvider {
  async hasOwned(): Promise<boolean> {
    // SaveData.ownedShoes/ownedBoards is the source of truth for the dev
    // provider — callers check that directly, so this is intentionally
    // always false to avoid a second, easily-desynced source of truth.
    return false;
  }

  async purchase(
    cosmeticId: string,
    type: CosmeticType,
    priceCents: number
  ): Promise<PurchaseResult> {
    const receipt: Receipt = {
      platform: "web",
      productId: cosmeticId,
      transactionId: `dev_${cosmeticId}_${priceCents}`,
      purchaseTimeMs: 0,
      token: "dev-stub",
    };
    const validation = await validateReceipt(receipt);
    if (!validation.valid) {
      trackPurchaseFailed(cosmeticId, type, validation.reason ?? "validation failed");
      return { success: false, cosmeticId, type, error: validation.reason };
    }
    trackPurchaseCompleted(cosmeticId, type, priceCents, "iap", receipt.transactionId);
    return { success: true, cosmeticId, type, transactionId: receipt.transactionId };
  }

  async restoredCosmeticIds(): Promise<string[]> {
    return [];
  }
}

/**
 * Codex review fix (PR #3, P1) — always-instant fake receipts must never be
 * reachable from a real "Buy Now" button in a production build. Purchases
 * fail closed at the receipt-validation layer already (see
 * ReceiptValidator.ts), but that only surfaces as a generic "purchase
 * failed" toast after the user taps Buy — this provider makes the
 * unavailable state explicit and immediate, with no purchase attempt at all.
 */
export class UnavailablePurchaseProvider implements CosmeticPurchaseProvider {
  async hasOwned(): Promise<boolean> {
    return false;
  }

  async purchase(cosmeticId: string, type: CosmeticType): Promise<PurchaseResult> {
    return {
      success: false,
      cosmeticId,
      type,
      error: "Purchases are not available yet in this build.",
    };
  }

  async restoredCosmeticIds(): Promise<string[]> {
    return [];
  }
}

/**
 * True only when it's safe to use the dev-stub provider: local Vite dev
 * server, or an explicit opt-in flag for internal/staging builds. A plain
 * `vite build` (what Vercel previews and production both run) has
 * `import.meta.env.DEV === false`, so a standard preview build already
 * falls through to `UnavailablePurchaseProvider` below.
 */
export const isDevPurchasesEnabled: boolean =
  (typeof import.meta !== "undefined" && Boolean(import.meta.env?.DEV)) ||
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_ENABLE_DEV_PURCHASES === "true");

export class PurchaseService {
  constructor(private provider: CosmeticPurchaseProvider) {}

  hasOwned(cosmeticId: string, type: CosmeticType): Promise<boolean> {
    return this.provider.hasOwned(cosmeticId, type);
  }

  purchaseCosmetic(
    cosmeticId: string,
    type: CosmeticType,
    priceCents: number
  ): Promise<PurchaseResult> {
    return this.provider.purchase(cosmeticId, type, priceCents);
  }

  restoreCosmeticIds(): Promise<string[]> {
    return this.provider.restoredCosmeticIds();
  }
}

/** True when the shop UI should present premium Buy Now as active/tappable. */
export const purchasesAvailable = isDevPurchasesEnabled;

export const purchaseService = new PurchaseService(
  isDevPurchasesEnabled ? new LocalDevPurchaseProvider() : new UnavailablePurchaseProvider()
);
