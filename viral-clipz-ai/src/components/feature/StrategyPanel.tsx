import { useState } from 'react';
import { LayoutAnimation, Platform, UIManager, View } from 'react-native';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ScalePressable } from '@/components/ui/Pressable';
import { platformLabel } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';
import type { ClipStrategy } from '@/types/entities';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Expandable "Why This Could Work" AI strategy panel. */
export function StrategyPanel({ strategy, initiallyOpen = false }: { strategy: ClipStrategy; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);

  const rows: { label: string; value: string }[] = [
    { label: 'Hook analysis', value: strategy.hookAnalysis },
    { label: 'Audience relevance', value: strategy.audienceRelevance },
    { label: 'Emotional trigger', value: strategy.emotionalTrigger },
    { label: 'Curiosity mechanism', value: strategy.curiosityMechanism },
    { label: 'Retention risk', value: strategy.retentionRisk },
    { label: 'Best platform', value: platformLabel(strategy.bestPlatform) },
    { label: 'Posting angle', value: strategy.postingAngle },
    { label: 'Suggested CTA', value: strategy.suggestedCta },
    { label: 'Make it stronger', value: strategy.improvement },
  ];

  return (
    <Card padded={false}>
      <ScalePressable
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen((o) => !o);
        }}
        accessibilityLabel={open ? 'Collapse strategy panel' : 'Expand strategy panel'}
        accessibilityState={{ expanded: open }}
        containerStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.lg,
        }}
      >
        <Brain size={20} color={colors.accent} />
        <AppText variant="bodyBold" style={{ flex: 1 }}>
          Why this could work
        </AppText>
        {open ? (
          <ChevronUp size={20} color={colors.textMuted} />
        ) : (
          <ChevronDown size={20} color={colors.textMuted} />
        )}
      </ScalePressable>

      {open ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg }}>
          {rows.map((row) => (
            <View key={row.label} style={{ gap: spacing.xxs }}>
              <AppText variant="overline" tone="accent">
                {row.label}
              </AppText>
              <AppText variant="body" tone="secondary">
                {row.value}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
