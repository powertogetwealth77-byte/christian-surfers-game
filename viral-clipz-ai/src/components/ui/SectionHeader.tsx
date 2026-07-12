import { View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { ScalePressable } from '@/components/ui/Pressable';
import { colors, spacing } from '@/theme/tokens';

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.xxl,
        marginBottom: spacing.md,
      }}
    >
      <AppText variant="h3">{title}</AppText>
      {actionLabel && onAction ? (
        <ScalePressable
          onPress={onAction}
          accessibilityLabel={actionLabel}
          containerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 2, padding: spacing.xs }}
        >
          <AppText variant="captionBold" tone="primary">
            {actionLabel}
          </AppText>
          <ChevronRight size={16} color={colors.primary} />
        </ScalePressable>
      ) : null}
    </View>
  );
}
