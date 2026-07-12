import { View, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, radius, spacing } from '@/theme/tokens';

type BadgeTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  primary: { bg: colors.primarySoft, fg: colors.primary },
  accent: { bg: colors.accentSoft, fg: colors.accent },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  neutral: { bg: colors.surfaceHigh, fg: colors.textSecondary },
};

export function Badge({ label, tone = 'neutral', style }: { label: string; tone?: BadgeTone; style?: ViewStyle }) {
  const t = tones[tone];
  return (
    <View
      style={[
        {
          backgroundColor: t.bg,
          borderRadius: radius.pill,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <AppText variant="micro" style={{ color: t.fg }}>
        {label.toUpperCase()}
      </AppText>
    </View>
  );
}
