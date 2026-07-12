import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutGrid, Rows3 } from 'lucide-react-native';
import { FadeInView } from '@/components/feature/FadeInView';
import { ProjectCard } from '@/components/feature/ProjectCard';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { Input } from '@/components/ui/Input';
import { ScalePressable } from '@/components/ui/Pressable';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { backend } from '@/services';
import { colors, spacing } from '@/theme/tokens';
import type { Project, ProjectStatus } from '@/types/entities';

type Filter = 'all' | 'draft' | 'processing' | 'completed' | 'failed' | 'archived';
type Sort = 'newest' | 'oldest' | 'title';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'processing', label: 'Processing' },
  { key: 'completed', label: 'Completed' },
  { key: 'failed', label: 'Failed' },
  { key: 'archived', label: 'Archived' },
];

export default function ProjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [grid, setGrid] = useState(false);

  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: () => backend.listProjects() });

  const retryMutation = useMutation({
    mutationFn: (id: string) => backend.retryProject(id),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push(`/project/${project.id}/processing`);
    },
  });

  const filtered = useMemo(() => {
    let list = projectsQuery.data ?? [];
    if (filter !== 'all') {
      const statuses: ProjectStatus[] =
        filter === 'processing' ? ['processing', 'queued', 'uploading'] : [filter];
      list = list.filter((p) => statuses.includes(p.status));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
      if (sort === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      return a.title.localeCompare(b.title);
    });
  }, [projectsQuery.data, filter, search, sort]);

  const openProject = (p: Project) => {
    if (p.status === 'processing' || p.status === 'queued' || p.status === 'uploading') {
      router.push(`/project/${p.id}/processing`);
    } else {
      router.push(`/project/${p.id}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + spacing.lg }}>
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
        <DemoBanner />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText variant="h1">Projects</AppText>
          <ScalePressable
            onPress={() => setGrid((g) => !g)}
            accessibilityLabel={grid ? 'Switch to list view' : 'Switch to grid view'}
            containerStyle={{ padding: spacing.sm }}
          >
            {grid ? <Rows3 size={22} color={colors.textSecondary} /> : <LayoutGrid size={22} color={colors.textSecondary} />}
          </ScalePressable>
        </View>

        <Input
          placeholder="Search projects"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f.key}
          contentContainerStyle={{ gap: spacing.sm }}
          renderItem={({ item }) => (
            <Chip label={item.label} selected={filter === item.key} onPress={() => setFilter(item.key)} />
          )}
        />

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(['newest', 'oldest', 'title'] as Sort[]).map((s) => (
            <Chip
              key={s}
              label={s === 'newest' ? 'Newest' : s === 'oldest' ? 'Oldest' : 'A–Z'}
              selected={sort === s}
              onPress={() => setSort(s)}
            />
          ))}
        </View>
      </View>

      {projectsQuery.isPending ? (
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : projectsQuery.isError ? (
        <ErrorState
          title="Couldn’t load projects"
          body="Something went wrong on our side. Pull to refresh or retry."
          actionLabel="Retry"
          onAction={() => projectsQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search || filter !== 'all' ? 'Nothing matches' : 'No projects yet'}
          body={
            search || filter !== 'all'
              ? 'Try a different search or filter.'
              : 'Upload your first long video and it becomes a batch of ready-to-post clips.'
          }
          actionLabel={search || filter !== 'all' ? undefined : 'Create a project'}
          onAction={search || filter !== 'all' ? undefined : () => router.push('/create/source')}
        />
      ) : (
        <FlatList
          data={filtered}
          key={grid ? 'grid' : 'list'}
          numColumns={grid ? 2 : 1}
          keyExtractor={(p) => p.id}
          columnWrapperStyle={grid ? { gap: spacing.md } : undefined}
          contentContainerStyle={{
            padding: spacing.xl,
            gap: spacing.md,
            paddingBottom: insets.bottom + 120,
            maxWidth: 640,
            width: '100%',
            alignSelf: 'center',
          }}
          onRefresh={() => projectsQuery.refetch()}
          refreshing={projectsQuery.isRefetching}
          // Pagination-ready: swap to useInfiniteQuery + onEndReached when the
          // backend exposes cursor pagination.
          renderItem={({ item, index }) => (
            <FadeInView index={index % 8} style={grid ? { flex: 1 } : undefined}>
              <ProjectCard
                project={item}
                onPress={() => openProject(item)}
                onRetry={item.status === 'failed' ? () => retryMutation.mutate(item.id) : undefined}
              />
            </FadeInView>
          )}
        />
      )}
    </View>
  );
}
