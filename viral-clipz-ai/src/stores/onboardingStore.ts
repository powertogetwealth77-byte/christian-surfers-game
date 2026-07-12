import { create } from 'zustand';
import type { ContentStyle, CreatorType, Platform, PrimaryGoal } from '@/types/entities';

interface OnboardingState {
  creatorType: CreatorType | null;
  primaryGoal: PrimaryGoal | null;
  platforms: Platform[];
  contentStyle: ContentStyle | null;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  captionStyle: string;
  defaultFont: string;
  defaultCta: string;

  set<K extends keyof OnboardingState>(key: K, value: OnboardingState[K]): void;
  togglePlatform(platform: Platform): void;
  reset(): void;
}

const initial = {
  creatorType: null,
  primaryGoal: null,
  platforms: [] as Platform[],
  contentStyle: null,
  brandName: '',
  primaryColor: '#FF5C38',
  secondaryColor: '#8B5CF6',
  captionStyle: 'bold_pop',
  defaultFont: 'Inter Black',
  defaultCta: 'Follow for more →',
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initial,
  set: (key, value) => set({ [key]: value } as Partial<OnboardingState>),
  togglePlatform: (platform) =>
    set((s) => ({
      platforms: s.platforms.includes(platform)
        ? s.platforms.filter((p) => p !== platform)
        : [...s.platforms, platform],
    })),
  reset: () => set(initial),
}));
