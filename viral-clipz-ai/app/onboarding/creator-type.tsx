import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/feature/OnboardingStep';
import { OptionGrid } from '@/components/feature/OptionGrid';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { CreatorType } from '@/types/entities';

const OPTIONS: { value: CreatorType; label: string; description?: string }[] = [
  { value: 'content_creator', label: 'Content creator', description: 'You publish to grow an audience' },
  { value: 'podcaster', label: 'Podcaster', description: 'Long episodes with clip-worthy moments' },
  { value: 'coach', label: 'Coach or consultant', description: 'Clips that build trust and book calls' },
  { value: 'business', label: 'Business', description: 'Product and brand storytelling' },
  { value: 'agency', label: 'Agency', description: 'You produce for multiple clients' },
  { value: 'ministry', label: 'Ministry or nonprofit', description: 'Sermons, talks, and mission stories' },
  { value: 'educator', label: 'Educator', description: 'Lessons and lectures worth sharing' },
  { value: 'other', label: 'Other' },
];

export default function CreatorTypeScreen() {
  const router = useRouter();
  const creatorType = useOnboardingStore((s) => s.creatorType);
  const set = useOnboardingStore((s) => s.set);

  return (
    <OnboardingStep
      step={1}
      hideBack
      title="What kind of creator are you?"
      subtitle="We tune moment detection and copy to how you publish."
      nextDisabled={!creatorType}
      onNext={() => router.push('/onboarding/goal')}
    >
      <OptionGrid options={OPTIONS} selected={creatorType} onSelect={(v) => set('creatorType', v)} />
    </OnboardingStep>
  );
}
