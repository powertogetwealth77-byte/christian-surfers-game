import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  Clapperboard,
  Download,
  Music4,
  Play,
  Redo2,
  Undo2,
} from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { ScalePressable } from '@/components/ui/Pressable';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { formatTimestampMs } from '@/lib/format';
import { track } from '@/lib/analytics';
import { backend } from '@/services';
import { useEditorStore } from '@/stores/editorStore';
import { colors, radius, spacing } from '@/theme/tokens';
import type { AspectRatio, CaptionStyle } from '@/types/entities';

const RATIOS: AspectRatio[] = ['9:16', '1:1', '4:5', '16:9'];
const CAPTION_STYLES: { value: CaptionStyle; label: string }[] = [
  { value: 'bold_pop', label: 'Bold Pop' },
  { value: 'clean_minimal', label: 'Clean Minimal' },
  { value: 'karaoke', label: 'Karaoke' },
  { value: 'block_highlight', label: 'Block Highlight' },
  { value: 'typewriter', label: 'Typewriter' },
];
const FONTS = ['Inter Black', 'Archivo Expanded', 'Space Grotesk', 'Manrope'];
const CAPTION_COLORS = ['#FFFFFF', '#FF5C38', '#8B5CF6', '#2DE3A7', '#FFB020'];
const FRAMING: { value: 'auto_track' | 'center' | 'split' | 'grid'; label: string }[] = [
  { value: 'auto_track', label: 'Auto-track speaker' },
  { value: 'center', label: 'Center crop' },
  { value: 'split', label: 'Split screen' },
  { value: 'grid', label: 'Grid' },
];

/** Aspect preview box sized to the selected ratio. */
function ratioBox(ratio: AspectRatio, maxW: number): { width: number; height: number } {
  const [w, h] = ratio.split(':').map(Number);
  const height = 260;
  const width = Math.min(maxW, (height * w) / h);
  return { width, height };
}

