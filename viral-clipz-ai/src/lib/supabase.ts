import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isDemoMode } from '@/lib/env';

/**
 * Supabase client using the public anon key (RLS enforced server-side).
 * `null` in demo mode — callers must go through the auth store / services,
 * which handle the fallback.
 */
export const supabase: SupabaseClient | null = isDemoMode
  ? null
  : createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
