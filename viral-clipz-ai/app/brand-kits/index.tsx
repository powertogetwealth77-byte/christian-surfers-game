import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScalePressable } from '@/components/ui/Pressable';
import { Screen } from '@/components/ui/Screen';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState, RestrictedState } from '@/components/ui/States';
import { PLANS } from '@/config/plans';
import { backend } from '@/services';
import { colors, spacing } from '@/theme/tokens';

export default function BrandKitsScreen() {
  const router = useRouter();
  const kitsQuery = useQuery({ queryKey: ['brandKits'], queryFn: () => backend.listBrandKits() });
  const usageQuery = useQuery({ queryKey: ['usage'], queryFn: () => backend.getUsage() });

  const kits = kitsQuery.data ?? [];
  const plan = usageQuery.data ? PLANS[usageQuery.data.planId] : null;
  const atLimit = plan ? kits.length >= plan.maxBrandKits : false;

  return (
    <Screen>
      <View style={{ gap: spacing.lg, paddingTop: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <ScalePressable onPress={() => router.back()} accessibilityLabel="Go back" containerStyle={{ padding: spacing.xs }}>
            <ArrowLeft size={22} color={colors.text} />
          </ScalePressable>
          <AppText variant="h1" style={{ flex: 1 }}>
            Brand kits
          </AppText>
        </View>

        <AppText variant="body" tone="secondary">
          Logos, colors, fonts, captions, and CTAs applied automatically to every clip. Agency plans support a kit per
          client.
        </AppText>

        {kitsQuery.isPending ? (
          <SkeletonCard />
        ) : kits.length === 0 ? (
          <EmptyState
            title="No brand kits yet"
            body="Create one so every export carries your identity."
            actionLabel="Create brand kit"
            onAction={() => router.push('/brand-kits/new')}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {kits.map((kit) => (
              <Card key={kit.id} onPress={() => router.push(`/brand-kits/${kit.id}`)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ flexDirection: 'row' }}>
                    {[kit.primaryColor, kit.secondaryColor, kit.accentColor].map((c, i) => (
                      <View
                        key={i}
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: c,
                          marginLeft: i === 0 ? 0 : -8,
                          borderWidth: 2,
                          borderColor: colors.surface,
                        }}
                      />
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyBold">{kit.name}</AppText>
                    <AppText variant="caption" tone="muted">
                      {kit.captionFont} · {kit.defaultCta}
                    </AppText>
                  </View>
                  {kit.isDefault ? <Badge label="Default" tone="primary" /> : null}
                </View>
              </Card>
            ))}
          </View>
        )}

        {atLimit && plan?.id !== 'agency' ? (
          <RestrictedState
            title="Brand kit limit reached"
            body={`The ${plan?.name} plan includes ${plan?.maxBrandKits} brand kit${(plan?.maxBrandKits ?? 1) > 1 ? 's' : ''}. Growth and Agency unlock more.`}
            onUpgrade={() => router.push('/settings/subscription')}
          />
        ) : (
          <Button
            label="New brand kit"
            icon={<Plus size={18} color={colors.onPrimary} />}
            fullWidth
            onPress={() => router.push('/brand-kits/new')}
          />
        )}
      </View>
    </Screen>
  );
}
