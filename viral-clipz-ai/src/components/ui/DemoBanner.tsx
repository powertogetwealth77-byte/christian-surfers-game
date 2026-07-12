import { View } from 'react-native';
import { FlaskConical } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { isDemoMode } from '@/lib/env';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme/tokens';

/**
 * Visible whenever the app is running against sample data so demo actions
 * are never mistaken for production behavior.
 */
export function DemoBanner() {
  const isDemo = useAuthStore((s) => s.isDemo);
  if (!isDemo && !isDemoMode) return null;
  return (
    <View
      accessibilityLabel="Demo mode active"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.accentSoft,
        borderColor: colors.accentBorder,
        borderWidth: 1,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
      }}
    >
      <FlaskConical size={14} color={colors.accent} />
      <AppText variant="caption" style={{ color: colors.accent, flex: 1 }}>
        Demo Mode — sample data only. Connect Supabase to go live.
      </AppText>
    </View>
  );
}
