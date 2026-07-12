import { ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView } from '@/components/feature/FadeInView';
import { LogoMark } from '@/components/ui/LogoMark';
import { colors, gradients, spacing } from '@/theme/tokens';

/**
 * Splash: shown while the auth store initializes.
 * The root layout redirects to auth / onboarding / tabs once state is known.
 */
export default function SplashScreen() {
  return (
    <LinearGradient colors={gradients.aurora} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <FadeInView>
        <LogoMark size={72} />
      </FadeInView>
      <View style={{ marginTop: spacing.x4l }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    </LinearGradient>
  );
}
