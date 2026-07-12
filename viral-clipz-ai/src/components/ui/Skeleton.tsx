import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, View, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme/tokens';

/** Pulsing skeleton block for loading states. Respects reduced motion. */
export function Skeleton({ width, height = 16, style }: { width?: number | `${number}%`; height?: number; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityLabel="Loading"
      style={[
        { width: width ?? '100%', height, borderRadius: radius.sm, backgroundColor: colors.surfaceHigh, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        gap: 12,
      }}
    >
      <Skeleton width="55%" height={18} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 2 ? '35%' : '85%'} height={12} />
      ))}
    </View>
  );
}
