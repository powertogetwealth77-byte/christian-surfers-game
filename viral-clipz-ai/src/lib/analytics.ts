/**
 * Central analytics event layer.
 * Screens call `track(...)` only; providers (PostHog, etc.) plug in behind
 * the AnalyticsProvider interface so vendors can be swapped without touching
 * product code.
 */

export type AnalyticsEvent =
  | 'account_created'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'source_added'
  | 'project_created'
  | 'processing_started'
  | 'processing_completed'
  | 'clip_previewed'
  | 'clip_edited'
  | 'clip_exported'
  | 'clip_shared'
  | 'social_account_connected'
  | 'upgrade_viewed'
  | 'checkout_started'
  | 'subscription_started'
  | 'project_failed'
  | 'user_invited'
  | 'brand_kit_created';

export interface AnalyticsProvider {
  capture(event: AnalyticsEvent, properties?: Record<string, unknown>): void;
  identify(userId: string, traits?: Record<string, unknown>): void;
  reset(): void;
}

/** Dev/demo provider: logs to the console so events are visible in development. */
const consoleProvider: AnalyticsProvider = {
  capture(event, properties) {
    if (__DEV__) console.log(`[analytics] ${event}`, properties ?? {});
  },
  identify(userId) {
    if (__DEV__) console.log(`[analytics] identify ${userId}`);
  },
  reset() {
    if (__DEV__) console.log('[analytics] reset');
  },
};

let provider: AnalyticsProvider = consoleProvider;

/** Swap in PostHog (or any provider) at app bootstrap once keys exist. */
export function setAnalyticsProvider(next: AnalyticsProvider) {
  provider = next;
}

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  try {
    provider.capture(event, properties);
  } catch {
    // Analytics must never crash the product.
  }
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  try {
    provider.identify(userId, traits);
  } catch {
    /* noop */
  }
}

export function resetAnalytics() {
  try {
    provider.reset();
  } catch {
    /* noop */
  }
}
