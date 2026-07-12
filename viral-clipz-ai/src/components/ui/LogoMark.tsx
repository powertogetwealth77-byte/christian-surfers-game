import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, gradients, radius, spacing } from '@/theme/tokens';

/** Viral Clipz AI logo mark: gradient bolt tile + wordmark. */
export function LogoMark({ size = 48, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.md }}>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Zap size={size * 0.55} color={colors.onPrimary} fill={colors.onPrimary} />
      </LinearGradient>
      {withWordmark ? (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <AppText variant="h2">Viral Clipz</AppText>
          <AppText variant="h2" tone="primary">
            AI
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
