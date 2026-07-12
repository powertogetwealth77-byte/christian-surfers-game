import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Minus, X } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScalePressable } from '@/components/ui/Pressable';
import { PLANS, PLAN_ORDER } from '@/config/plans';
import { track } from '@/lib/analytics';
import { isDemoMode } from '@/lib/env';
import { backend } from '@/services';
import { colors, spacing } from '@/theme/tokens';
import type { PlanId } from '@/types/entities';

/**
 * Subscription paywall.
 * RevenueCat-ready: plan data lives in config/plans.ts with entitlement IDs;
 * `startCheckout` is the single seam where RC purchase flow plugs in.
 */
export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const usageQuery = useQuery({ queryKey: ['usage'], queryFn: () => backend.getUsage() });
  const currentPlanId = usageQuery.data?.planId ?? 'free';
  const [pending, setPending] = useState<PlanId | null>(null);

  useEffect(() => {
    track('upgrade_viewed');
  }, []);

  const startCheckout = (planId: PlanId) => {
    track('checkout_started', { planId });
    setPending(planId);
    // Integration point: RevenueCat Purchases.purchasePackage(...) — the
    // entitlement id is PLANS[planId].revenueCatEntitlement. In demo mode we
    // do not simulate a successful purchase.
    setTimeout(() => setPending(null), 800);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing.x4l,
        maxWidth: 640,
        width: '100%',
        alignSelf: 'center',
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="h1">Plans</AppText>
        <ScalePressable onPress={() => router.back()} accessibilityLabel="Close plans" containerStyle={{ padding: spacing.sm }}>
          <X size={22} color={colors.textMuted} />
        </ScalePressable>
      </View>
      <AppText variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
        Pick the plan that matches your publishing pace. Cancel anytime.
      </AppText>
      {isDemoMode ? (
        <AppText variant="caption" tone="accent" style={{ marginTop: spacing.sm }}>
          Demo mode: checkout is disabled — purchases activate once RevenueCat is configured.
        </AppText>
      ) : null}

      <View style={{ gap: spacing.lg, marginTop: spacing.xl }}>
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = planId === currentPlanId;
          return (
            <Card
              key={plan.id}
              style={{
                borderColor: plan.highlight ? colors.primaryBorder : colors.border,
                borderWidth: plan.highlight ? 1.5 : 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <AppText variant="h2">{plan.name}</AppText>
                    {plan.highlight ? <Badge label="Most popular" tone="primary" /> : null}
                    {isCurrent ? <Badge label="Current" tone="success" /> : null}
                  </View>
                  <AppText variant="caption" tone="muted">
                    {plan.tagline}
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText variant="h2" tone={plan.highlight ? 'primary' : 'default'}>
                    ${plan.priceMonthlyUsd}
                  </AppText>
                  <AppText variant="micro" tone="muted">
                    / MONTH
                  </AppText>
                </View>
              </View>

              <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
                {plan.features.map((f) => (
                  <View key={f.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    {f.included ? (
                      <Check size={16} color={colors.success} />
                    ) : (
                      <Minus size={16} color={colors.textDisabled} />
                    )}
                    <AppText variant="body" tone={f.included ? 'secondary' : 'muted'}>
                      {f.label}
                    </AppText>
                  </View>
                ))}
              </View>

              {!isCurrent ? (
                <Button
                  label={plan.priceMonthlyUsd === 0 ? 'Downgrade to Free' : `Get ${plan.name}`}
                  variant={plan.highlight ? 'primary' : 'secondary'}
                  fullWidth
                  loading={pending === plan.id}
                  style={{ marginTop: spacing.lg }}
                  onPress={() => startCheckout(plan.id)}
                />
              ) : null}
            </Card>
          );
        })}
      </View>

      <AppText variant="caption" tone="muted" center style={{ marginTop: spacing.xl }}>
        Prices in USD. Subscriptions are billed through the app store and managed in your store account settings.
      </AppText>
    </ScrollView>
  );
}
