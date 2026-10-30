import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CategoryEmoji } from '@/components/category-emoji';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { StatusBadge } from '@/components/ui/status-badge';
import { Icons } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DEMAND_STATUS_PROGRESS, type Demand } from '@/models/demand';

/**
 * Port of the reference's `TicketCard`: thumbnail, category, status pill,
 * location, progress bar and protocol. The reference's SLA/priority/org
 * footer is omitted because the mobile API does not expose those fields yet.
 */
// Created by AI.
// Updated by AI.
export function DemandCard({ demand }: { demand: Demand }) {
  const theme = useTheme();
  const progress = DEMAND_STATUS_PROGRESS[demand.status];
  const progressColor =
    demand.status === 'Resolvido' || demand.status === 'Fechado'
      ? theme.statusDone
      : demand.status === 'Aguardando'
        ? theme.statusWaiting
        : demand.status === 'Em Análise'
          ? theme.statusAnalysis
          : theme.statusOpen;

  return (
    <Pressable
      accessibilityLabel={`Abrir ocorrência ${demand.protocolo}`}
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/[id]', params: { id: demand.id } })}>
      <Card padded={false} style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.thumbnail, { backgroundColor: theme.backgroundElement }]}>
            <CategoryEmoji name={demand.category.nome} size={24} />
          </View>

          <View style={styles.body}>
            <View style={styles.topRow}>
              <ThemedText numberOfLines={1} style={styles.category} type="smallBold">
                {demand.category.nome}
              </ThemedText>
              <StatusBadge compact status={demand.status} />
            </View>

            <ThemedText numberOfLines={1} type="default">
              {demand.title}
            </ThemedText>

            <View style={styles.metaRow}>
              <Icon color={theme.mutedForeground} name={Icons.mapPin} size={12} />
              <ThemedText numberOfLines={1} style={styles.meta} themeColor="mutedForeground" type="caption">
                {demand.location}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
            <View
              style={[
                styles.fill,
                { backgroundColor: progressColor, width: `${progress}%` },
              ]}
            />
          </View>
          <View style={styles.footerRow}>
            <ThemedText style={styles.protocol} themeColor="mutedForeground" type="caption">
              {demand.protocolo}
            </ThemedText>
            <ThemedText themeColor="mutedForeground" type="caption">
              {timeAgo(demand.createdAt)}
            </ThemedText>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

// Created by AI.
function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atrás`;
  return new Date(isoDate).toLocaleDateString('pt-BR');
}

// Created by AI.
const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
    padding: Spacing.two + 2,
  },
  thumbnail: {
    alignItems: 'center',
    borderRadius: Radius.md,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  body: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'space-between',
  },
  category: {
    flexShrink: 1,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: 1,
  },
  meta: {
    flex: 1,
  },
  footer: {
    gap: Spacing.one,
    paddingBottom: Spacing.two + 2,
    paddingHorizontal: Spacing.two + 2,
  },
  track: {
    borderRadius: Radius.pill,
    height: 5,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.pill,
    height: '100%',
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  protocol: {
    letterSpacing: 0.3,
  },
});
