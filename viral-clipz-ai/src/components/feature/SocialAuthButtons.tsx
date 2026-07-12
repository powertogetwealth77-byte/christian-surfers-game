import { Alert, Platform, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { ScalePressable } from '@/components/ui/Pressable';
import { colors, minTouchTarget, radius, spacing } from '@/theme/tokens';

/**
 * Apple / Google auth entry points.
 * Integration-ready: wiring native OAuth (expo-apple-authentication /
 * Google OAuth via Supabase) lands with the backend prompt. Until then the
 * buttons state clearly that setup is pending rather than pretending to work.
 */

function SocialButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <ScalePressable
      onPress={onPress}
      accessibilityLabel={label}
      containerStyle={{
        flex: 1,
        minHeight: minTouchTarget + 4,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        backgroundColor: colors.surfaceHigh,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppText variant="bodyBold">{label}</AppText>
    </ScalePressable>
  );
}

function notConfigured(provider: string) {
  const message = `${provider} sign-in is integration-ready but not yet configured. Add the provider in Supabase Auth settings to enable it.`;
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    alert(message);
  } else {
    Alert.alert(`${provider} sign-in`, message);
  }
}

export function SocialAuthButtons() {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <SocialButton label=" Apple" onPress={() => notConfigured('Apple')} />
      <SocialButton label="G  Google" onPress={() => notConfigured('Google')} />
    </View>
  );
}
