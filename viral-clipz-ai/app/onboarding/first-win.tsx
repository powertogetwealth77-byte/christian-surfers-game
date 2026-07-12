import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Rocket } from 'lucide-react-native';
import { FadeInView } from '@/components/feature/FadeInView';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { colors, gradients, radius, spacing } from '@/theme/tokens';

export default function FirstWinScreen() {
  const router = useRouter();
  const answers = useOnboardingStore();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [saving, setSaving] = useState(false);

  const finish = async (goCreate: boolean) => {
    setSaving(true);
    await completeOnboarding({
      creatorType: answers.creatorType ?? 'other',
      primaryGoal: answers.primaryGoal ?? 'grow_followers',
      platforms: answers.platforms,
      contentStyle: answers.contentStyle ?? 'educational',
      brandName: answers.brandName,
      primaryColor: answers.primaryColor,
      secondaryColor: answers.secondaryColor,
      captionStyle: answers.captionStyle,
      defaultFont: answers.defaultFont,
      defaultCta: answers.defaultCta,
    });
    setSaving(false);
    if (goCreate) router.replace('/create/source');
    else router.replace('/(tabs)');
  };

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.x3l }}>
        <FadeInView>
          <LinearGradient
            colors={gradients.violet}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 84,
              height: 84,
              borderRadius: radius.xl,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
            }}
          >
            <Rocket size={40} color={colors.onPrimary} />
          </LinearGradient>
        </FadeInView>

        <FadeInView index={1}>
          <View style={{ gap: spacing.md }}>
            <AppText variant="display" center>
              You’re set. Let’s get your first win.
            </AppText>
            <AppText variant="bodyLg" tone="secondary" center>
              Upload one long video and watch it become a week of ranked, ready-to-post clips.
            </AppText>
          </View>
        </FadeInView>

        <FadeInView index={2}>
          <View style={{ gap: spacing.md }}>
            <Button label="Create my first project" size="lg" fullWidth loading={saving} onPress={() => finish(true)} />
            <Button label="Explore the dashboard first" variant="ghost" fullWidth onPress={() => finish(false)} />
          </View>
        </FadeInView>
      </View>
    </Screen>
  );
}
