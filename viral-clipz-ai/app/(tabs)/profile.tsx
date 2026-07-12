import React from 'react';
import { Alert, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  ChevronRight,
  CreditCard,
  Database,
  FileText,
  Gauge,
  LifeBuoy,
  Link2,
  LogOut,
  Palette,
  Shield,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react-native';
import { UsageMeter } from '@/components/feature/UsageMeter';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { ScalePressable } from '@/components/ui/Pressable';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PLANS } from '@/config/plans';
import { backend } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { colors, minTouchTarget, spacing } from '@/theme/tokens';

function Row({
  icon,
  label,
  detail,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  detail?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      accessibilityLabel={label}
      containerStyle={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: minTouchTarget + 6,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {icon}
      <AppText variant="body" style={{ flex: 1, color: danger ? colors.danger : colors.text }}>
        {label}
      </AppText>
      {detail ? (
        <AppText variant="caption" tone="muted">
          {detail}
        </AppText>
      ) : null}
      <ChevronRight size={18} color={colors.textMuted} />
    </ScalePressable>
  );
}

function confirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const usageQuery = useQuery({ queryKey: ['usage'], queryFn: () => backend.getUsage() });

  const plan = usageQuery.data ? PLANS[usageQuery.data.planId] : null;

  const notReady = (feature: string) => {
    const msg = `${feature} ships with the backend integration. The UI is ready and waiting.`;
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      alert(msg);
    } else {
      Alert.alert(feature, msg);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingBottom: insets.bottom + 120,
        maxWidth: 640,
        width: '100%',
        alignSelf: 'center',
      }}
      showsVerticalScrollIndicator={false}
    >
      <DemoBanner />
      <AppText variant="h1">Profile</AppText>

      <View style={{ marginTop: spacing.xl }}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText variant="h3" tone="accent">
                {(profile?.fullName ?? 'C').slice(0, 1).toUpperCase()}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h3">{profile?.fullName ?? 'Creator'}</AppText>
              <AppText variant="caption" tone="muted">
                {profile?.email ?? ''}
              </AppText>
              {plan ? (
                <View style={{ marginTop: spacing.xs }}>
                  <Badge label={`${plan.name} plan`} tone={plan.id === 'free' ? 'neutral' : 'primary'} />
                </View>
              ) : null}
            </View>
          </View>
        </Card>
      </View>

      {usageQuery.data ? (
        <View style={{ marginTop: spacing.md }}>
          <UsageMeter usage={usageQuery.data} onPress={() => router.push('/settings/subscription')} />
        </View>
      ) : null}

      <SectionHeader title="Workspace" />
      <Card padded={false}>
        <Row icon={<CreditCard size={20} color={colors.textSecondary} />} label="Subscription" detail={plan?.name} onPress={() => router.push('/settings/subscription')} />
        <Row icon={<Gauge size={20} color={colors.textSecondary} />} label="Usage" onPress={() => router.push('/settings/subscription')} />
        <Row icon={<Palette size={20} color={colors.textSecondary} />} label="Brand kits" onPress={() => router.push('/brand-kits')} />
        <Row icon={<Users size={20} color={colors.textSecondary} />} label="Team members" detail="Agency plan" onPress={() => router.push('/settings/subscription')} />
        <Row icon={<Link2 size={20} color={colors.textSecondary} />} label="Social connections" onPress={() => router.push('/settings/social')} />
        <Row icon={<Database size={20} color={colors.textSecondary} />} label="Storage" onPress={() => notReady('Storage management')} />
      </Card>

      <SectionHeader title="Account" />
      <Card padded={false}>
        <Row icon={<UserRound size={20} color={colors.textSecondary} />} label="Account details" detail={profile?.email ?? undefined} onPress={() => notReady('Account editing')} />
        <Row icon={<Bell size={20} color={colors.textSecondary} />} label="Notifications" onPress={() => notReady('Notification preferences')} />
        <Row icon={<Shield size={20} color={colors.textSecondary} />} label="Security" onPress={() => notReady('Security settings')} />
      </Card>

      <SectionHeader title="Support & legal" />
      <Card padded={false}>
        <Row icon={<LifeBuoy size={20} color={colors.textSecondary} />} label="Support" onPress={() => notReady('Support')} />
        <Row icon={<FileText size={20} color={colors.textSecondary} />} label="Privacy policy" onPress={() => notReady('Privacy policy')} />
        <Row icon={<FileText size={20} color={colors.textSecondary} />} label="Terms of service" onPress={() => notReady('Terms of service')} />
      </Card>

      <SectionHeader title="Danger zone" />
      <Card padded={false}>
        <Row
          icon={<LogOut size={20} color={colors.textSecondary} />}
          label="Sign out"
          onPress={() => confirm('Sign out', 'You can sign back in anytime.', () => signOut())}
        />
        <Row
          danger
          icon={<Trash2 size={20} color={colors.danger} />}
          label="Delete account"
          onPress={() =>
            confirm(
              'Delete account',
              'This permanently removes your projects, clips, and brand kits. Account deletion completes server-side once the backend is connected.',
              () => signOut()
            )
          }
        />
      </Card>
    </ScrollView>
  );
}