export default function ClipEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const editor = useEditorStore();
  const [saved, setSaved] = useState(false);

  const clipQuery = useQuery({ queryKey: ['clip', id], queryFn: () => backend.getClip(id!), enabled: !!id });
  const clip = clipQuery.data;

  useEffect(() => {
    if (clip && editor.clipId !== clip.id) {
      editor.load(clip.id, {
        trimStartMs: 0,
        trimEndMs: clip.endMs - clip.startMs,
        captionText: clip.transcriptExcerpt,
        aspectRatio: clip.aspectRatio,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip?.id]);

  const s = editor.snapshot;
  const durationMs = s.trimEndMs - s.trimStartMs;
  const preview = useMemo(() => ratioBox(s.aspectRatio, 340), [s.aspectRatio]);

  const nudgeTrim = (edge: 'start' | 'end', deltaMs: number) => {
    if (edge === 'start') {
      editor.apply({ trimStartMs: Math.max(0, Math.min(s.trimStartMs + deltaMs, s.trimEndMs - 2000)) });
    } else {
      editor.apply({ trimEndMs: Math.max(s.trimStartMs + 2000, s.trimEndMs + deltaMs) });
    }
  };

  const onSave = () => {
    editor.markSaved();
    setSaved(true);
    track('clip_edited', { clipId: id });
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + spacing.md }}>
      {/* Toolbar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.md,
          maxWidth: 640,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <ScalePressable onPress={() => router.back()} accessibilityLabel="Close editor" containerStyle={{ padding: spacing.xs }}>
          <ArrowLeft size={22} color={colors.text} />
        </ScalePressable>
        <AppText variant="h3" style={{ flex: 1 }} numberOfLines={1}>
          Edit clip
        </AppText>
        <ScalePressable
          onPress={editor.undo}
          disabled={editor.past.length === 0}
          accessibilityLabel="Undo"
          containerStyle={{ padding: spacing.sm }}
        >
          <Undo2 size={20} color={editor.past.length ? colors.text : colors.textDisabled} />
        </ScalePressable>
        <ScalePressable
          onPress={editor.redo}
          disabled={editor.future.length === 0}
          accessibilityLabel="Redo"
          containerStyle={{ padding: spacing.sm }}
        >
          <Redo2 size={20} color={editor.future.length ? colors.text : colors.textDisabled} />
        </ScalePressable>
        <Button
          label={saved ? 'Saved' : 'Save'}
          size="sm"
          variant={saved ? 'secondary' : 'primary'}
          icon={saved ? <Check size={14} color={colors.success} /> : undefined}
          onPress={onSave}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.x4l,
          maxWidth: 640,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview with live caption overlay */}
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: preview.width,
              height: preview.height,
              borderRadius: radius.lg,
              backgroundColor: colors.bgSubtle,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Play size={30} color={colors.textMuted} />
            {s.logoOverlay ? (
              <View style={{ position: 'absolute', top: spacing.sm, right: spacing.sm }}>
                <View style={{ backgroundColor: colors.surfaceHigh, borderRadius: radius.xs, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <AppText variant="micro" tone="muted">
                    LOGO
                  </AppText>
                </View>
              </View>
            ) : null}
            <View
              style={{
                position: 'absolute',
                left: spacing.md,
                right: spacing.md,
                top: s.captionPosition === 'top' ? spacing.lg : undefined,
                bottom: s.captionPosition === 'bottom' ? spacing.lg : undefined,
                alignSelf: 'center',
                ...(s.captionPosition === 'middle' ? { top: '45%' } : null),
              }}
            >
              <AppText
                variant="captionBold"
                center
                numberOfLines={3}
                style={{
                  color: s.captionColor,
                  backgroundColor: s.captionStyle === 'block_highlight' ? 'rgba(0,0,0,0.65)' : 'transparent',
                  borderRadius: radius.xs,
                  padding: 4,
                }}
              >
                {s.captionText || 'Caption preview'}
                {s.emojiEnabled ? ' 🔥' : ''}
              </AppText>
            </View>
            {s.ctaEndCard ? (
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.primarySoft, padding: 4 }}>
                <AppText variant="micro" tone="primary" center>
                  CTA END CARD ON
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        {/* Timeline with trim handles */}
        <SectionHeader title="Timeline" />
        <Card>
          <View style={{ height: 44, borderRadius: radius.sm, backgroundColor: colors.surfaceHigh, overflow: 'hidden', flexDirection: 'row' }}>
            {/* Selected region */}
            <View style={{ flex: 1, margin: 4, borderRadius: radius.xs, backgroundColor: colors.primarySoft, borderWidth: 1.5, borderColor: colors.primary, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: 10, backgroundColor: colors.primary, borderTopLeftRadius: radius.xs, borderBottomLeftRadius: radius.xs }} />
              {/* Playhead */}
              <View style={{ width: 2, backgroundColor: colors.text, alignSelf: 'stretch' }} />
              <View style={{ width: 10, backgroundColor: colors.primary, borderTopRightRadius: radius.xs, borderBottomRightRadius: radius.xs }} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
            <AppText variant="caption" tone="muted">
              In {formatTimestampMs(s.trimStartMs)}
            </AppText>
            <AppText variant="captionBold" tone="primary">
              {formatTimestampMs(durationMs)}
            </AppText>
            <AppText variant="caption" tone="muted">
              Out {formatTimestampMs(s.trimEndMs)}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <Button label="In −1s" size="sm" variant="secondary" style={{ flex: 1 }} onPress={() => nudgeTrim('start', -1000)} />
            <Button label="In +1s" size="sm" variant="secondary" style={{ flex: 1 }} onPress={() => nudgeTrim('start', 1000)} />
            <Button label="Out −1s" size="sm" variant="secondary" style={{ flex: 1 }} onPress={() => nudgeTrim('end', -1000)} />
            <Button label="Out +1s" size="sm" variant="secondary" style={{ flex: 1 }} onPress={() => nudgeTrim('end', 1000)} />
          </View>
        </Card>

        {/* Captions */}
        <SectionHeader title="Captions" />
        <Card style={{ gap: spacing.lg }}>
          <Input
            label="Caption text"
            value={s.captionText}
            onChangeText={(v) => editor.apply({ captionText: v })}
            multiline
          />
          <View style={{ gap: spacing.sm }}>
            <AppText variant="captionBold" tone="secondary">
              Style
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              {CAPTION_STYLES.map((cs) => (
                <Chip key={cs.value} label={cs.label} selected={s.captionStyle === cs.value} onPress={() => editor.apply({ captionStyle: cs.value })} />
              ))}
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="captionBold" tone="secondary">
              Font
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              {FONTS.map((f) => (
                <Chip key={f} label={f} selected={s.captionFont === f} onPress={() => editor.apply({ captionFont: f })} />
              ))}
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="captionBold" tone="secondary">
              Color
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {CAPTION_COLORS.map((c) => (
                <ScalePressable
                  key={c}
                  onPress={() => editor.apply({ captionColor: c })}
                  accessibilityLabel={`Caption color ${c}`}
                  containerStyle={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: c,
                    borderWidth: 3,
                    borderColor: s.captionColor === c ? colors.primary : 'transparent',
                  }}
                />
              ))}
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="captionBold" tone="secondary">
              Position
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {(['top', 'middle', 'bottom'] as const).map((p) => (
                <Chip key={p} label={p[0].toUpperCase() + p.slice(1)} selected={s.captionPosition === p} onPress={() => editor.apply({ captionPosition: p })} />
              ))}
            </View>
          </View>
          <ToggleRow label="Highlight keywords" value={s.highlightKeywords} onChange={(v) => editor.apply({ highlightKeywords: v })} />
          <ToggleRow label="Emojis" value={s.emojiEnabled} onChange={(v) => editor.apply({ emojiEnabled: v })} />
        </Card>

        {/* Framing */}
        <SectionHeader title="Framing" />
        <Card style={{ gap: spacing.lg }}>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="captionBold" tone="secondary">
              Speaker framing
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              {FRAMING.map((f) => (
                <Chip key={f.value} label={f.label} selected={s.framingPreset === f.value} onPress={() => editor.apply({ framingPreset: f.value })} />
              ))}
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="captionBold" tone="secondary">
              Aspect ratio
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {RATIOS.map((r) => (
                <Chip key={r} label={r} selected={s.aspectRatio === r} onPress={() => editor.apply({ aspectRatio: r })} />
              ))}
            </View>
          </View>
        </Card>

        {/* Brand & extras */}
        <SectionHeader title="Brand & extras" />
        <Card style={{ gap: spacing.sm }}>
          <ToggleRow label="Brand logo overlay" value={s.logoOverlay} onChange={(v) => editor.apply({ logoOverlay: v })} />
          <ToggleRow label="CTA end card" value={s.ctaEndCard} onChange={(v) => editor.apply({ ctaEndCard: v })} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm }}>
            <Music4 size={20} color={colors.textSecondary} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold">Music track</AppText>
              <AppText variant="caption" tone="muted">
                {s.musicTrack ?? 'None — licensed library arrives with backend integration'}
              </AppText>
            </View>
          </View>
        </Card>

        {/* B-roll recommendations */}
        <SectionHeader title="B-roll suggestions" />
        <Card style={{ gap: spacing.md }}>
          {['Money/price tag close-up at 0:02 when “$10K” lands', 'Screen-record of an invoice at 0:14', 'Slow push-in on speaker for the final line'].map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Clapperboard size={18} color={colors.accent} />
              <AppText variant="body" tone="secondary" style={{ flex: 1 }}>
                {b}
              </AppText>
            </View>
          ))}
          <AppText variant="micro" tone="muted">
            SAMPLE RECOMMENDATIONS — GENERATED PER-CLIP ONCE THE BACKEND IS CONNECTED
          </AppText>
        </Card>

        <View style={{ marginTop: spacing.xl }}>
          <Button
            label="Export clip"
            size="lg"
            fullWidth
            icon={<Download size={18} color={colors.onPrimary} />}
            onPress={() => {
              track('clip_exported', { clipId: id, stage: 'intent' });
              router.push('/settings/subscription');
            }}
          />
          <AppText variant="caption" tone="muted" center style={{ marginTop: spacing.sm }}>
            Rendering happens server-side; free plan exports include a watermark.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
