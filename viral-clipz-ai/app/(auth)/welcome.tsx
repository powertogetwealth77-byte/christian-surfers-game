import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Scissors, Sparkles, TrendingUp } from 'lucide-react-native';
import { FadeInView } from '@/components/feature/FadeInView';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/LogoMark';
import { isDemoMode } from '@/lib/env';
import { useAuthStore } from '@/stores/authStore';
import { colors, gradients, radius, spacing } from '@/theme/tokens';

const VALUE_PROPS = [
  { icon: Sparkles, text: 'AI finds the moments worth posting' },
  { icon: Scissors, text: 'Captioned, branded, vertical — automatically' },
  { icon: TrendingUp, text: 'Every clip ships with a strategy to grow' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const enterDemo = useAuthStore((s) => s.enterDemo);

  return (
    <LinearGradient
      colors={gradients.aurora}
      style={{ flex: 1, paddingTop: insets.top + spacing.x5l, paddingBottom: insets.bottom + spacing.xxl }}
    >
      <View style={{ flex: 1, paddingHorizontal: spacing.xxl, justifyContent: 'space-between', maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <View style={{ alignItems: 'center', gap: spacing.x3l }}>
          <FadeInView>
            <LogoMark size={64} />
          </FadeInView>
          <FadeInView index={1}>
            <AppText variant="display" center>
              Turn every video into your next growth engine.
            </AppText>
          </FadeInView>
          <FadeInView index={2}>
            <AppText variant="bodyLg" tone="secondary" center>
              Upload one long video. Get a ranked set of platform-ready clips — each with captions, hooks, and a reason it can perform.
            </AppText>
          </FadeInView>
        </View>

        <View style={{ gap: spacing.md }}>
          {VALUE_PROPS.map((v, i) => (
            <FadeInView key={v.text} index={3 + i}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: radius.md,
                  padding: spacing.lg,
                }}
              >
                <v.icon size={20} color={colors.primary} />
                <AppText variant="body" tone="secondary" style={{ flex: 1 }}>
                  {v.text}
                </AppText>
              </View>
            </FadeInView>
          ))}
        </View>

        <FadeInView index={6}>
          <View style={{ gap: spacing.md }}>
            <Button label="Create free account" size="lg" fullWidth onPress={() => router.push('/(auth)/sign-up')} />
            <Button
              label="I already have an account"
              variant="outline"
              size="lg"
              fullWidth
              onPress={() => router.push('/(auth)/sign-in')}
            />
            {isDemoMode ? (
              <Button label="Explore in Demo Mode" variant="ghost" fullWidth onPress={() => enterDemo()} />
            ) : null}
          </View>
        </FadeInView>
      </View>
    </LinearGradient>
  );
}
