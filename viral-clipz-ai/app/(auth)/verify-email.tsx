import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MailOpen } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing } from '@/theme/tokens';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg }}>
        <MailOpen size={56} color={colors.primary} />
        <AppText variant="h1" center>
          Verify your email
        </AppText>
        <AppText variant="body" tone="secondary" center>
          We sent a confirmation link{email ? ` to ${email}` : ''}. Tap it to activate your account, then come back and
          sign in.
        </AppText>
        <View style={{ gap: spacing.md, alignSelf: 'stretch', marginTop: spacing.lg }}>
          <Button label="I’ve verified — sign in" size="lg" fullWidth onPress={() => router.replace('/(auth)/sign-in')} />
          <Button label="Use a different email" variant="ghost" fullWidth onPress={() => router.replace('/(auth)/sign-up')} />
        </View>
      </View>
    </Screen>
  );
}
