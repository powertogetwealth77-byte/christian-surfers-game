import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { ClipCard } from '@/components/feature/ClipCard';
import { FadeInView } from '@/components/feature/FadeInView';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { ScalePressable } from '@/components/ui/Pressable';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { track } from '@/lib/analytics';
import { backend } from '@/services';
import { colors, spacing } from '@/theme/tokens';
import type { Clip, ClipScores } from '@/types/entities';

type SortKey =
  | 'best'
  | 'hook'
  | 'leads'
  | 'emotional'
  | 'shortest'
  | 'longest';
type StatusFilter = 'all' | 'recommended' | 'alternative' | 'needs_review' | 'approved';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'best', label: 'Best overall' },
  { key: 'hook', label: 'Strongest hook' },
  { key: 'leads', label: 'Lead potential' },
  { key: 'emotional', label: 'Most emotional' },
  { key: 'shortest', label: 'Shortest' },
  { key: 'longest', label: 'Longest' },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'recommended', label: 'Recommended' },
  { key: 'alternative', label: 'Alternatives' },
  { key: 'needs_review', label: 'Needs review' },
  { key: 'approved', label: 'Approved' },
];

export default function ProjectResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<SortKey>('best');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const projectQuery = useQuery({ queryKey: ['project', id], queryFn: () => backend.getProject(id!), enabled: !!id });
  const clipsQuery = useQuery({ queryKey: ['clips', id], queryFn: () => backend.listClips(id!), enabled: !!id });

  const clips = clipsQuery.data ?? [];
  const scoreQueries = useQueries({
    queries: clips.map((c) => ({
      queryKey: ['scores', c.id],
      queryFn: () => backend.getScores(c.id),
    })),
  });
  const scoresByClip = useMemo(() => {
    const map = new Map<string, ClipScores>();
    scoreQueries.forEach((q) => {
      if (q.data) map.set(q.data.clipId, q.data);
    });
    return map;
  }, [scoreQueries]);

  const visible = useMemo(() => {
    let list = clips;
    if (statusFilter === 'approved') list = list.filter((c) => c.approved);
    else if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter);

    const score = (c: Clip) => scoresByClip.get(c.id);
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'best':
          return (score(b)?.viralPotential ?? 0) - (score(a)?.viralPotential ?? 0);
        case 'hook':
          return (score(b)?.hookStrength ?? 0) - (score(a)?.hookStrength ?? 0);
        case 'leads':
          return (score(b)?.leadPotential ?? 0) - (score(a)?.leadPotential ?? 0);
        case 'emotional':
          return (score(b)?.emotionalImpact ?? 0) - (score(a)?.emotionalImpact ?? 0);
        case 'shortest':
          return (a.endMs - a.startMs) - (b.endMs - b.startMs);
        case 'longest':
          return (b.endMs - b.startMs) - (a.endMs - a.startMs);
      }
    });
  }, [clips, sort, statusFilter, scoresByClip]);

  const openClip = (clip: Clip) => {
    track('clip_previewed', { clipId: clip.id });
    router.push(`/clip/${clip.id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + spacing.md }}>
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <DemoBanner />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <ScalePressable onPress={() => router.back()} accessibilityLabel="Go back" containerStyle={{ padding: spacing.xs }}>
            <ArrowLeft size={22} color={colors.text} />
          </ScalePressable>
          <View style={{ flex: 1 }}>
            <AppText variant="h2" numberOfLines={1}>
              {projectQuery.data?.title ?? 'Results'}
            </AppText>
            <AppText variant="caption" tone="muted">
              {clips.length} clips, ranked by predicted performance
            </AppText>
          </View>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SORTS}
          keyExtractor={(s) => s.key}
          contentContainerStyle={{ gap: spacing.sm }}
          renderItem={({ item }) => (
            <Chip label={item.label} selected={sort === item.key} onPress={() => setSort(item.key)} />
          )}
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(s) => s.key}
          contentContainerStyle={{ gap: spacing.sm }}
          renderItem={({ item }) => (
            <Chip label={item.label} selected={statusFilter === item.key} onPress={() => setStatusFilter(item.key)} />
          )}
        />
      </View>

      {clipsQuery.isPending ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </View>
      ) : clipsQuery.isError ? (
        <ErrorState title="Couldn’t load clips" actionLabel="Retry" onAction={() => clipsQuery.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={statusFilter === 'all' ? 'No clips yet' : 'Nothing in this filter'}
          body={
            statusFilter === 'all'
              ? 'This project hasn’t produced clips. If processing failed, retry it from Projects.'
              : 'Try a different filter.'
          }
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{
            padding: spacing.xl,
            gap: spacing.lg,
            paddingBottom: insets.bottom + spacing.x4l,
            maxWidth: 640,
            width: '100%',
            alignSelf: 'center',
          }}
          renderItem={({ item, index }) => (
            <FadeInView index={Math.min(index, 6)}>
              <ClipCard
                clip={item}
                scores={scoresByClip.get(item.id) ?? null}
                onOpen={() => openClip(item)}
                onEdit={() => router.push(`/clip/${item.id}/editor`)}
                onExport={() => {
                  track('clip_exported', { clipId: item.id, stage: 'intent' });
                  router.push(`/clip/${item.id}`);
                }}
                onShare={() => {
                  track('clip_shared', { clipId: item.id, stage: 'intent' });
                  router.push(`/clip/${item.id}`);
                }}
                onSave={() => backend.setClipApproved(item.id, !item.approved).then(() => clipsQuery.refetch())}
              />
            </FadeInView>
          )}
        />
      )}
    </View>
  );
}
