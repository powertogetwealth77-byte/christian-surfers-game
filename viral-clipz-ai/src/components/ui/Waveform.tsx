import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';

const BAR_COUNT = 24;

/** Animated audio waveform used on the processing screen. */
export function Waveform({ active = true, height = 56, color = colors.primary }: { active?: boolean; height?: number; color?: string }) {
  const bars = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))).current;

  useEffect(() => {
    let cancelled = false;
    const loops: Animated.CompositeAnimation[] = [];
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled || reduced || !active) return;
      bars.forEach((bar, i) => {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 0.35 + Math.abs(Math.sin(i * 1.3)) * 0.65,
              duration: 320 + (i % 5) * 90,
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: 0.15 + Math.abs(Math.cos(i * 0.7)) * 0.3,
              duration: 300 + (i % 4) * 110,
              useNativeDriver: false,
            }),
          ])
        );
        loops.push(loop);
        loop.start();
      });
    });
    return () => {
      cancelled = true;
      loops.forEach((l) => l.stop());
    };
  }, [active, bars]);

  return (
    <View
      accessibilityLabel="Audio processing animation"
      style={{ flexDirection: 'row', alignItems: 'center', height, gap: 3, justifyContent: 'center' }}
    >
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={{
            width: 4,
            borderRadius: radius.pill,
            backgroundColor: color,
            opacity: 0.5 + (i % 3) * 0.18,
            height: bar.interpolate({ inputRange: [0, 1], outputRange: [4, height] }),
          }}
        />
      ))}
    </View>
  );
}
