import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ImagePlus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { ScalePressable } from '@/components/ui/Pressable';
import { Screen } from '@/components/ui/Screen';
import { ToggleRow } from '@/components/ui/ToggleRow';
import { track } from '@/lib/analytics';
import { backend } from '@/services';
import { DEMO_WORKSPACE_ID } from '@/data/demo';
import { colors, radius, spacing } from '@/theme/tokens';
import type { BrandKit, CaptionStyle } from '@/types/entities';

const SWATCHES = ['#FF5C38', '#8B5CF6', '#2DE3A7', '#FFB020', '#3B82F6', '#EC4899', '#F4F6FB'];
const FONTS = ['Inter Black', 'Archivo Expanded', 'Space Grotesk', 'Manrope'];
const CAPTION_STYLES: { value: CaptionStyle; label: string }[] = [
  { value: 'bold_pop', label: 'Bold Pop' },
  { value: 'clean_minimal', label: 'Clean Minimal' },
  { value: 'karaoke', label: 'Karaoke' },
  { value: 'block_highlight', label: 'Block Highlight' },
  { value: 'typewriter', label: 'Typewriter' },
];
const POSITIONS: { value: BrandKit['logoPosition']; label: string }[] = [
  { value: 'top_left', label: 'Top left' },
  { value: 'top_right', label: 'Top right' },
  { value: 'bottom_left', label: 'Bottom left' },
  { value: 'bottom_right', label: 'Bottom right' },
];

function newKit(): BrandKit {
  const now = new Date().toISOString();
  return {
    id: `kit-${Date.now()}`,
    workspaceId: DEMO_WORKSPACE_ID,
    name: '',
    logoUrl: null,
    primaryColor: '#FF5C38',
    secondaryColor: '#8B5CF6',
    accentColor: '#2DE3A7',
    captionFont: 'Inter Black',
    captionStyle: 'bold_pop',
    logoPosition: 'top_right',
    introCardEnabled: false,
    outroCardEnabled: true,
    defaultCta: 'Follow for more →',
    watermarkEnabled: true,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
}

function Swatches({ label, value, onChange }: { label: string; value: string; onChange: (c: string) => void }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="captionBold" tone="secondary">
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        {SWATCHES.map((c) => (
          <ScalePressable
            key={c}
            onPress={() => onChange(c)}
            accessibilityLabel={`${label} ${c}`}
            containerStyle={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: c,
              borderWidth: 3,
              borderColor: value === c ? colors.text : 'transparent',
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default function BrandKitEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === 'new';
  const [kit, setKit] = useState<BrandKit | null>(isNew ? newKit() : null);
  const [saving, setSaving] = useState(false);
  const [logoName, setLogoName] = useState<string | null>(null);

  const kitsQuery = useQuery({ queryKey: ['brandKits'], queryFn: () => backend.listBrandKits(), enabled: !isNew });

  useEffect(() => {
    if (!isNew && kitsQuery.data && !kit) {
      const found = kitsQuery.data.find((k) => k.id === id);
      if (found) setKit({ ...found });
    }
  }, [isNew, kitsQuery.data, id, kit]);

  const update = (patch: Partial<BrandKit>) => setKit((k) => (k ? { ...k, ...patch } : k));

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      setLogoName(result.assets[0].fileName ?? 'logo selected');
      update({ logoUrl: result.assets[0].uri });
    }
  };

  const onSave = async () => {
    if (!kit) return;
    setSaving(true);
    await backend.saveBrandKit(kit);
    if (isNew) track('brand_kit_created', { kitId: kit.id });
    await queryClient.invalidateQueries({ queryKey: ['brandKits'] });
    setSaving(false);
    router.back();
  };

  return (
    <Screen keyboard>
      <View style={{ gap: spacing.lg, paddingTop: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <ScalePressable onPress={() => router.back()} accessibilityLabel="Go back" containerStyle={{ padding: spacing.xs }}>
            <ArrowLeft size={22} color={colors.text} />
          </ScalePressable>
          <AppText variant="h1" style={{ flex: 1 }}>
            {isNew ? 'New brand kit' : 'Edit brand kit'}
          </AppText>
        </View>

        {!kit ? null : (
          <View style={{ gap: spacing.xl }}>
            <Input label="Brand name" placeholder="e.g. The Growth Desk" value={kit.name} onChangeText={(v) => update({ name: v })} />

            <ScalePressable
              onPress={pickLogo}
              accessibilityLabel="Upload logo"
              containerStyle={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.borderStrong,
                borderRadius: radius.md,
                padding: spacing.lg,
              }}
            >
              <ImagePlus size={22} color={colors.textSecondary} />
              <AppText variant="body" tone="secondary">
                {logoName ?? (kit.logoUrl ? 'Replace logo' : 'Upload logo')}
              </AppText>
            </ScalePressable>

            <Swatches label="Primary color" value={kit.primaryColor} onChange={(c) => update({ primaryColor: c })} />
            <Swatches label="Secondary color" value={kit.secondaryColor} onChange={(c) => update({ secondaryColor: c })} />
            <Swatches label="Accent color" value={kit.accentColor} onChange={(c) => update({ accentColor: c })} />

            <View style={{ gap: spacing.sm }}>
              <AppText variant="captionBold" tone="secondary">
                Caption font
              </AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                {FONTS.map((f) => (
                  <Chip key={f} label={f} selected={kit.captionFont === f} onPress={() => update({ captionFont: f })} />
                ))}
              </View>
            </View>

            <View style={{ gap: spacing.sm }}>
              <AppText variant="captionBold" tone="secondary">
                Caption preset
              </AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                {CAPTION_STYLES.map((cs) => (
                  <Chip key={cs.value} label={cs.label} selected={kit.captionStyle === cs.value} onPress={() => update({ captionStyle: cs.value })} />
                ))}
              </View>
            </View>

            <View style={{ gap: spacing.sm }}>
              <AppText variant="captionBold" tone="secondary">
                Logo position
              </AppText>
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                {POSITIONS.map((p) => (
                  <Chip key={p.value} label={p.label} selected={kit.logoPosition === p.value} onPress={() => update({ logoPosition: p.value })} />
                ))}
              </View>
            </View>

            <Input label="Default CTA" value={kit.defaultCta} onChangeText={(v) => update({ defaultCta: v })} />

            <Card style={{ gap: spacing.xs }}>
              <ToggleRow label="Intro card" hint="Branded opener before the clip" value={kit.introCardEnabled} onChange={(v) => update({ introCardEnabled: v })} />
              <ToggleRow label="Outro card" hint="CTA end card after the clip" value={kit.outroCardEnabled} onChange={(v) => update({ outroCardEnabled: v })} />
              <ToggleRow label="Watermark" hint="Removed on paid plans" value={kit.watermarkEnabled} onChange={(v) => update({ watermarkEnabled: v })} />
              <ToggleRow label="Default kit" hint="Applied to new projects automatically" value={kit.isDefault} onChange={(v) => update({ isDefault: v })} />
            </Card>

            <Button label="Save brand kit" size="lg" fullWidth loading={saving} disabled={!kit.name.trim()} onPress={onSave} />
          </View>
        )}
      </View>
    </Screen>
  );
}
