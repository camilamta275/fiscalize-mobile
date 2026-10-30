import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Icons, type IconName } from '@/constants/icons';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Created by AI.
export type MessageTone = 'danger' | 'warning' | 'info' | 'success';

// Created by AI.
const TONES: Record<
  MessageTone,
  { background: ThemeColor; border: ThemeColor; foreground: ThemeColor; icon: IconName }
> = {
  danger: {
    background: 'statusCriticalBg',
    border: 'statusCritical',
    foreground: 'statusCritical',
    icon: Icons.warning,
  },
  warning: {
    background: 'statusWaitingBg',
    border: 'statusWaiting',
    foreground: 'statusWaiting',
    icon: Icons.warning,
  },
  info: {
    background: 'statusOpenBg',
    border: 'statusOpen',
    foreground: 'statusOpen',
    icon: Icons.info,
  },
  success: {
    background: 'statusProgressBg',
    border: 'statusProgress',
    foreground: 'statusProgress',
    icon: Icons.checkCircle,
  },
};

type InlineMessageProps = {
  message: string;
  title?: string;
  tone?: MessageTone;
};

/** Tinted notice used for validation errors and contextual warnings. */
// Created by AI.
export function InlineMessage({ message, title, tone = 'danger' }: InlineMessageProps) {
  const theme = useTheme();
  const palette = TONES[tone];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme[palette.background], borderColor: theme[palette.border] },
      ]}>
      <Icon color={theme[palette.foreground]} name={palette.icon} size={18} />
      <View style={styles.copy}>
        {title ? (
          <ThemedText style={{ color: theme[palette.foreground] }} type="smallBold">
            {title}
          </ThemedText>
        ) : null}
        <ThemedText themeColor="textSecondary" type="small">
          {message}
        </ThemedText>
      </View>
    </View>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.two + 2,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
