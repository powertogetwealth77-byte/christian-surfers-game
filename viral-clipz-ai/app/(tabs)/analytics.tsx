import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lightbulb, Link2 } from 'lucide-react-native';
import { StatTile } from '@/components/feature/StatTile';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { formatCompact, formatDuration } from '@/lib/format';
import { track } from '@/lib/analytics';
import { backend } from '@/services';
import { colors, radius, spacing } from '@/theme/tokens';

function WeeklyTrend({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <View accessibilityLabel="Weekly clip production trend" style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, height: 96 }}>
      {data.map((v, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}>
          <View
            style={{
              width: '70%',
              height: Math.max(6, (v / max) * 72),
              borderRadius: radius.xs,
              backgroundColor: i === data.length - 1 ? colors.primary : colors.surfaceActive,
            }}
          />
          <AppText variant="micro" tone="muted">
            {days[i]}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const analyticsQuery = useQuery({ queryKey: ['analytics'], queryFn: () => backend.getAnalytics() });
  const a = analyticsQuery.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + 120,
        maxWidth: 640,
        width: '100%',
        alignSelf: 'center',
      }}
      showsVerticalScrollIndicator={false}
    >
      <DemoBanner />
      <AppText variant="h1">Analytics</AppText>

      {analyticsQuery.isPending ? (
        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : analyticsQuery.isError || !a ? (
        <ErrorState
          title="Couldn’t load analytics"
          actionLabel="Retry"
          onAction={() => analyticsQuery.refetch()}
        />
      ) : (
        <>
          {a.isSampleData ? (
            <View style={{ marginTop: spacing.sm }}>
              <Badge label="Demonstration data" tone="accent" />
            </View>
          ) : null}

          {/* Connect accounts callout — platform data is not connected yet */}
          <View style={{ marginTop: spacing.lg }}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Link2 size={18} color={colors.primary} />
                <AppText variant="bodyBold">Connect social accounts</AppText>
              </View>
              <AppText variant="caption" tone="secondary" style={{ marginTop: spacing.xs }}>
                Real views, watch time, and lead attribution appear here once TikTok, Instagram, or YouTube are
                connected. Everything below is sample data showing what you’ll get.
              </AppText>
              <Button
                label="Connect accounts"
                variant="secondary"
                size="sm"
                style={{ marginTop: spacing.md }}
                onPress={() => {
                  track('social_account_connected', { stage: 'intent' });
                  router.push('/settings/social');
                }}
              />
            </Card>
          </View>

          <SectionHeader title="Production" />
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <StatTile label="Clips created" value={String(a.totalClips)} />
              <StatTile label="Minutes processed" value={String(a.minutesProcessed)} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <StatTile label="Clips exported" value={String(a.clipsExported)} />
              <StatTile label="Clips published" value={String(a.clipsPublished)} />
            </View>
          </View>

          <SectionHeader title="Performance (sample)" />
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <StatTile label="Views" value={formatCompact(a.views)} />
              <StatTile label="Avg watch" value={`${a.avgWatchPct}%`} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <StatTile label="Engagement" value={`${a.engagementRate}%`} />
              <StatTile label="Leads attributed" value={String(a.leadsAttributed)} />
            </View>
          </View>

          <SectionHeader title="Weekly trend" />
          <Card>
            <WeeklyTrend data={a.weeklyTrend} />
          </Card>

          <SectionHeader title="What’s working" />
          <View style={{ gap: spacing.md }}>
            <Card>
              <AppText variant="overline" tone="accent">
                Top hook
              </AppText>
              <AppText variant="bodyBold" style={{ marginTop: spacing.xs }}>
                “{a.topHook}”
              </AppText>
            </Card>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <StatTile label="Top topic" value={a.topTopic} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <StatTile label="Best platform" value="TikTok" />
              <StatTile label="Best length" value={formatDuration(a.bestLengthSec)} />
            </View>
          </View>

          <SectionHeader title="AI recommendations" />
          <View style={{ gap: spacing.md }}>
            {a.recommendations.map((r, i) => (
              <Card key={i}>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <Lightbulb size={18} color={colors.warning} />
                  <AppText variant="body" tone="secondary" style={{ flex: 1 }}>
                    {r}
                  </AppText>
                </View>
              </Card>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
