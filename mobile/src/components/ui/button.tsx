import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import type { IconName } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Created by AI.
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  disabled?: boolean;
  icon?: IconName;
  loading?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  title: string;
  variant?: ButtonVariant;
};

/**
 * The reference's shadcn button, in the four variants the app actually uses:
 * solid primary, bordered secondary, text-only ghost and a soft destructive.
 */
// Created by AI.
export function Button({
  disabled,
  icon,
  loading,
  onPress,
  style,
  title,
  variant = 'primary',
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette = {
    primary: { background: theme.primary, border: theme.primary, text: theme.primaryForeground },
    secondary: { background: theme.card, border: theme.border, text: theme.text },
    ghost: { background: 'transparent', border: 'transparent', text: theme.primary },
    danger: { background: theme.destructiveSoft, border: theme.destructive, text: theme.destructive },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.background, borderColor: palette.border },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {icon ? <Icon color={palette.text} name={icon} size={16} /> : null}
          <ThemedText style={{ color: palette.text }} type="smallBold">
            {title}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
});
