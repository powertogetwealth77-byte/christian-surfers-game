import { Switch, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, minTouchTarget, spacing } from '@/theme/tokens';

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: minTouchTarget,
        gap: spacing.lg,
        paddingVertical: spacing.sm,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold">{label}</AppText>
        {hint ? (
          <AppText variant="caption" tone="muted">
            {hint}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.surfaceHigh, true: colors.primary }}
        thumbColor={colors.text}
      />
    </View>
  );
}
