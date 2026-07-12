import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { CreateStep } from '@/components/feature/CreateStep';
import { Input } from '@/components/ui/Input';
import { useCreateFlowStore } from '@/stores/createFlowStore';
import { spacing } from '@/theme/tokens';

export default function AudienceStep() {
  const router = useRouter();
  const audience = useCreateFlowStore((s) => s.audience);
  const setAudience = useCreateFlowStore((s) => s.setAudience);

  return (
    <CreateStep
      step={3}
      title="Who is this for?"
      subtitle="Optional, but the more specific you are, the sharper the clip selection and copy."
      onNext={() => router.push('/create/config')}
    >
      <View style={{ gap: spacing.lg }}>
        <Input
          label="Target audience"
          placeholder="e.g. Early-stage founders and solo consultants"
          value={audience.targetAudience}
          onChangeText={(v) => setAudience({ targetAudience: v })}
        />
        <Input
          label="Their pain point"
          placeholder="e.g. Undercharging out of fear of losing clients"
          value={audience.painPoint}
          onChangeText={(v) => setAudience({ painPoint: v })}
        />
        <Input
          label="Desired transformation"
          placeholder="e.g. Raising prices confidently"
          value={audience.transformation}
          onChangeText={(v) => setAudience({ transformation: v })}
        />
        <Input
          label="Preferred tone"
          placeholder="e.g. Direct, expert, a little contrarian"
          value={audience.tone}
          onChangeText={(v) => setAudience({ tone: v })}
        />
        <Input
          label="Topics to prioritize"
          placeholder="Comma-separated, e.g. pricing, negotiation"
          value={audience.prioritizeTopics}
          onChangeText={(v) => setAudience({ prioritizeTopics: v })}
        />
        <Input
          label="Topics to avoid"
          placeholder="Comma-separated, e.g. politics"
          value={audience.avoidTopics}
          onChangeText={(v) => setAudience({ avoidTopics: v })}
        />
      </View>
    </CreateStep>
  );
}
