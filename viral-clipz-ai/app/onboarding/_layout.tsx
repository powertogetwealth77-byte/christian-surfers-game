import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { track } from '@/lib/analytics';
import { colors } from '@/theme/tokens';

export default function OnboardingLayout() {
  useEffect(() => {
    track('onboarding_started');
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
