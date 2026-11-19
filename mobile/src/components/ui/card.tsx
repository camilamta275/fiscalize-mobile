import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { Card as GlueCard } from '@/components/gluestack/card';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Created by AI.
export type CardTone = 'default' | 'muted' | 'primary' | 'accent' | 'danger' | 'gold';

// Updated by AI.
type CardProps = ViewProps & {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  tone?: CardTone;
};

/**
 * The reference's `glass-card`: a white surface with a hairline border and a
 * soft shadow. React Native has no backdrop blur, so the translucency is
 * dropped and the shadow is slightly stronger to keep the same depth.
 */
// Created by AI.
// Updated by AI.
export function Card({ children, onPress, padded = true, style, tone = 'default', ...rest }: CardProps) {
  const theme = useTheme();

  const background = {
    default: theme.card,
    muted: theme.backgroundElement,
    primary: theme.primarySoft,
    accent: theme.accentSoft,
    danger: theme.destructiveSoft,
    gold: theme.goldSoft,
  }[tone];

  const border = {
    default: theme.border,
    muted: theme.border,
    primary: theme.primary,
    accent: theme.accent,
    danger: theme.destructive,
    gold: theme.gold,
  }[tone];

  const content = (
    <GlueCard
      className="gap-0"
      style={[
        styles.base,
        Shadows.card,
        {
          backgroundColor: background,
          borderColor: border,
          shadowColor: theme.shadow,
        },
        tone !== 'default' && styles.tintedBorder,
        padded && styles.padded,
        style,
      ]}
      {...rest}>
      {children}
    </GlueCard>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
      {content}
    </Pressable>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 0,
    padding: 0,
  },
  padded: {
    padding: Spacing.three,
  },
  tintedBorder: {
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
