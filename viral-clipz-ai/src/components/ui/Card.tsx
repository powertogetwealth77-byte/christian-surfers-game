import { View, type ViewProps, type ViewStyle } from 'react-native';
import { ScalePressable } from '@/components/ui/Pressable';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
  elevated?: boolean;
  style?: ViewStyle | ViewStyle[];
}

const baseStyle: ViewStyle = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
};

export function Card({ onPress, padded = true, elevated, style, children, ...rest }: CardProps) {
  const combined: ViewStyle[] = [
    baseStyle,
    padded ? { padding: spacing.lg } : {},
    elevated ? (shadows.card as ViewStyle) : {},
    ...(Array.isArray(style) ? style : style ? [style] : []),
  ];

  if (onPress) {
    return (
      <ScalePressable onPress={onPress} pressScale={0.98} containerStyle={combined} {...(rest as object)}>
        {children}
      </ScalePressable>
    );
  }
  return (
    <View style={combined} {...rest}>
      {children}
    </View>
  );
}
