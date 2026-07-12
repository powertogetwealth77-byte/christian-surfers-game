import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, Check, CircleDashed, Loader } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { ErrorState } from '@/components/ui/States';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { Waveform } from '@/components/ui/Waveform';
import { track } from '@/lib/analytics';
import { backend } from '@/services';
import { colors, spacing } from '@/theme/tokens';
import type { JobStage } from '@/types/entities';

const STAGE_LABELS: { stage: JobStage; label: string }[] = [
  { stage: 'uploading', label: 'Uploading video' },
  { stage: 'extracting_audio', label: 'Extracting audio' },
  { stage: 'transcribing', label: 'Transcribing speech' },
  { stage: 'understanding_topics', label: 'Understanding topics' },
  { stage: 'detecting_moments', label: 'Detecting strong moments' },
  { stage: 'ranking_hooks', label: 'Ranking hooks' },
  { stage: 'reframing_speakers', label: 'Reframing speakers' },
  { stage: 'generating_captions', label: 'Generating captions' },
  { stage: 'applying_brand', label: 'Applying brand kit' },
  { stage: 'preparing_clips', label: 'Preparing clips' },
];

export default function ProcessingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [notifyMe, setNotifyMe] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const completedFired = useRef(false);

  // Poll-based job status: the interface (backend.getJob) is what a real
  // backend implements — Supabase Realtime can replace polling later
  // without changing this screen's data shape.
  const jobQuery = useQuery({
    queryKey: ['job', id],
    queryFn: () => backend.getJob(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' || status === 'cancelled' ? false : 1500;
    },
  });

  const job = jobQuery.data;

  useEffect(() => {
    if (job?.status === 'completed' && !completedFired.current) {
      completedFired.current = true;
      track('processing_completed', { projectId: id });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.replace(`/project/${id}`);
    }
  }, [job?.status, id, router, queryClient]);

  const onCancel = async () => {
    if (!id) return;
    setCancelling(true);
    await backend.cancelProcessing(id);
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    setCancelling(false);
    router.dismissTo('/(tabs)');
  };

  const currentIdx = job ? STAGE_LABELS.findIndex((s) => s.stage === job.stage) : 0;

  if (jobQuery.isError || (jobQuery.isSuccess && !job)) {
    return (
      <Screen>
        <ErrorState
          title="Processing status unavailable"
          body="We couldn’t find this job. It may have been cancelled or completed elsewhere."
          actionLabel="Back to projects"
          onAction={() => router.dismissTo('/(tabs)/projects')}
        />
      </Screen>
    );
  }

  if (job?.status === 'failed') {
    return (
      <Screen>
        <ErrorState
          title="Processing failed"
          body={job.error ?? 'Something went wrong in the pipeline. Your minutes were not charged.'}
          actionLabel="Retry"
          onAction={async () => {
            await backend.retryProject(id!);
            completedFired.current = false;
            jobQuery.refetch();
          }}
        />
        <Button label="Back to projects" variant="ghost" fullWidth onPress={() => router.dismissTo('/(tabs)/projects')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xl, paddingTop: spacing.x3l, flex: 1 }}>
        <View style={{ alignItems: 'center', gap: spacing.lg }}>
          <Waveform active={job?.status !== 'cancelled'} />
          <AppText variant="h1" center>
            Building your clips
          </AppText>
          <AppText variant="body" tone="secondary" center>
            {job?.message ?? 'Warming up the pipeline…'}
          </AppText>
        </View>

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <AppText variant="captionBold" tone="secondary">
              Overall progress
            </AppText>
            <AppText variant="captionBold" tone="primary">
              {job?.progress ?? 0}%
            </AppText>
          </View>
          <ProgressBar value={job?.progress ?? 0} />
        </Card>

        <Card>
          <View style={{ gap: spacing.sm }}>
            {STAGE_LABELS.map((s, i) => {
              const done = i < currentIdx || job?.status === 'completed';
              const active = i === currentIdx && job?.status === 'running';
              return (
                <View key={s.stage} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 28 }}>
                  {done ? (
                    <Check size={18} color={colors.success} />
                  ) : active ? (
                    <Loader size={18} color={colors.primary} />
                  ) : (
                    <CircleDashed size={18} color={colors.textDisabled} />
                  )}
                  <AppText
                    variant={active ? 'bodyBold' : 'body'}
                    tone={done ? 'success' : active ? 'default' : 'muted'}
                  >
                    {s.label}
                  </AppText>
                </View>
              );
            })}
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            <BellRing size={16} color={colors.accent} />
            <AppText variant="bodyBold">You don’t have to wait here</AppText>
          </View>
          <AppText variant="caption" tone="secondary">
            Processing continues in the background. Leave this screen and we’ll keep working.
          </AppText>
          <ToggleRow
            label="Notify me when clips are ready"
            value={notifyMe}
            onChange={setNotifyMe}
            hint="Push notification on completion"
          />
        </Card>

        <View style={{ gap: spacing.md }}>
          <Button label="Continue in background" variant="secondary" fullWidth onPress={() => router.dismissTo('/(tabs)')} />
          <Button label="Cancel processing" variant="ghost" fullWidth loading={cancelling} onPress={onCancel} />
        </View>
      </View>
    </Screen>
  );
}
