import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { identify, resetAnalytics, track } from '@/lib/analytics';
import { isDemoMode } from '@/lib/env';
import { reportError, toMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { demoProfile } from '@/data/demo';
import type { ContentStyle, CreatorType, Platform, PrimaryGoal, Profile } from '@/types/entities';

const DEMO_SESSION_KEY = 'vc.demo.session';
const ONBOARDING_KEY = 'vc.onboarding.done';

export type AuthStatus = 'initializing' | 'signedOut' | 'signedIn';

export interface OnboardingAnswers {
  creatorType: CreatorType;
  primaryGoal: PrimaryGoal;
  platforms: Platform[];
  contentStyle: ContentStyle;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  captionStyle: string;
  defaultFont: string;
  defaultCta: string;
}

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  isDemo: boolean;
  needsOnboarding: boolean;
  error: string | null;

  initialize(): Promise<void>;
  signInWithPassword(email: string, password: string): Promise<{ ok: boolean; error?: string }>;
  signUpWithPassword(email: string, password: string, fullName: string): Promise<{ ok: boolean; error?: string }>;
  sendMagicLink(email: string): Promise<{ ok: boolean; error?: string }>;
  sendPasswordReset(email: string): Promise<{ ok: boolean; error?: string }>;
  enterDemo(): Promise<void>;
  completeOnboarding(answers: OnboardingAnswers): Promise<void>;
  signOut(): Promise<void>;
}

function profileFromSession(session: Session): Profile {
  const meta = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    fullName: (meta.full_name as string) ?? null,
    avatarUrl: (meta.avatar_url as string) ?? null,
    creatorType: null,
    primaryGoal: null,
    platforms: [],
    contentStyle: null,
    onboardingCompletedAt: null,
    createdAt: session.user.created_at,
    updatedAt: session.user.created_at,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'initializing',
  session: null,
  profile: null,
  isDemo: false,
  needsOnboarding: false,
  error: null,

  async initialize() {
    try {
      if (isDemoMode) {
        const demoActive = await AsyncStorage.getItem(DEMO_SESSION_KEY);
        if (demoActive === '1') {
          const onboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
          set({
            status: 'signedIn',
            isDemo: true,
            profile: demoProfile,
            needsOnboarding: onboarded !== '1',
          });
        } else {
          set({ status: 'signedOut' });
        }
        return;
      }

      const { data } = await supabase!.auth.getSession();
      if (data.session) {
        const onboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
        set({
          status: 'signedIn',
          session: data.session,
          profile: profileFromSession(data.session),
          needsOnboarding: onboarded !== '1',
        });
        identify(data.session.user.id);
      } else {
        set({ status: 'signedOut' });
      }

      supabase!.auth.onAuthStateChange((_event, session) => {
        if (session) {
          set({ status: 'signedIn', session, profile: profileFromSession(session) });
        } else {
          set({ status: 'signedOut', session: null, profile: null });
        }
      });
    } catch (e) {
      reportError(e, { scope: 'auth.initialize' });
      set({ status: 'signedOut', error: toMessage(e) });
    }
  },

  async signInWithPassword(email, password) {
    if (isDemoMode) {
      await get().enterDemo();
      return { ok: true };
    }
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  async signUpWithPassword(email, password, fullName) {
    if (isDemoMode) {
      await get().enterDemo();
      track('account_created', { mode: 'demo' });
      return { ok: true };
    }
    const { error } = await supabase!.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { ok: false, error: error.message };
    track('account_created', { method: 'password' });
    return { ok: true };
  },

  async sendMagicLink(email) {
    if (isDemoMode) {
      return { ok: false, error: 'Magic links need Supabase configured. Use “Explore in Demo Mode” instead.' };
    }
    const { error } = await supabase!.auth.signInWithOtp({ email });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  async sendPasswordReset(email) {
    if (isDemoMode) {
      return { ok: false, error: 'Password reset needs Supabase configured. Use “Explore in Demo Mode” instead.' };
    }
    const { error } = await supabase!.auth.resetPasswordForEmail(email);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  },

  async enterDemo() {
    await AsyncStorage.setItem(DEMO_SESSION_KEY, '1');
    const onboarded = await AsyncStorage.getItem(ONBOARDING_KEY);
    set({
      status: 'signedIn',
      isDemo: true,
      profile: demoProfile,
      needsOnboarding: onboarded !== '1',
      error: null,
    });
  },

  async completeOnboarding(answers) {
    const { profile, isDemo } = get();
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    const updated: Profile | null = profile
      ? {
          ...profile,
          creatorType: answers.creatorType,
          primaryGoal: answers.primaryGoal,
          platforms: answers.platforms,
          contentStyle: answers.contentStyle,
          onboardingCompletedAt: new Date().toISOString(),
        }
      : null;
    set({ needsOnboarding: false, profile: updated });
    track('onboarding_completed', { creatorType: answers.creatorType, goal: answers.primaryGoal });

    if (!isDemo && supabase) {
      // Integration point (Prompt 2): persist to the `profiles` table.
      // RLS must scope writes to auth.uid() — never trust a client-sent id.
      try {
        await supabase.from('profiles').upsert({
          id: profile?.id,
          creator_type: answers.creatorType,
          primary_goal: answers.primaryGoal,
          platforms: answers.platforms,
          content_style: answers.contentStyle,
          onboarding_completed_at: new Date().toISOString(),
        });
      } catch (e) {
        reportError(e, { scope: 'onboarding.persist' });
      }
    }
  },

  async signOut() {
    try {
      if (!get().isDemo && supabase) await supabase.auth.signOut();
      await AsyncStorage.multiRemove([DEMO_SESSION_KEY, ONBOARDING_KEY]);
      resetAnalytics();
      set({ status: 'signedOut', session: null, profile: null, isDemo: false, needsOnboarding: false });
    } catch (e) {
      reportError(e, { scope: 'auth.signOut' });
      set({ status: 'signedOut', session: null, profile: null, isDemo: false });
    }
  },
}));
