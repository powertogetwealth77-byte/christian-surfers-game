import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Download, Pencil, Play, Share2 } from 'lucide-react-native';
import { ContentPackage } from '@/components/feature/ContentPackage';
import { StrategyPanel } from '@/components/feature/StrategyPanel';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScalePressable } from '@/components/ui/Pressable';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { formatDuration, formatTimestampMs, platformLabel } from '@/lib/format';
import { track } from '@/lib/analytics';
import { backend } from '@/services';
import { colors, radius, spacing } from '@/theme/tokens';

export default function ClipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const clipQuery = useQuery({ queryKey: ['clip', id], queryFn: () => backend.getClip(id!), enabled: !!id });
  const scoresQuery = useQuery({ queryKey: ['scores', id], queryFn: () => backend.getScores(id!), enabled: !!id });
  const strategyQuery = useQuery({ queryKey: ['strategy', id], queryFn: () => backend.getStrategy(id!), enabled: !!id });
  const copyQuery = useQuery({ queryKey: ['copy', id], queryFn: () => backend.getCopy(id!), enabled: !!id });

  const clip = clipQuery.data;

  if (clipQuery.isError || (clipQuery.isSuccess && !clip)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <ErrorState title="Clip not found" actionLabel="Go back" onAction={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + spacing.x4l,
        maxWidth: 640,
        width: '100%',
        alignSelf: 'center',
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
        <ScalePressable onPress={() => router.back()} accessibilityLabel="Go back" containerStyle={{ padding: spacing.xs }}>
          <ArrowLeft size={22} color={colors.text} />
        </ScalePressable>
        <AppText variant="h3" style={{ flex: 1 }} numberOfLines={1}>
          Clip details
        </AppText>
      </View>

      {!clip ? (
        <View style={{ gap: spacing.md }}>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
        </View>
      ) : (
        <View style={{ gap: spacing.lg }}>
          {/* Preview — placeholder frame; real renders attach in Prompt 2 */}
          <View
            style={{
              height: 320,
              borderRadius: radius.lg,
              backgroundColor: colors.bgSubtle,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Play size={26} color={colors.text} fill={colors.text} />
            </View>
            <AppText variant="caption" tone="muted" style={{ position: 'absolute', bottom: spacing.md }}>
              Preview renders after backend processing is connected
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Badge
              label={clip.status === 'recommended' ? 'Recommended' : clip.status === 'alternative' ? 'Alternative' : 'Needs review'}
              tone={clip.status === 'recommended' ? 'success' : clip.status === 'alternative' ? 'accent' : 'warning'}
            />
            <Badge label={platformLabel(clip.platformRecommendation)} tone="neutral" />
          </View>

          <AppText variant="h1">{clip.title}</AppText>
          <AppText variant="caption" tone="muted">
            {formatTimestampMs(clip.startMs)} – {formatTimestampMs(clip.endMs)} ·{' '}
            {formatDuration((clip.endMs - clip.startMs) / 1000)}
          </AppText>
          <AppText variant="body" tone="secondary">
            {clip.aiSummary}
          </AppText>

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button
              label="Edit"
              variant="secondary"
              icon={<Pencil size={16} color={colors.text} />}
              style={{ flex: 1 }}
              onPress={() => router.push(`/clip/${clip.id}/editor`)}
            />
            <Button
              label="Export"
              icon={<Download size={16} color={colors.onPrimary} />}
              style={{ flex: 1 }}
              onPress={() => {
                track('clip_exported', { clipId: clip.id, stage: 'intent' });
                router.push('/settings/subscription');
              }}
            />
            <Button
              label="Share"
              variant="secondary"
              icon={<Share2 size={16} color={colors.text} />}
              style={{ flex: 1 }}
              onPress={() => track('clip_shared', { clipId: clip.id, stage: 'intent' })}
            />
          </View>

          {scoresQuery.data ? (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <ScoreRing score={scoresQuery.data.viralPotential} label="Viral" />
                <ScoreRing score={scoresQuery.data.hookStrength} label="Hook" />
                <ScoreRing score={scoresQuery.data.clarity} label="Clarity" />
                <ScoreRing score={scoresQuery.data.emotionalImpact} label="Emotion" />
                <ScoreRing score={scoresQuery.data.ctaOpportunity} label="CTA" />
              </View>
            </Card>
          ) : null}

          {strategyQuery.data ? <StrategyPanel strategy={strategyQuery.data} initiallyOpen /> : null}

          <Card>
            <AppText variant="overline" tone="accent">
              Transcript excerpt
            </AppText>
            <AppText variant="body" tone="secondary" style={{ marginTop: spacing.sm, fontStyle: 'italic' }}>
              “{clip.transcriptExcerpt}”
            </AppText>
          </Card>

          <SectionHeader title="Content package" />
          {copyQuery.data ? <ContentPackage copy={copyQuery.data} /> : <SkeletonCard lines={4} />}
        </View>
      )}
    </ScrollView>
  );
}
