import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { FadeInView } from '@/components/feature/FadeInView';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScalePressable } from '@/components/ui/Pressable';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing } from '@/theme/tokens';

export const ONBOARDING_TOTAL_STEPS = 6;

export function OnboardingStep({
  step,
  title,
  subtitle,
  children,
  nextDisabled,
  nextLabel = 'Continue',
  onNext,
  hideBack,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  nextDisabled?: boolean;
  nextLabel?: string;
  onNext: () => void;
  hideBack?: boolean;
}) {
  const router = useRouter();
  return (
    <Screen keyboard>
      <View style={{ flex: 1, gap: spacing.xl, paddingTop: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          {!hideBack ? (
            <ScalePressable onPress={() => router.back()} accessibilityLabel="Go back" containerStyle={{ padding: spacing.xs }}>
              <ArrowLeft size={22} color={colors.text} />
            </ScalePressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <ProgressBar value={(step / ONBOARDING_TOTAL_STEPS) * 100} height={6} />
          </View>
          <AppText variant="captionBold" tone="muted">
            {step}/{ONBOARDING_TOTAL_STEPS}
          </AppText>
        </View>

        <FadeInView>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="h1">{title}</AppText>
            {subtitle ? (
              <AppText variant="body" tone="secondary">
                {subtitle}
              </AppText>
            ) : null}
          </View>
        </FadeInView>

        <FadeInView index={1} style={{ flex: 1 }}>
          {children}
        </FadeInView>

        <Button label={nextLabel} size="lg" fullWidth disabled={nextDisabled} onPress={onNext} />
      </View>
    </Screen>
  );
}
