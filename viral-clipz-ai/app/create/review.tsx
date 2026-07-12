import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Clapperboard, Clock3, Coins, Target, Users } from 'lucide-react-native';
import { CreateStep } from '@/components/feature/CreateStep';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { formatDuration } from '@/lib/format';
import { track } from '@/lib/analytics';
import { toMessage } from '@/lib/errors';
import { backend } from '@/services';
import { uploadProjectSource } from '@/services/sourceUpload';
import { useCreateFlowStore } from '@/stores/createFlowStore';
import { colors, radius, spacing } from '@/theme/tokens';

function ReviewRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
      {icon}
      <AppText variant="caption" tone="muted" style={{ width: 110 }}>{label}</AppText>
      <AppText variant="bodyBold" style={{ flex: 1 }} numberOfLines={2}>{value}</AppText>
    </View>
  );
}

const OBJECTIVE_LABELS: Record<string, string> = {
  maximize_reach: 'Maximize reach',
  generate_leads: 'Generate leads',
  sell_offer: 'Sell an offer',
  build_authority: 'Build authority',
  drive_comments: 'Drive comments',
  promote_event: 'Promote an event',
  teach_idea: 'Teach a key idea',
  inspire: 'Inspire or motivate',
  podcast_highlights: 'Podcast highlights',
};

export default function ReviewStep() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { source, objective, audience, config, reset } = useCreateFlowStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationSec = source?.durationSec ?? 1800;
  const estimatedMinutes = Math.ceil(durationSec / 60);
  const expectedClips = config.autoSelect ? 'Auto (typically 5–10)' : String(config.clipCount);

  const onGenerate = async () => {
    if (!source || !objective) return;
    setSubmitting(true);
    setError(null);
    try {
      const project = await backend.createProject({
        title: source.title,
        objective,
        audience: audience.targetAudience
          ? {
              targetAudience: audience.targetAudience,
              painPoint: audience.painPoint,
              transformation: audience.transformation,
              tone: audience.tone,
              prioritizeTopics: audience.prioritizeTopics.split(',').map((s) => s.trim()).filter(Boolean),
              avoidTopics: audience.avoidTopics.split(',').map((s) => s.trim()).filter(Boolean),
            }
          : null,
        config,
        source: {
          kind: source.kind,
          url: source.url,
          uri: source.uri,
          fileName: source.fileName,
          mimeType: source.mimeType,
          sizeBytes: source.sizeBytes,
          durationSec,
        },
      });

      await uploadProjectSource(project.id, {
        uri: source.uri,
        fileName: source.fileName,
        mimeType: source.mimeType,
        sizeBytes: source.sizeBytes,
      });

      track('project_created', { objective, sourceKind: source.kind });
      track('source_uploaded', { projectId: project.id, sizeBytes: source.sizeBytes ?? undefined });
      track('processing_started', { projectId: project.id });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      reset();
      router.replace(`/project/${project.id}/processing`);
    } catch (e) {
      setError(toMessage(e));
      track('project_failed', { stage: 'create_or_upload' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!source || !objective) {
    return (
      <CreateStep step={5} title="Almost there" subtitle="A source video and an objective are required first." nextLabel="Back to start" onNext={() => router.dismissTo('/create/source')}>
        <View />
      </CreateStep>
    );
  }

  return (
    <CreateStep
      step={5}
      title="Review & generate"
      subtitle="Double-check the brief — this is what the AI optimizes against."
      nextLabel="Upload & generate clips"
      nextLoading={submitting}
      onNext={onGenerate}
    >
      <View style={{ gap: spacing.md }}>
        <Card padded={false}>
          <View
            style={{
              height: 140,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              backgroundColor: colors.bgSubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clapperboard size={36} color={colors.textMuted} />
          </View>
          <View style={{ padding: spacing.lg }}>
            <AppText variant="h3">{source.title}</AppText>
            <AppText variant="caption" tone="muted" style={{ marginTop: spacing.xs }}>
              {source.fileName ?? source.url ?? 'Device video'}
            </AppText>
          </View>
        </Card>

        <Card>
          <ReviewRow icon={<Clock3 size={18} color={colors.textSecondary} />} label="Duration" value={`≈ ${formatDuration(durationSec)}`} />
          <ReviewRow icon={<Target size={18} color={colors.textSecondary} />} label="Objective" value={OBJECTIVE_LABELS[objective]} />
          <ReviewRow icon={<Users size={18} color={colors.textSecondary} />} label="Audience" value={audience.targetAudience || 'Not specified — AI will infer from content'} />
          <ReviewRow icon={<Clapperboard size={18} color={colors.textSecondary} />} label="Expected clips" value={expectedClips} />
          <ReviewRow icon={<Coins size={18} color={colors.textSecondary} />} label="Credit usage" value={`≈ ${estimatedMinutes} processing minutes`} />
        </Card>

        <AppText variant="caption" tone="muted">
          Keep the app open while the source uploads. After upload completes, processing continues in the background.
        </AppText>

        {error ? <AppText variant="caption" tone="danger" accessibilityLiveRegion="assertive">{error}</AppText> : null}
      </View>
    </CreateStep>
  );
}
