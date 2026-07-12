import React from 'react';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { ScalePressable } from '@/components/ui/Pressable';
import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
}

/** Selectable pill used for filters and multi-select option grids. */
export function Chip({ label, selected, onPress, icon }: ChipProps) {
  return (
    <ScalePressable
      onPress={onPress}
      haptic
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      containerStyle={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs + 2,
        minHeight: minTouchTarget - 6,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors.primaryBorder : colors.border,
        backgroundColor: selected ? colors.primarySoft : colors.surfaceHigh,
      }}
    >
      {selected ? <Check size={14} color={colors.primary} /> : null}
      {icon ? <View>{icon}</View> : null}
      <AppText variant="captionBold" style={{ color: selected ? colors.primary : colors.textSecondary }}>
        {label}
      </AppText>
    </ScalePressable>
  );
}
