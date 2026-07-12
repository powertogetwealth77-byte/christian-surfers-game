import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck } from 'lucide-react-native';
import { FadeInView } from '@/components/feature/FadeInView';
import { SocialAuthButtons } from '@/components/feature/SocialAuthButtons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LogoMark } from '@/components/ui/LogoMark';
import { ScalePressable } from '@/components/ui/Pressable';
import { Screen } from '@/components/ui/Screen';
import { isDemoMode } from '@/lib/env';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/theme/tokens';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function SignInScreen() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signInWithPassword);
  const sendMagicLink = useAuthStore((s) => s.sendMagicLink);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  const { control, handleSubmit, getValues, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setAuthError(null);
    const result = await signIn(values.email, values.password);
    setSubmitting(false);
    if (!result.ok) {
      setAuthError(result.error ?? 'Sign in failed. Check your credentials and try again.');
    }
    // Success routing is handled by the root auth gate.
  };

  const onMagicLink = async () => {
    const email = getValues('email');
    if (!email) {
      setAuthError('Enter your email above first, then tap “Email me a magic link.”');
      return;
    }
    setAuthError(null);
    const result = await sendMagicLink(email);
    if (result.ok) setMagicSent(true);
    else setAuthError(result.error ?? 'Could not send the magic link.');
  };

  return (
    <Screen keyboard>
      <View style={{ gap: spacing.xxl, paddingTop: spacing.x4l }}>
        <FadeInView>
          <LogoMark size={52} withWordmark={false} />
        </FadeInView>

        <FadeInView index={1}>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="h1">Turn every video into your next growth engine.</AppText>
            <AppText variant="body" tone="secondary">
              Sign in to keep converting long-form videos into ranked, captioned, platform-ready clips.
            </AppText>
          </View>
        </FadeInView>

        <FadeInView index={2}>
          <View style={{ gap: spacing.lg }}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@studio.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={formState.errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Your password"
                  secure
                  autoComplete="password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={formState.errors.password?.message}
                />
              )}
            />

            <ScalePressable
              onPress={() => router.push('/(auth)/forgot-password')}
              accessibilityLabel="Forgot password"
              containerStyle={{ alignSelf: 'flex-end', padding: spacing.xs }}
            >
              <AppText variant="captionBold" tone="primary">
                Forgot password?
              </AppText>
            </ScalePressable>

            {authError ? (
              <AppText variant="caption" tone="danger" accessibilityLiveRegion="assertive">
                {authError}
              </AppText>
            ) : null}
            {magicSent ? (
              <AppText variant="caption" tone="success">
                Magic link sent — check your inbox to finish signing in.
              </AppText>
            ) : null}

            <Button
              label={isDemoMode ? 'Sign in (Demo Mode)' : 'Sign in'}
              size="lg"
              fullWidth
              loading={submitting}
              onPress={handleSubmit(onSubmit)}
            />
            <Button label="Email me a magic link" variant="outline" fullWidth onPress={onMagicLink} />
          </View>
        </FadeInView>

        <FadeInView index={3}>
          <View style={{ gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <AppText variant="caption" tone="muted">
                or continue with
              </AppText>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>
            <SocialAuthButtons />
          </View>
        </FadeInView>

        <FadeInView index={4}>
          <View style={{ gap: spacing.lg, alignItems: 'center' }}>
            <ScalePressable onPress={() => router.push('/(auth)/sign-up')} accessibilityLabel="Create account">
              <AppText variant="body" tone="secondary">
                New here?{' '}
                <AppText variant="bodyBold" tone="primary">
                  Create an account
                </AppText>
              </AppText>
            </ScalePressable>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <ShieldCheck size={14} color={colors.textMuted} />
              <AppText variant="caption" tone="muted">
                Secured with encrypted authentication. We never post without permission.
              </AppText>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.lg }}>
              <ScalePressable onPress={() => Linking.openURL('https://viralclipz.app/terms')} accessibilityLabel="Terms of Service">
                <AppText variant="caption" tone="muted" style={{ textDecorationLine: 'underline' }}>
                  Terms
                </AppText>
              </ScalePressable>
              <ScalePressable onPress={() => Linking.openURL('https://viralclipz.app/privacy')} accessibilityLabel="Privacy Policy">
                <AppText variant="caption" tone="muted" style={{ textDecorationLine: 'underline' }}>
                  Privacy
                </AppText>
              </ScalePressable>
            </View>
          </View>
        </FadeInView>
      </View>
    </Screen>
  );
}
