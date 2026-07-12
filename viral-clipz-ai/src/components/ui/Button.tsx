import React from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/AppText';
import { ScalePressable } from '@/components/ui/Pressable';
import { colors, gradients, minTouchTarget, radius, shadows, spacing } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  accessibilityHint?: string;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
  iconRight,
  fullWidth,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const height = size === 'lg' ? 54 : size === 'md' ? minTouchTarget + 2 : 38;
  const isDisabled = disabled || loading;

  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.onPrimary : colors.primary} />
      ) : (
        <>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <AppText
            variant={size === 'sm' ? 'captionBold' : 'bodyBold'}
            style={{ color: textColor(variant) }}
            numberOfLines={1}
          >
            {label}
          </AppText>
          {iconRight ? <View style={styles.icon}>{iconRight}</View> : null}
        </>
      )}
    </View>
  );

  const base: ViewStyle = {
    height,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: size === 'sm' ? spacing.md : spacing.xl,
    ...(fullWidth ? { alignSelf: 'stretch' as const } : null),
  };

  if (variant === 'primary') {
    return (
      <ScalePressable
        onPress={onPress}
        disabled={isDisabled}
        haptic
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        testID={testID}
        containerStyle={[fullWidth ? { alignSelf: 'stretch' } : {}, style ?? {}]}
      >
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[base, !isDisabled ? shadows.glowPrimary : null]}
        >
          {content}
        </LinearGradient>
      </ScalePressable>
    );
  }

  const bg: Record<Exclude<Variant, 'primary'>, ViewStyle> = {
    secondary: { backgroundColor: colors.surfaceHigh },
    ghost: { backgroundColor: 'transparent' },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderStrong },
    danger: { backgroundColor: colors.danger },
  };

  return (
    <ScalePressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      testID={testID}
      containerStyle={[fullWidth ? { alignSelf: 'stretch' } : {}, style ?? {}]}
    >
      <View style={[base, bg[variant]]}>{content}</View>
    </ScalePressable>
  );
}

function textColor(variant: Variant): string {
  switch (variant) {
    case 'primary':
    case 'danger':
      return colors.onPrimary;
    case 'ghost':
      return colors.textSecondary;
    default:
      return colors.text;
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  icon: { alignItems: 'center', justifyContent: 'center' },
});
