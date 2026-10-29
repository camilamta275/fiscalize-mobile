import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DemandPriority } from '@/models/demand';

/**
 * Priority pill, ported from the reference's `TicketDetail` card. The mapping
 * follows the same palette the reference uses: low → open (blue), medium →
 * waiting (gold), high → analysis (orange) and critical → critical (red).
 */
// Created by AI.
export const PRIORITY_TONES: Record<
  DemandPriority,
  { background: ThemeColor; foreground: ThemeColor }
> = {
  Baixa: { background: 'statusOpenBg', foreground: 'statusOpen' },
  Média: { background: 'statusWaitingBg', foreground: 'statusWaiting' },
  Alta: { background: 'statusAnalysisBg', foreground: 'statusAnalysis' },
  Crítica: { background: 'statusCriticalBg', foreground: 'statusCritical' },
};

// Created by AI.
export function PriorityBadge({ priority }: { priority: DemandPriority }) {
  const theme = useTheme();
  const tone = PRIORITY_TONES[priority];

  return (
    <View style={[styles.badge, { backgroundColor: theme[tone.background] }]}>
      <ThemedText style={{ color: theme[tone.foreground] }} type="smallBold">
        {priority}
      </ThemedText>
    </View>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
  },
});
