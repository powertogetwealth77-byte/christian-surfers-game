import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus } from 'lucide-react-native';
import { CreateStep } from '@/components/feature/CreateStep';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { ScalePressable } from '@/components/ui/Pressable';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { backend } from '@/services';
import { useCreateFlowStore } from '@/stores/createFlowStore';
import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';
import type { AspectRatio, CaptionStyle } from '@/types/entities';

const RATIOS: AspectRatio[] = ['9:16', '1:1', '4:5', '16:9'];
const CAPTION_STYLES: { value: CaptionStyle; label: string }[] = [
  { value: 'bold_pop', label: 'Bold Pop' },
  { value: 'clean_minimal', label: 'Clean Minimal' },
  { value: 'karaoke', label: 'Karaoke' },
  { value: 'block_highlight', label: 'Block Highlight' },
  { value: 'typewriter', label: 'Typewriter' },
];

function Counter({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: minTouchTarget }}>
      <AppText variant="bodyBold">{label}</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <ScalePressable
          onPress={() => onChange(Math.max(min, value - step))}
          accessibilityLabel={`Decrease ${label}`}
          containerStyle={counterBtn}
        >
          <Minus size={16} color={colors.text} />
        </ScalePressable>
        <AppText variant="bodyBold" style={{ minWidth: 64, textAlign: 'center' }}>
          {value}
          {suffix ?? ''}
        </AppText>
        <ScalePressable
          onPress={() => onChange(Math.min(max, value + step))}
          accessibilityLabel={`Increase ${label}`}
          containerStyle={counterBtn}
        >
          <Plus size={16} color={colors.text} />
        </ScalePressable>
      </View>
    </View>
  );
}

const counterBtn = {
  width: 36,
  height: 36,
  borderRadius: radius.sm,
  backgroundColor: colors.surfaceHigh,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

export default function ConfigStep() {
  const router = useRouter();
  const config = useCreateFlowStore((s) => s.config);
  const setConfig = useCreateFlowStore((s) => s.setConfig);
  const brandKitsQuery = useQuery({ queryKey: ['brandKits'], queryFn: () => backend.listBrandKits() });

  return (
    <CreateStep step={4} title="Clip configuration" subtitle="Auto-select uses your objective and audience to pick the best settings." onNext={() => router.push('/create/review')}>
      <View style={{ gap: spacing.lg }}>
        <ToggleRow
          label="Auto-select best settings"
          hint="Recommended — the AI tunes everything below"
          value={config.autoSelect}
          onChange={(v) => setConfig({ autoSelect: v })}
        />

        <View style={{ opacity: config.autoSelect ? 0.45 : 1, gap: spacing.lg }} pointerEvents={config.autoSelect ? 'none' : 'auto'}>
          <Counter label="Number of clips" value={config.clipCount} onChange={(v) => setConfig({ clipCount: v })} min={1} max={20} />
          <Counter label="Min length" value={config.minLengthSec} onChange={(v) => setConfig({ minLengthSec: Math.min(v, config.maxLengthSec) })} min={10} max={120} step={5} suffix="s" />
          <Counter label="Max length" value={config.maxLengthSec} onChange={(v) => setConfig({ maxLengthSec: Math.max(v, config.minLengthSec) })} min={15} max={180} step={5} suffix="s" />

          <View style={{ gap: spacing.sm }}>
            <AppText variant="bodyBold">Aspect ratio</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              {RATIOS.map((r) => (
                <Chip key={r} label={r} selected={config.aspectRatio === r} onPress={() => setConfig({ aspectRatio: r })} />
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <AppText variant="bodyBold">Caption style</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              {CAPTION_STYLES.map((cs) => (
                <Chip key={cs.value} label={cs.label} selected={config.captionStyle === cs.value} onPress={() => setConfig({ captionStyle: cs.value })} />
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <AppText variant="bodyBold">Emoji level</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {(['none', 'light', 'expressive'] as const).map((lvl) => (
                <Chip
                  key={lvl}
                  label={lvl === 'none' ? 'None' : lvl === 'light' ? 'Light' : 'Expressive'}
                  selected={config.emojiLevel === lvl}
                  onPress={() => setConfig({ emojiLevel: lvl })}
                />
              ))}
            </View>
          </View>

          <ToggleRow label="Speaker tracking" hint="Keep faces centered in vertical crops" value={config.speakerTracking} onChange={(v) => setConfig({ speakerTracking: v })} />
          <ToggleRow label="Profanity filter" value={config.profanityFilter} onChange={(v) => setConfig({ profanityFilter: v })} />
          <ToggleRow label="Remove filler words" hint="Cuts “um”, “uh”, “like”" value={config.removeFillerWords} onChange={(v) => setConfig({ removeFillerWords: v })} />
          <ToggleRow label="Remove silences" value={config.removeSilence} onChange={(v) => setConfig({ removeSilence: v })} />
          <ToggleRow label="Auto zoom" hint="Punch-ins on emphasis" value={config.autoZoom} onChange={(v) => setConfig({ autoZoom: v })} />
          <ToggleRow label="B-roll recommendations" value={config.brollSuggestions} onChange={(v) => setConfig({ brollSuggestions: v })} />
        </View>

        <Input
          label="Default CTA"
          placeholder="e.g. Follow for more →"
          value={config.defaultCta}
          onChangeText={(v) => setConfig({ defaultCta: v })}
        />

        <View style={{ gap: spacing.sm }}>
          <AppText variant="bodyBold">Brand kit</AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Chip label="None" selected={config.brandKitId === null} onPress={() => setConfig({ brandKitId: null })} />
            {(brandKitsQuery.data ?? []).map((kit) => (
              <Chip
                key={kit.id}
                label={kit.name}
                selected={config.brandKitId === kit.id}
                onPress={() => setConfig({ brandKitId: kit.id })}
              />
            ))}
          </View>
        </View>
      </View>
    </CreateStep>
  );
}
