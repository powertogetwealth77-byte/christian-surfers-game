import { View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus } from 'lucide-react-native';
import { useState } from 'react';
import { OnboardingStep } from '@/components/feature/OnboardingStep';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { ScalePressable } from '@/components/ui/Pressable';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { colors, radius, spacing } from '@/theme/tokens';

const SWATCHES = ['#FF5C38', '#8B5CF6', '#2DE3A7', '#FFB020', '#3B82F6', '#EC4899', '#F4F6FB'];
const CAPTION_STYLES = [
  { value: 'bold_pop', label: 'Bold Pop' },
  { value: 'clean_minimal', label: 'Clean Minimal' },
  { value: 'karaoke', label: 'Karaoke' },
  { value: 'block_highlight', label: 'Block Highlight' },
];
const FONTS = ['Inter Black', 'Archivo Expanded', 'Space Grotesk', 'Manrope'];

export default function BrandSetupScreen() {
  const router = useRouter();
  const store = useOnboardingStore();
  const [logoName, setLogoName] = useState<string | null>(null);

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      setLogoName(result.assets[0].fileName ?? 'logo selected');
    }
  };

  return (
    <OnboardingStep
      step={5}
      title="Set up your brand"
      subtitle="Applied to every clip automatically. You can refine this later in Brand Kit."
      onNext={() => router.push('/onboarding/first-win')}
    >
      <View style={{ gap: spacing.xl }}>
        <Input
          label="Brand name"
          placeholder="e.g. The Growth Desk"
          value={store.brandName}
          onChangeText={(v) => store.set('brandName', v)}
        />

        <View style={{ gap: spacing.sm }}>
          <AppText variant="captionBold" tone="secondary">
            Primary color
          </AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {SWATCHES.map((c) => (
              <ScalePressable
                key={c}
                onPress={() => store.set('primaryColor', c)}
                accessibilityLabel={`Primary color ${c}`}
                containerStyle={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: c,
                  borderWidth: 3,
                  borderColor: store.primaryColor === c ? colors.text : 'transparent',
                }}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppText variant="captionBold" tone="secondary">
            Secondary color
          </AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {SWATCHES.map((c) => (
              <ScalePressable
                key={c}
                onPress={() => store.set('secondaryColor', c)}
                accessibilityLabel={`Secondary color ${c}`}
                containerStyle={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: c,
                  borderWidth: 3,
                  borderColor: store.secondaryColor === c ? colors.text : 'transparent',
                }}
              />
            ))}
          </View>
        </View>

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
            {logoName ?? 'Upload your logo (PNG with transparency works best)'}
          </AppText>
        </ScalePressable>

        <View style={{ gap: spacing.sm }}>
          <AppText variant="captionBold" tone="secondary">
            Caption style
          </AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {CAPTION_STYLES.map((cs) => (
              <Chip
                key={cs.value}
                label={cs.label}
                selected={store.captionStyle === cs.value}
                onPress={() => store.set('captionStyle', cs.value)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppText variant="captionBold" tone="secondary">
            Default font
          </AppText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            {FONTS.map((f) => (
              <Chip key={f} label={f} selected={store.defaultFont === f} onPress={() => store.set('defaultFont', f)} />
            ))}
          </View>
        </View>

        <Input
          label="Default call to action"
          placeholder="e.g. Follow for more →"
          value={store.defaultCta}
          onChangeText={(v) => store.set('defaultCta', v)}
          hint="Shown as the end-card CTA unless a clip overrides it."
        />
      </View>
    </OnboardingStep>
  );
}
