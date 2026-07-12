import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FadeInView } from '@/components/feature/FadeInView';
import { SocialAuthButtons } from '@/components/feature/SocialAuthButtons';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScalePressable } from '@/components/ui/Pressable';
import { Screen } from '@/components/ui/Screen';
import { isDemoMode } from '@/lib/env';
import { useAuthStore } from '@/stores/authStore';
import { spacing } from '@/theme/tokens';

const schema = z.object({
  fullName: z.string().min(2, 'Tell us what to call you'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .regex(/[0-9]/, 'Include at least one number'),
});

type FormValues = z.infer<typeof schema>;

export default function SignUpScreen() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUpWithPassword);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setAuthError(null);
    const result = await signUp(values.email, values.password, values.fullName);
    setSubmitting(false);
    if (!result.ok) {
      setAuthError(result.error ?? 'Could not create your account.');
      return;
    }
    if (!isDemoMode) {
      // Supabase sends a confirmation email; show the verification state.
      setVerifyEmail(values.email);
      router.push({ pathname: '/(auth)/verify-email', params: { email: values.email } });
    }
  };

  return (
    <Screen keyboard>
      <View style={{ gap: spacing.xxl, paddingTop: spacing.x4l }}>
        <FadeInView>
          <View style={{ gap: spacing.sm }}>
            <AppText variant="h1">Create your account</AppText>
            <AppText variant="body" tone="secondary">
              Your first clips are minutes away. Free plan includes 60 processing minutes a month.
            </AppText>
          </View>
        </FadeInView>

        <FadeInView index={1}>
          <View style={{ gap: spacing.lg }}>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Name"
                  placeholder="Your name or studio"
                  autoComplete="name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={formState.errors.fullName?.message}
                />
              )}
            />
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
                  placeholder="8+ characters, one number"
                  secure
                  autoComplete="new-password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={formState.errors.password?.message}
                />
              )}
            />

            {authError ? (
              <AppText variant="caption" tone="danger" accessibilityLiveRegion="assertive">
                {authError}
              </AppText>
            ) : null}
            {verifyEmail ? (
              <AppText variant="caption" tone="success">
                Confirmation email sent to {verifyEmail}.
              </AppText>
            ) : null}

            <Button
              label={isDemoMode ? 'Create account (Demo Mode)' : 'Create account'}
              size="lg"
              fullWidth
              loading={submitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </FadeInView>

        <FadeInView index={2}>
          <SocialAuthButtons />
        </FadeInView>

        <FadeInView index={3}>
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <AppText variant="caption" tone="muted" center>
              By creating an account you agree to our{' '}
              <AppText
                variant="captionBold"
                tone="secondary"
                style={{ textDecorationLine: 'underline' }}
                onPress={() => Linking.openURL('https://viralclipz.app/terms')}
              >
                Terms
              </AppText>{' '}
              and{' '}
              <AppText
                variant="captionBold"
                tone="secondary"
                style={{ textDecorationLine: 'underline' }}
                onPress={() => Linking.openURL('https://viralclipz.app/privacy')}
              >
                Privacy Policy
              </AppText>
              .
            </AppText>
            <ScalePressable onPress={() => router.push('/(auth)/sign-in')} accessibilityLabel="Sign in instead">
              <AppText variant="body" tone="secondary">
                Already have an account?{' '}
                <AppText variant="bodyBold" tone="primary">
                  Sign in
                </AppText>
              </AppText>
            </ScalePressable>
          </View>
        </FadeInView>
      </View>
    </Screen>
  );
}
