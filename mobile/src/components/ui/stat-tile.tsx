import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import type { IconName } from '@/constants/icons';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatTileProps = {
  icon?: IconName;
  label: string;
  tone: { background: ThemeColor; foreground: ThemeColor };
  value: number | string;
};

/** Compact KPI tile used above the list, adapted from the reference's `KPICard`. */
// Created by AI.
export function StatTile({ icon, label, tone, value }: StatTileProps) {
  const theme = useTheme();

  return (
    <Card style={styles.card} tone="default">
      <View style={styles.row}>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: theme[tone.background] }]}>
            <Icon color={theme[tone.foreground]} name={icon} size={14} />
          </View>
        ) : null}
        <ThemedText style={{ color: theme[tone.foreground] }} type="heading">
          {value}
        </ThemedText>
      </View>
      <ThemedText numberOfLines={1} themeColor="mutedForeground" type="caption">
        {label}
      </ThemedText>
    </Card>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two + 2,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
});
