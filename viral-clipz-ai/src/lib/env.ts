/**
 * Client-safe environment configuration.
 * Only EXPO_PUBLIC_* variables are ever read — privileged keys
 * (service-role, RevenueCat secret, etc.) must never reach the client.
 */

export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  posthogKey: process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '',
  posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
};

/**
 * Demo Mode: when Supabase credentials are absent the app runs fully against
 * clearly-labeled local sample data. Nothing in demo mode pretends to touch
 * production.
 */
export const isDemoMode = !env.supabaseUrl || !env.supabaseAnonKey;
