import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, breakpoints } from '@/theme/tokens';
import { useWindowDimensions } from 'react-native';

export interface ScreenProps {
  children: React.ReactNode;
  /** Scrollable content (default true) */
  scroll?: boolean;
  /** Horizontal padding (default true) */
  padded?: boolean;
  /** Wrap in KeyboardAvoidingView for form screens */
  keyboard?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** Extra bottom padding for screens under the tab bar */
  bottomInset?: number;
}

/**
 * Base screen wrapper: safe areas, background, keyboard handling and a
 * max content width so web/tablet renders cleanly.
 */
export function Screen({ children, scroll = true, padded = true, keyboard, style, contentStyle, bottomInset = 0 }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const maxWidth = width >= breakpoints.lg ? 640 : undefined;

  const inner = (
    <View style={{ flex: 1, width: '100%', maxWidth, alignSelf: 'center' }}>{children}</View>
  );

  const body = scroll ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        {
          paddingHorizontal: padded ? spacing.xl : 0,
          paddingBottom: insets.bottom + spacing.xxl + bottomInset,
          flexGrow: 1,
        },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {inner}
    </ScrollView>
  ) : (
    <View
      style={[
        { flex: 1, paddingHorizontal: padded ? spacing.xl : 0, paddingBottom: insets.bottom + bottomInset },
        contentStyle,
      ]}
    >
      {inner}
    </View>
  );

  const content = (
    <View style={[{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }, style]}>{body}</View>
  );

  if (keyboard) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {content}
      </KeyboardAvoidingView>
    );
  }
  return content;
}
