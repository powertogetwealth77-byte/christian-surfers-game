import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function scoreColor(score: number): string {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.warning;
  return colors.danger;
}

/** Animated circular score indicator (0–100). */
export function ScoreRing({
  score,
  size = 56,
  strokeWidth = 5,
  label,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    progress.setValue(0);
    const id = progress.addListener(({ value }) => setDisplay(Math.round(value * score)));
    Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => progress.removeListener(id);
  }, [score, progress]);

  const color = scoreColor(score);

  return (
    <View
      style={{ width: size + 10, alignItems: 'center' }}
      accessibilityLabel={`${label ?? 'Score'}: ${score} out of 100`}
    >
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={colors.surfaceHigh}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={progress.interpolate({
              inputRange: [0, 1],
              outputRange: [circumference, circumference * (1 - score / 100)],
            })}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant={size >= 56 ? 'bodyBold' : 'captionBold'} style={{ color }}>
            {display}
          </AppText>
        </View>
      </View>
      {label ? (
        <AppText variant="micro" tone="muted" center style={{ marginTop: 4 }} numberOfLines={1}>
          {label.toUpperCase()}
        </AppText>
      ) : null}
    </View>
  );
}
