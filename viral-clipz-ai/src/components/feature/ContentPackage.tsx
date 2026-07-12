import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Copy } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ScalePressable } from '@/components/ui/Pressable';
import { platformLabel } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';
import type { GeneratedCopy, Platform } from '@/types/entities';

type Tab = 'hooks' | 'caption' | 'titles' | 'hashtags' | 'cta' | 'thumbnail' | 'strategy';

const TABS: { key: Tab; label: string }[] = [
  { key: 'hooks', label: 'Hooks' },
  { key: 'caption', label: 'Captions' },
  { key: 'titles', label: 'Titles' },
  { key: 'hashtags', label: 'Hashtags' },
  { key: 'cta', label: 'CTAs' },
  { key: 'thumbnail', label: 'Thumbnails' },
  { key: 'strategy', label: 'Strategy' },
];

function CopyRow({ text }: { text: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        backgroundColor: colors.surfaceHigh,
        borderRadius: radius.sm,
        padding: spacing.md,
        alignItems: 'flex-start',
      }}
    >
      <AppText variant="body" style={{ flex: 1 }}>
        {text}
      </AppText>
      <ScalePressable accessibilityLabel="Copy text" containerStyle={{ padding: spacing.xs }}>
        <Copy size={16} color={colors.textMuted} />
      </ScalePressable>
    </View>
  );
}

/** Tabbed content package for a clip: hooks, captions, titles, hashtags, CTAs, thumbnails, posting strategy. */
export function ContentPackage({ copy }: { copy: GeneratedCopy }) {
  const [tab, setTab] = useState<Tab>('hooks');

  return (
    <Card padded={false}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.xs, paddingVertical: spacing.md }}
      >
        {TABS.map((t) => (
          <ScalePressable
            key={t.key}
            onPress={() => setTab(t.key)}
            accessibilityLabel={`${t.label} tab`}
            accessibilityState={{ selected: tab === t.key }}
            containerStyle={{
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
              backgroundColor: tab === t.key ? colors.primarySoft : 'transparent',
            }}
          >
            <AppText variant="captionBold" style={{ color: tab === t.key ? colors.primary : colors.textMuted }}>
              {t.label}
            </AppText>
          </ScalePressable>
        ))}
      </ScrollView>

      <View style={{ padding: spacing.lg, paddingTop: 0, gap: spacing.md }}>
        {tab === 'hooks' && copy.hooks.map((h, i) => <CopyRow key={i} text={h} />)}
        {tab === 'caption' && copy.captions.map((c, i) => <CopyRow key={i} text={c} />)}
        {tab === 'titles' && copy.titles.map((t, i) => <CopyRow key={i} text={t} />)}
        {tab === 'cta' && copy.ctaOptions.map((c, i) => <CopyRow key={i} text={c} />)}
        {tab === 'thumbnail' && copy.thumbnailIdeas.map((t, i) => <CopyRow key={i} text={t} />)}
        {tab === 'hashtags' &&
          (Object.entries(copy.hashtagsByPlatform) as [Platform, string[]][]).map(([platform, tags]) => (
            <View key={platform} style={{ gap: spacing.xs }}>
              <AppText variant="overline" tone="accent">
                {platformLabel(platform)}
              </AppText>
              <CopyRow text={tags.join(' ')} />
            </View>
          ))}
        {tab === 'strategy' && (
          <View style={{ gap: spacing.md }}>
            <CopyRow text={copy.postingStrategy} />
            {copy.recommendedPostingTime ? (
              <View style={{ gap: spacing.xs }}>
                <AppText variant="overline" tone="accent">
                  Recommended posting time
                </AppText>
                <AppText variant="body" tone="secondary">
                  {copy.recommendedPostingTime}
                </AppText>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Card>
  );
}
