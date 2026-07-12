import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ScalePressable } from '@/components/ui/Pressable';
import { Screen } from '@/components/ui/Screen';
import { useCreateFlowStore } from '@/stores/createFlowStore';
import { colors, spacing } from '@/theme/tokens';

export const CREATE_TOTAL_STEPS = 5;

export function CreateStep({
  step,
  title,
  subtitle,
  children,
  nextDisabled,
  nextLabel = 'Continue',
  nextLoading,
  onNext,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  nextDisabled?: boolean;
  nextLabel?: string;
  nextLoading?: boolean;
  onNext: () => void;
}) {
  const router = useRouter();
  const reset = useCreateFlowStore((s) => s.reset);

  const close = () => {
    reset();
    router.dismissTo('/(tabs)');
  };

  return (
    <Screen keyboard>
      <View style={{ flex: 1, gap: spacing.xl, paddingTop: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          {step > 1 ? (
            <ScalePressable onPress={() => router.back()} accessibilityLabel="Previous step" containerStyle={{ padding: spacing.xs }}>
              <ArrowLeft size={22} color={colors.text} />
            </ScalePressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <ProgressBar value={(step / CREATE_TOTAL_STEPS) * 100} height={6} />
          </View>
          <AppText variant="captionBold" tone="muted">
            {step}/{CREATE_TOTAL_STEPS}
          </AppText>
          <ScalePressable onPress={close} accessibilityLabel="Close create flow" containerStyle={{ padding: spacing.xs }}>
            <X size={22} color={colors.textMuted} />
          </ScalePressable>
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppText variant="h1">{title}</AppText>
          {subtitle ? (
            <AppText variant="body" tone="secondary">
              {subtitle}
            </AppText>
          ) : null}
        </View>

        <View style={{ flex: 1 }}>{children}</View>

        <Button label={nextLabel} size="lg" fullWidth disabled={nextDisabled} loading={nextLoading} onPress={onNext} />
      </View>
    </Screen>
  );
}
