import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, radius, spacing } from '@/theme/tokens';

export function StatTile({
  label,
  value,
  sub,
  flex = 1,
}: {
  label: string;
  value: string;
  sub?: string;
  flex?: number;
}) {
  return (
    <View
      style={{
        flex,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        gap: spacing.xxs,
      }}
      accessibilityLabel={`${label}: ${value}${sub ? `, ${sub}` : ''}`}
    >
      <AppText variant="h2">{value}</AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      {sub ? (
        <AppText variant="micro" tone="success">
          {sub}
        </AppText>
      ) : null}
    </View>
  );
}
