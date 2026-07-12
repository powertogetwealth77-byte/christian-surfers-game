import { useRef } from 'react';
import {
  AccessibilityState,
  Animated,
  Pressable as RNPressable,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { motion } from '@/theme/tokens';

export interface ScalePressableProps extends PressableProps {
  /** Scale factor when pressed */
  pressScale?: number;
  haptic?: boolean;
  containerStyle?: ViewStyle | ViewStyle[];
}

/**
 * Pressable with subtle scale press feedback + optional haptics.
 * Base interaction primitive for buttons and cards.
 */
export function ScalePressable({
  pressScale = 0.97,
  haptic = false,
  containerStyle,
  onPressIn,
  onPressOut,
  onPress,
  disabled,
  ...rest
}: ScalePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const a11yState: AccessibilityState | undefined = disabled ? { disabled: true } : undefined;

  // Layout-affecting props must live on the outer Pressable so flex rows
  // distribute correctly (especially on web); the inner Animated.View keeps
  // the full style for visuals and fills the wrapper.
  const flat = StyleSheet.flatten(containerStyle) ?? {};
  const outerLayout: ViewStyle = {};
  for (const key of ['flex', 'alignSelf', 'width', 'minWidth', 'maxWidth', 'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical'] as const) {
    if (flat[key] !== undefined) (outerLayout as Record<string, unknown>)[key] = flat[key];
  }

  return (
    <RNPressable
      accessibilityRole="button"
      accessibilityState={a11yState}
      disabled={disabled}
      style={outerLayout}
      onPressIn={(e) => {
        Animated.timing(scale, { toValue: pressScale, duration: motion.fast, useNativeDriver: true }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.timing(scale, { toValue: 1, duration: motion.fast, useNativeDriver: true }).start();
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic && Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.(e);
      }}
      {...rest}
    >
      {(state) => (
        <Animated.View style={[containerStyle, { transform: [{ scale }] }, disabled ? { opacity: 0.5 } : null]}>
          {typeof rest.children === 'function' ? (rest.children as any)(state) : rest.children}
        </Animated.View>
      )}
    </RNPressable>
  );
}
