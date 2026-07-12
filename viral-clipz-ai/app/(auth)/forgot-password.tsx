import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, MailCheck } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScalePressable } from '@/components/ui/Pressable';
import { Screen } from '@/components/ui/Screen';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/theme/tokens';

const schema = z.object({ email: z.string().email('Enter a valid email address') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const sendReset = useAuthStore((s) => s.sendPasswordReset);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);
    const result = await sendReset(values.email);
    setSubmitting(false);
    if (result.ok) setSent(true);
    else setError(result.error ?? 'Could not send the reset email.');
  };

  return (
    <Screen keyboard>
      <View style={{ gap: spacing.xxl, paddingTop: spacing.xxl }}>
        <ScalePressable onPress={() => router.back()} accessibilityLabel="Go back" containerStyle={{ alignSelf: 'flex-start', padding: spacing.sm }}>
          <ArrowLeft size={24} color={colors.text} />
        </ScalePressable>

        {sent ? (
          <View style={{ alignItems: 'center', gap: spacing.lg, paddingTop: spacing.x4l }}>
            <MailCheck size={48} color={colors.success} />
            <AppText variant="h2" center>
              Check your inbox
            </AppText>
            <AppText variant="body" tone="secondary" center>
              We sent a password reset link. It expires in one hour.
            </AppText>
            <Button label="Back to sign in" variant="secondary" onPress={() => router.replace('/(auth)/sign-in')} />
          </View>
        ) : (
          <>
            <View style={{ gap: spacing.sm }}>
              <AppText variant="h1">Reset your password</AppText>
              <AppText variant="body" tone="secondary">
                Enter the email you signed up with and we’ll send a reset link.
              </AppText>
            </View>
            <View style={{ gap: spacing.lg }}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email"
                    placeholder="you@studio.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={formState.errors.email?.message}
                  />
                )}
              />
              {error ? (
                <AppText variant="caption" tone="danger">
                  {error}
                </AppText>
              ) : null}
              <Button label="Send reset link" size="lg" fullWidth loading={submitting} onPress={handleSubmit(onSubmit)} />
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
