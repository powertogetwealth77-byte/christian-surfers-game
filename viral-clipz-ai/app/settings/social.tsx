import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Link2 } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ScalePressable } from '@/components/ui/Pressable';
import { Screen } from '@/components/ui/Screen';
import { PLATFORM_LABELS } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';
import type { Platform } from '@/types/entities';

const CONNECTABLE: Platform[] = ['tiktok', 'instagram_reels', 'youtube_shorts', 'facebook_reels', 'linkedin', 'x'];

/**
 * Social connections — integration-ready state.
 * OAuth flows for each platform land with the backend; nothing here
 * pretends an account is connected.
 */
export default function SocialConnectionsScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={{ gap: spacing.lg, paddingTop: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <ScalePressable onPress={() => router.back()} accessibilityLabel="Go back" containerStyle={{ padding: spacing.xs }}>
            <ArrowLeft size={22} color={colors.text} />
          </ScalePressable>
          <AppText variant="h1" style={{ flex: 1 }}>
            Social connections
          </AppText>
        </View>

        <AppText variant="body" tone="secondary">
          Connect accounts to publish directly and pull real performance data into Analytics.
        </AppText>

        <View style={{ gap: spacing.md }}>
          {CONNECTABLE.map((p) => (
            <Card key={p}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Link2 size={20} color={colors.textSecondary} />
                <AppText variant="bodyBold" style={{ flex: 1 }}>
                  {PLATFORM_LABELS[p]}
                </AppText>
                <Badge label="Connect soon" tone="accent" />
              </View>
              <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
                OAuth connection ships with the publishing backend. The UI and data model are ready.
              </AppText>
            </Card>
          ))}
        </View>
      </View>
    </Screen>
  );
}
