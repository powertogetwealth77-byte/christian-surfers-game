import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/feature/OnboardingStep';
import { OptionGrid } from '@/components/feature/OptionGrid';
import { PLATFORM_LABELS } from '@/lib/format';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { Platform } from '@/types/entities';

const OPTIONS = (Object.keys(PLATFORM_LABELS) as Platform[]).map((value) => ({
  value,
  label: PLATFORM_LABELS[value],
}));

export default function PlatformsScreen() {
  const router = useRouter();
  const platforms = useOnboardingStore((s) => s.platforms);
  const toggle = useOnboardingStore((s) => s.togglePlatform);

  return (
    <OnboardingStep
      step={3}
      title="Where do you publish?"
      subtitle="Pick every platform you use — aspect ratios, captions, and hashtags adapt per platform."
      nextDisabled={platforms.length === 0}
      onNext={() => router.push('/onboarding/style')}
    >
      <OptionGrid multi options={OPTIONS} selected={platforms} onSelect={toggle} />
    </OnboardingStep>
  );
}
