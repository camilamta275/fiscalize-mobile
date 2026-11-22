import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatTileProps = {
  label: string;
  tone: { background: ThemeColor; foreground: ThemeColor };
  value: number | string;
};

/**
 * Compact KPI tile above the list: the count centred, with the status shown as
 * a tinted pill (dot + label) underneath, matching the status badges on the
 * ticket cards.
 */
// Updated by AI.
export function StatTile({ label, tone, value }: StatTileProps) {
  const theme = useTheme();

  return (
    <Card style={styles.card} tone="default">
      <ThemedText style={styles.value} type="heading">
        {value}
      </ThemedText>
      <View style={[styles.pill, { backgroundColor: theme[tone.background] }]}>
        <View style={[styles.dot, { backgroundColor: theme[tone.foreground] }]} />
        <ThemedText
          numberOfLines={2}
          style={[styles.pillLabel, { color: theme[tone.foreground] }]}
          type="caption">
          {label}
        </ThemedText>
      </View>
    </Card>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flex: 1,
    gap: Spacing.two,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.three,
  },
  value: {
    textAlign: 'center',
  },
  pill: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  dot: {
    borderRadius: Radius.pill,
    height: 6,
    width: 6,
  },
  pillLabel: {
    flexShrink: 1,
    fontWeight: '600',
    textAlign: 'center',
  },
});
