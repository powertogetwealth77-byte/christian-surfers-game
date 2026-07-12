import { useRouter } from 'expo-router';
import { CreateStep } from '@/components/feature/CreateStep';
import { OptionGrid } from '@/components/feature/OptionGrid';
import { useCreateFlowStore } from '@/stores/createFlowStore';
import type { ClipObjective } from '@/types/entities';

const OPTIONS: { value: ClipObjective; label: string; description: string }[] = [
  { value: 'maximize_reach', label: 'Maximize reach', description: 'Optimize for hooks and shareability' },
  { value: 'generate_leads', label: 'Generate leads', description: 'Favor CTA-ready teaching moments' },
  { value: 'sell_offer', label: 'Sell an offer', description: 'Surface proof, objections, and pitches' },
  { value: 'build_authority', label: 'Build authority', description: 'Prioritize contrarian expert takes' },
  { value: 'drive_comments', label: 'Drive comments', description: 'Pick debate-worthy moments' },
  { value: 'promote_event', label: 'Promote an event', description: 'Urgency and event-relevant moments' },
  { value: 'teach_idea', label: 'Teach a key idea', description: 'Clear, self-contained explanations' },
  { value: 'inspire', label: 'Inspire or motivate', description: 'Emotional peaks and story arcs' },
  { value: 'podcast_highlights', label: 'Podcast highlights', description: 'Best exchanges and reactions' },
];

export default function OutcomeStep() {
  const router = useRouter();
  const objective = useCreateFlowStore((s) => s.objective);
  const setObjective = useCreateFlowStore((s) => s.setObjective);

  return (
    <CreateStep
      step={2}
      title="What should these clips accomplish?"
      subtitle="The objective changes which moments we pick and how we score them."
      nextDisabled={!objective}
      onNext={() => router.push('/create/audience')}
    >
      <OptionGrid options={OPTIONS} selected={objective} onSelect={setObjective} />
    </CreateStep>
  );
}
