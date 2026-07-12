import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/feature/OnboardingStep';
import { OptionGrid } from '@/components/feature/OptionGrid';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { ContentStyle } from '@/types/entities';

const OPTIONS: { value: ContentStyle; label: string }[] = [
  { value: 'educational', label: 'Educational' },
  { value: 'motivational', label: 'Motivational' },
  { value: 'entertaining', label: 'Entertaining' },
  { value: 'story_driven', label: 'Story-driven' },
  { value: 'opinion_led', label: 'Controversial or opinion-led' },
  { value: 'faith_based', label: 'Faith-based' },
  { value: 'product_focused', label: 'Product-focused' },
  { value: 'podcast_highlights', label: 'Podcast highlights' },
];

export default function StyleScreen() {
  const router = useRouter();
  const contentStyle = useOnboardingStore((s) => s.contentStyle);
  const set = useOnboardingStore((s) => s.set);

  return (
    <OnboardingStep
      step={4}
      title="What’s your content style?"
      subtitle="Hooks that work for entertainment flop for education. We calibrate to your lane."
      nextDisabled={!contentStyle}
      onNext={() => router.push('/onboarding/brand')}
    >
      <OptionGrid options={OPTIONS} selected={contentStyle} onSelect={(v) => set('contentStyle', v)} />
    </OnboardingStep>
  );
}
