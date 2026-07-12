import { View } from 'react-native';
import { Clapperboard, RefreshCcw } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatDuration, formatRelative } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';
import type { Project } from '@/types/entities';

const statusMeta: Record<
  Project['status'],
  { label: string; tone: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  draft: { label: 'Draft', tone: 'neutral' },
  uploading: { label: 'Uploading', tone: 'accent' },
  queued: { label: 'Queued', tone: 'accent' },
  processing: { label: 'Processing', tone: 'accent' },
  completed: { label: 'Completed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export function ProjectCard({
  project,
  progress,
  onPress,
  onRetry,
}: {
  project: Project;
  /** live job progress for processing projects */
  progress?: number;
  onPress: () => void;
  onRetry?: () => void;
}) {
  const meta = statusMeta[project.status];
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceHigh,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Clapperboard size={22} color={colors.textSecondary} />
        </View>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <AppText variant="bodyBold" numberOfLines={1}>
            {project.title}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Badge label={meta.label} tone={meta.tone} />
            <AppText variant="caption" tone="muted">
              {project.durationSec ? `${formatDuration(project.durationSec)} · ` : ''}
              {formatRelative(project.updatedAt)}
            </AppText>
          </View>
        </View>
        {project.status === 'completed' ? (
          <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
            <AppText variant="h3" tone="primary">
              {project.clipCount}
            </AppText>
            <AppText variant="micro" tone="muted">
              CLIPS
            </AppText>
          </View>
        ) : null}
      </View>

      {project.status === 'processing' && typeof progress === 'number' ? (
        <View style={{ marginTop: spacing.md, gap: spacing.xs }}>
          <ProgressBar value={progress} />
          <AppText variant="caption" tone="muted">
            {progress}% complete
          </AppText>
        </View>
      ) : null}

      {project.status === 'failed' ? (
        <View style={{ marginTop: spacing.md, gap: spacing.md }}>
          <AppText variant="caption" tone="danger">
            {project.failureReason ?? 'Processing failed.'}
          </AppText>
          {onRetry ? (
            <Button
              label="Retry"
              size="sm"
              variant="secondary"
              onPress={onRetry}
              icon={<RefreshCcw size={14} color={colors.text} />}
            />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
