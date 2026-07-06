/**
 * Phase 16.5 §2 — Receipt validation seam.
 *
 * Christian Surfers has no backend of its own (see IMPLEMENTATION_ROADMAP.md
 * Week 2) — this game is a static PWA. Real IAP receipt validation must
 * happen server-side (RevenueCat's servers, or a thin serverless function)
 * so a jailbroken/rooted client can't fake ownership. This module defines
 * the contract that call sites use today, backed by a dev-safe stub, and
 * documents exactly what changes when a validation endpoint exists.
 *
 * To go live:
 *   1. Stand up an endpoint (e.g. a Vercel/Cloudflare function) that holds
 *      the RevenueCat secret API key and re-validates client tokens.
 *   2. Point RECEIPT_VALIDATION_ENDPOINT at it.
 *   3. Delete `devAlwaysValid` and the isDev branch below.
 */

export interface Receipt {
  platform: "ios" | "android" | "web";
  productId: string;
  transactionId: string;
  purchaseTimeMs: number;
  /** Opaque signed token from the platform store / RevenueCat SDK. */
  token: string;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const RECEIPT_VALIDATION_ENDPOINT = import.meta.env?.VITE_RECEIPT_VALIDATION_URL as
  | string
  | undefined;

const isDev = typeof import.meta !== "undefined" && Boolean(import.meta.env?.DEV);

/**
 * Validate a receipt server-side. Falls back to accepting all receipts in
 * dev builds (no endpoint configured) so the purchase flow is testable
 * before a backend exists — this fallback must never ship to production.
 */
export async function validateReceipt(receipt: Receipt): Promise<ValidationResult> {
  if (!RECEIPT_VALIDATION_ENDPOINT) {
    if (isDev) {
      return { valid: true, reason: "dev-mode: no validation endpoint configured" };
    }
    return { valid: false, reason: "no validation endpoint configured" };
  }

  try {
    const res = await fetch(RECEIPT_VALIDATION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(receipt),
    });
    if (!res.ok) return { valid: false, reason: `validator returned ${res.status}` };
    const body = (await res.json()) as { valid: boolean; reason?: string };
    return body;
  } catch (err) {
    return { valid: false, reason: err instanceof Error ? err.message : "network error" };
  }
}
