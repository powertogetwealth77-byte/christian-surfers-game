import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, typography } from '@/theme/tokens';

type Variant = keyof typeof typography;
type Tone = 'default' | 'secondary' | 'muted' | 'primary' | 'accent' | 'success' | 'warning' | 'danger';

const toneColor: Record<Tone, string> = {
  default: colors.text,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  primary: colors.primary,
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
};

export interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  center?: boolean;
}

export function AppText({ variant = 'body', tone = 'default', center, style, ...rest }: AppTextProps) {
  const base: TextStyle = {
    ...typography[variant],
    color: toneColor[tone],
    ...(center ? { textAlign: 'center' } : null),
  };
  // allowFontScaling stays on (default) for dynamic type support.
  return <Text {...rest} style={[base, style]} />;
}
