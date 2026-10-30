import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DemandStatus } from '@/models/demand';

/**
 * Status pill ported from the reference's `StatusBadge`: a tinted background,
 * the status color as text and a dot that pulses for the "active" statuses
 * (the pulse itself is left out on mobile to keep the list calm).
 */
// Created by AI.
export const STATUS_TONES: Record<
  DemandStatus,
  { background: ThemeColor; foreground: ThemeColor; label: string }
> = {
  Aberto: { background: 'statusOpenBg', foreground: 'statusOpen', label: 'Aberto' },
  'Em Análise': { background: 'statusAnalysisBg', foreground: 'statusAnalysis', label: 'Em Análise' },
  'Em Andamento': {
    background: 'statusProgressBg',
    foreground: 'statusProgress',
    label: 'Em Andamento',
  },
  Aguardando: { background: 'statusWaitingBg', foreground: 'statusWaiting', label: 'Aguardando' },
  Resolvido: { background: 'statusDoneBg', foreground: 'statusDone', label: 'Resolvido' },
  Fechado: { background: 'statusClosedBg', foreground: 'statusClosed', label: 'Fechado' },
};

// Created by AI.
export function StatusBadge({ status, compact }: { compact?: boolean; status: DemandStatus }) {
  const theme = useTheme();
  const tone = STATUS_TONES[status];

  return (
    <View
      style={[
        styles.badge,
        compact && styles.compact,
        { backgroundColor: theme[tone.background] },
      ]}>
      <View style={[styles.dot, { backgroundColor: theme[tone.foreground] }]} />
      <ThemedText style={{ color: theme[tone.foreground] }} type={compact ? 'caption' : 'smallBold'}>
        {tone.label}
      </ThemedText>
    </View>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    flexDirection: 'row',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 4,
  },
  compact: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  dot: {
    borderRadius: Radius.pill,
    height: 6,
    width: 6,
  },
});
