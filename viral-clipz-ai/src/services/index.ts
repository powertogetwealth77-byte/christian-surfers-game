import { demoBackend } from '@/services/demoBackend';
import type { Backend } from '@/services/backend';

/**
 * Active backend implementation.
 *
 * Auth is real whenever Supabase credentials exist (see stores/authStore).
 * Data services intentionally remain on the demo implementation until the
 * production Supabase schema + edge functions ship (Prompt 2): we do not
 * fake a working backend. Swap `demoBackend` for `supabaseBackend` here
 * once it exists — no screen code changes required.
 */
export const backend: Backend = demoBackend;

export type { AnalyticsSummary, Backend, CreateProjectInput, UsageSummary } from '@/services/backend';
