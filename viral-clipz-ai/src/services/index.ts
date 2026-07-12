import { isDemoMode } from '@/lib/env';
import { demoBackend } from '@/services/demoBackend';
import { supabaseBackend } from '@/services/supabaseBackend';
import type { Backend } from '@/services/backend';

/**
 * One explicit backend seam for the entire application.
 *
 * - Missing Supabase public configuration => clearly labelled Demo Mode.
 * - Valid Supabase public configuration => production adapter with RLS.
 *
 * Production never silently falls back after initialization: failures from the
 * Supabase adapter are surfaced to the existing loading/error/retry states.
 */
export const backend: Backend = isDemoMode ? demoBackend : supabaseBackend;

export type { AnalyticsSummary, Backend, CreateProjectInput, UsageSummary } from '@/services/backend';
