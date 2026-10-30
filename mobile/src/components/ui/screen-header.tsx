import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { GradientView } from '@/components/ui/gradient-view';
import { Icon } from '@/components/ui/icon';
import { Icons } from '@/constants/icons';
import { Gradients, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Updated by AI.
type ScreenHeaderProps = {
  children?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  subtitle?: string;
  title: string;
  titleType?: 'heading' | 'subtitle';
  variant?: 'plain' | 'gradient';
};

/**
 * In-app header. Replaces the native stack header so it can match the
 * reference's sticky top bar (plain) and its blue→green dashboard header
 * (gradient), including the status-bar inset.
 */
// Created by AI.
// Updated by AI.
export function ScreenHeader({
  children,
  onBack,
  right,
  subtitle,
  title,
  titleType = 'heading',
  variant = 'plain',
}: ScreenHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isGradient = variant === 'gradient';

  const foreground = isGradient ? theme.primaryForeground : theme.text;
  const secondary = isGradient ? 'rgba(255,255,255,0.82)' : theme.textSecondary;
  const backSurface = isGradient ? 'rgba(255,255,255,0.16)' : theme.backgroundElement;

  const content = (
    <View style={[styles.inner, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          {onBack ? (
            <Pressable
              accessibilityLabel="Voltar"
              accessibilityRole="button"
              hitSlop={Spacing.two}
              onPress={onBack}
              style={({ pressed }) => [
                styles.backButton,
                { backgroundColor: backSurface },
                pressed && styles.pressed,
              ]}>
              <Icon color={foreground} name={Icons.arrowLeft} size={18} />
            </Pressable>
          ) : null}
          <View style={styles.titles}>
            <ThemedText numberOfLines={1} style={{ color: foreground }} type={titleType}>
              {title}
            </ThemedText>
            {subtitle ? (
              <ThemedText numberOfLines={1} style={{ color: secondary }} type="small">
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
        </View>
        {right}
      </View>
      {children}
    </View>
  );

  if (isGradient) {
    return <GradientView colors={Gradients.hero}>{content}</GradientView>;
  }

  return (
    <View
      style={[
        styles.plain,
        { backgroundColor: theme.card, borderBottomColor: theme.border },
      ]}>
      {content}
    </View>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  plain: {
    borderBottomWidth: 1,
  },
  inner: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
    minHeight: 40,
  },
  titleGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: Spacing.two,
  },
  titles: {
    flexShrink: 1,
    gap: 1,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pressed: {
    opacity: 0.7,
  },
});
