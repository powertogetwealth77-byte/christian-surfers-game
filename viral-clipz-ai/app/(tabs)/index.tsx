import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Link2, Sparkles, TrendingUp, Upload, Wand2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FadeInView } from '@/components/feature/FadeInView';
import { ProjectCard } from '@/components/feature/ProjectCard';
import { UsageMeter } from '@/components/feature/UsageMeter';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { ScalePressable } from '@/components/ui/Pressable';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { PLANS } from '@/config/plans';
import { backend } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { colors, gradients, radius, spacing } from '@/theme/tokens';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);

  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: () => backend.listProjects() });
  const usageQuery = useQuery({ queryKey: ['usage'], queryFn: () => backend.getUsage() });

  const projects = projectsQuery.data ?? [];
  const processing = projects.filter((p) => p.status === 'processing');
  const recent = projects.filter((p) => p.status !== 'processing').slice(0, 3);
  const usage = usageQuery.data;
  const plan = usage ? PLANS[usage.planId] : null;
  const lowMinutes = usage ? usage.minutesIncluded - usage.minutesUsed < usage.minutesIncluded * 0.25 : false;

  const firstName = profile?.fullName?.split(' ')[0] ?? 'Creator';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing.x5l,
        maxWidth: 640,
        width: '100%',
        alignSelf: 'center',
      }}
      refreshControl={
        <RefreshControl
          refreshing={projectsQuery.isRefetching}
          onRefresh={() => {
            projectsQuery.refetch();
            usageQuery.refetch();
          }}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <DemoBanner />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <AppText variant="body" tone="secondary">
            {greeting()},
          </AppText>
          <AppText variant="h1">{firstName}</AppText>
        </View>
        <ScalePressable
          onPress={() => router.push('/(tabs)/profile')}
          accessibilityLabel="Open profile"
          containerStyle={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.accentSoft,
            borderWidth: 1,
            borderColor: colors.accentBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText variant="bodyBold" tone="accent">
            {firstName.slice(0, 1).toUpperCase()}
          </AppText>
        </ScalePressable>
      </View>

      {plan ? (
        <View style={{ marginTop: spacing.sm }}>
          <Badge label={`${plan.name} plan`} tone={plan.id === 'free' ? 'neutral' : 'primary'} />
        </View>
      ) : null}

      {/* Main CTA */}
      <FadeInView index={0} style={{ marginTop: spacing.xl }}>
        <ScalePressable onPress={() => router.push('/create/source')} haptic accessibilityLabel="Create viral clips">
          <LinearGradient
            colors={gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: radius.lg, padding: spacing.xxl, gap: spacing.sm }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Wand2 size={22} color={colors.onPrimary} />
              <AppText variant="h2" style={{ color: colors.onPrimary }}>
                Create Viral Clips
              </AppText>
            </View>
            <AppText variant="body" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Drop in a long video — get ranked, captioned clips with a growth strategy for each.
            </AppText>
          </LinearGradient>
        </ScalePressable>
      </FadeInView>

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
        <Card style={{ flex: 1 }} onPress={() => router.push('/create/source')}>
          <Upload size={20} color={colors.primary} />
          <AppText variant="bodyBold" style={{ marginTop: spacing.sm }}>
            Quick upload
          </AppText>
          <AppText variant="caption" tone="muted">
            From your library
          </AppText>
        </Card>
        <Card style={{ flex: 1 }} onPress={() => router.push({ pathname: '/create/source', params: { mode: 'link' } })}>
          <Link2 size={20} color={colors.accent} />
          <AppText variant="bodyBold" style={{ marginTop: spacing.sm }}>
            Import from link
          </AppText>
          <AppText variant="caption" tone="muted">
            YouTube, Zoom & more
          </AppText>
        </Card>
      </View>

      {/* Usage */}
      {usage ? (
        <View style={{ marginTop: spacing.md }}>
          <UsageMeter usage={usage} onPress={() => router.push('/settings/subscription')} />
        </View>
      ) : null}

      {/* Processing now */}
      {processing.length > 0 ? (
        <>
          <SectionHeader title="Processing now" />
          <View style={{ gap: spacing.md }}>
            {processing.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onPress={() => router.push(`/project/${p.id}/processing`)}
              />
            ))}
          </View>
        </>
      ) : null}

      {/* Recent projects */}
      <SectionHeader title="Recent projects" actionLabel="See all" onAction={() => router.push('/(tabs)/projects')} />
      {projectsQuery.isPending ? (
        <View style={{ gap: spacing.md }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : projectsQuery.isError ? (
        <ErrorState
          title="Couldn’t load projects"
          body="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => projectsQuery.refetch()}
        />
      ) : recent.length === 0 ? (
        <Card>
          <AppText variant="bodyBold">No projects yet</AppText>
          <AppText variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
            Your first upload becomes your first batch of clips.
          </AppText>
          <Button
            label="Start your first project"
            style={{ marginTop: spacing.md }}
            onPress={() => router.push('/create/source')}
          />
        </Card>
      ) : (
        <View style={{ gap: spacing.md }}>
          {recent.map((p, i) => (
            <FadeInView key={p.id} index={i}>
              <ProjectCard
                project={p}
                onPress={() =>
                  p.status === 'completed'
                    ? router.push(`/project/${p.id}`)
                    : p.status === 'processing'
                      ? router.push(`/project/${p.id}/processing`)
                      : router.push(`/project/${p.id}`)
                }
              />
            </FadeInView>
          ))}
        </View>
      )}

      {/* AI opportunity */}
      <SectionHeader title="This week" />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Sparkles size={18} color={colors.accent} />
          <AppText variant="bodyBold">AI content opportunity</AppText>
        </View>
        <AppText variant="body" tone="secondary" style={{ marginTop: spacing.sm }}>
          Your pricing-psychology clips outperformed your average by 2.1×. Record a follow-up on “how to raise prices
          without losing clients” and clip it here — your audience has already voted.
        </AppText>
      </Card>

      <View style={{ marginTop: spacing.md }}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <TrendingUp size={18} color={colors.success} />
            <AppText variant="bodyBold">Top clip this week</AppText>
          </View>
          <AppText variant="body" tone="secondary" style={{ marginTop: spacing.sm }}>
            “The $10K mistake almost every freelancer makes” — viral score 92, recommended for TikTok.
          </AppText>
          <Button
            label="Open results"
            variant="secondary"
            size="sm"
            style={{ marginTop: spacing.md }}
            onPress={() => router.push('/project/demo-project-0001')}
          />
        </Card>
      </View>

      {/* Contextual upgrade — only when minutes are actually running low on Free */}
      {plan?.id === 'free' && lowMinutes ? (
        <View style={{ marginTop: spacing.md }}>
          <Card onPress={() => router.push('/settings/subscription')}>
            <AppText variant="bodyBold" tone="primary">
              Running low on minutes
            </AppText>
            <AppText variant="caption" tone="secondary" style={{ marginTop: spacing.xs }}>
              Creator gives you 300 minutes, 1080p exports, and no watermark for ${PLANS.creator.priceMonthlyUsd}/mo.
            </AppText>
          </Card>
        </View>
      ) : null}
    </ScrollView>
  );
}
