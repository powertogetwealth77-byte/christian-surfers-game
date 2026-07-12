import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { colors, motion, radius } from '@/theme/tokens';

export function ProgressBar({
  value,
  height = 8,
  color = colors.primary,
  trackColor = colors.surfaceHigh,
}: {
  /** 0–100 */
  value: number;
  height?: number;
  color?: string;
  trackColor?: string;
}) {
  const anim = useRef(new Animated.Value(value)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value, duration: motion.slow, useNativeDriver: false }).start();
  }, [value, anim]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value) }}
      style={{ height, borderRadius: radius.pill, backgroundColor: trackColor, overflow: 'hidden' }}
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: color,
          width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' }),
        }}
      />
    </View>
  );
}
