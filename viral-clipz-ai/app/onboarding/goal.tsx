import { useRouter } from 'expo-router';
import { OnboardingStep } from '@/components/feature/OnboardingStep';
import { OptionGrid } from '@/components/feature/OptionGrid';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { PrimaryGoal } from '@/types/entities';

const OPTIONS: { value: PrimaryGoal; label: string }[] = [
  { value: 'grow_followers', label: 'Grow followers' },
  { value: 'generate_leads', label: 'Generate leads' },
  { value: 'sell_product', label: 'Sell a product' },
  { value: 'promote_service', label: 'Promote a service' },
  { value: 'build_authority', label: 'Build authority' },
  { value: 'increase_engagement', label: 'Increase engagement' },
  { value: 'repurpose_faster', label: 'Repurpose content faster' },
];

export default function GoalScreen() {
  const router = useRouter();
  const primaryGoal = useOnboardingStore((s) => s.primaryGoal);
  const set = useOnboardingStore((s) => s.set);

  return (
    <OnboardingStep
      step={2}
      title="What should clips do for you?"
      subtitle="Your goal drives how we rank moments — reach plays differently than lead-gen."
      nextDisabled={!primaryGoal}
      onNext={() => router.push('/onboarding/platforms')}
    >
      <OptionGrid options={OPTIONS} selected={primaryGoal} onSelect={(v) => set('primaryGoal', v)} />
    </OnboardingStep>
  );
}
