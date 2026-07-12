import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PLANS } from '@/config/plans';
import { colors, spacing } from '@/theme/tokens';
import type { UsageSummary } from '@/services/backend';

export function UsageMeter({ usage, onPress }: { usage: UsageSummary; onPress?: () => void }) {
  const pct = Math.min(100, Math.round((usage.minutesUsed / usage.minutesIncluded) * 100));
  const nearLimit = pct >= 80;
  const plan = PLANS[usage.planId];
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
        <AppText variant="captionBold" tone="secondary">
          {plan.name} plan
        </AppText>
        <AppText variant="captionBold" tone={nearLimit ? 'warning' : 'secondary'}>
          {usage.minutesIncluded - usage.minutesUsed} min left
        </AppText>
      </View>
      <ProgressBar value={pct} color={nearLimit ? colors.warning : colors.primary} />
      <AppText variant="micro" tone="muted" style={{ marginTop: spacing.sm }}>
        {usage.minutesUsed} OF {usage.minutesIncluded} PROCESSING MINUTES USED THIS CYCLE
      </AppText>
    </Card>
  );
}
