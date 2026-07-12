import React from 'react';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { ScalePressable } from '@/components/ui/Pressable';
import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';

export interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

/**
 * Selectable option list used across onboarding and the create flow.
 * Supports single- and multi-select.
 */
export function OptionGrid<T extends string>({
  options,
  selected,
  onSelect,
  multi = false,
}: {
  options: Option<T>[];
  selected: T[] | T | null;
  onSelect: (value: T) => void;
  multi?: boolean;
}) {
  const selectedSet = new Set(Array.isArray(selected) ? selected : selected ? [selected] : []);
  return (
    <View style={{ gap: spacing.md }}>
      {options.map((opt) => {
        const isSelected = selectedSet.has(opt.value);
        return (
          <ScalePressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            haptic
            accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={{ selected: isSelected, checked: isSelected }}
            accessibilityLabel={opt.label}
            containerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              minHeight: minTouchTarget + 8,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: isSelected ? colors.primaryBorder : colors.border,
              backgroundColor: isSelected ? colors.primarySoft : colors.surface,
            }}
          >
            {opt.icon ? <View>{opt.icon}</View> : null}
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" style={isSelected ? { color: colors.primary } : undefined}>
                {opt.label}
              </AppText>
              {opt.description ? (
                <AppText variant="caption" tone="muted">
                  {opt.description}
                </AppText>
              ) : null}
            </View>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: multi ? 6 : 11,
                borderWidth: 2,
                borderColor: isSelected ? colors.primary : colors.borderStrong,
                backgroundColor: isSelected ? colors.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isSelected ? <Check size={14} color={colors.onPrimary} strokeWidth={3} /> : null}
            </View>
          </ScalePressable>
        );
      })}
    </View>
  );
}
