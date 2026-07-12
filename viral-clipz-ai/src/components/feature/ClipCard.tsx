import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Bookmark, Download, Pencil, Play, Share2 } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { ScalePressable } from '@/components/ui/Pressable';
import { Card } from '@/components/ui/Card';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { formatDuration, formatTimestampMs, platformLabel } from '@/lib/format';
import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';
import type { Clip, ClipScores } from '@/types/entities';

const statusBadge: Record<Clip['status'], { label: string; tone: 'success' | 'accent' | 'warning' }> = {
  recommended: { label: 'Recommended', tone: 'success' },
  alternative: { label: 'Alternative', tone: 'accent' },
  needs_review: { label: 'Needs review', tone: 'warning' },
};

export function ClipCard({
  clip,
  scores,
  onOpen,
  onEdit,
  onExport,
  onShare,
  onSave,
}: {
  clip: Clip;
  scores: ClipScores | null;
  onOpen: () => void;
  onEdit: () => void;
  onExport: () => void;
  onShare: () => void;
  onSave: () => void;
}) {
  const badge = statusBadge[clip.status];
  const durationSec = (clip.endMs - clip.startMs) / 1000;

  return (
    <Card padded={false} onPress={onOpen} elevated>
      {/* Preview area — placeholder frame until real renders exist */}
      <View style={styles.preview}>
        <View style={styles.playCircle}>
          <Play size={22} color={colors.text} fill={colors.text} />
        </View>
        <View style={styles.previewMeta}>
          <AppText variant="micro" style={{ color: colors.text }}>
            {formatTimestampMs(clip.startMs)} – {formatTimestampMs(clip.endMs)} · {formatDuration(durationSec)}
          </AppText>
        </View>
      </View>

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Badge label={badge.label} tone={badge.tone} />
          <Badge label={platformLabel(clip.platformRecommendation)} tone="neutral" />
          {clip.approved ? <Badge label="Approved" tone="primary" /> : null}
        </View>

        <AppText variant="h3" numberOfLines={2}>
          {clip.title}
        </AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={2}>
          {clip.aiSummary}
        </AppText>

        {scores ? (
          <View style={styles.scores}>
            <ScoreRing score={scores.viralPotential} label="Viral" size={52} />
            <ScoreRing score={scores.hookStrength} label="Hook" size={52} />
            <ScoreRing score={scores.clarity} label="Clarity" size={52} />
            <ScoreRing score={scores.emotionalImpact} label="Emotion" size={52} />
            <ScoreRing score={scores.ctaOpportunity} label="CTA" size={52} />
          </View>
        ) : null}

        <View style={styles.actions}>
          <ActionButton icon={<Pencil size={18} color={colors.textSecondary} />} label="Edit" onPress={onEdit} />
          <ActionButton icon={<Download size={18} color={colors.textSecondary} />} label="Export" onPress={onExport} />
          <ActionButton icon={<Share2 size={18} color={colors.textSecondary} />} label="Share" onPress={onShare} />
          <ActionButton icon={<Bookmark size={18} color={colors.textSecondary} />} label="Save" onPress={onSave} />
        </View>
      </View>
    </Card>
  );
}

function ActionButton({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <ScalePressable onPress={onPress} accessibilityLabel={label} containerStyle={styles.action}>
      {icon}
      <AppText variant="micro" tone="secondary">
        {label.toUpperCase()}
      </AppText>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  preview: {
    height: 190,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.bgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMeta: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: colors.overlay,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  scores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
});
