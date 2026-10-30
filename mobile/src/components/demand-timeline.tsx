import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Icons, type IconName } from '@/constants/icons';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DemandLog, DemandLogType } from '@/models/demand';

/**
 * Timeline ported from the reference's `TicketTimeline`: one circular icon per
 * event, a hairline connector between them, then the event title and its
 * author/date line. The event types are the backend's `tipo_timeline` enum.
 */
// Created by AI.
const LOG_CONFIG: Record<DemandLogType, { icon: IconName; tone: ThemeColor }> = {
  criacao: { icon: Icons.plus, tone: 'statusOpen' },
  status: { icon: Icons.refresh, tone: 'statusAnalysis' },
  mensagem: { icon: Icons.message, tone: 'mutedForeground' },
  transferencia: { icon: Icons.arrowRight, tone: 'gold' },
  conclusao: { icon: Icons.checkCircle, tone: 'statusProgress' },
};

// Created by AI.
export function DemandTimeline({ logs }: { logs: DemandLog[] }) {
  const theme = useTheme();

  return (
    <View>
      {logs.map((log, index) => {
        const config = LOG_CONFIG[log.tipo] ?? LOG_CONFIG.mensagem;
        const color = theme[config.tone];
        const isLast = index === logs.length - 1;
        const title = getLogTitle(log);

        return (
          <View key={log.id} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.icon, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Icon color={color} name={config.icon} size={14} />
              </View>
              {!isLast ? (
                <View style={[styles.connector, { backgroundColor: theme.border }]} />
              ) : null}
            </View>

            <View style={[styles.body, !isLast && styles.bodySpaced]}>
              <ThemedText type="smallBold">{title}</ThemedText>
              <View style={styles.meta}>
                <ThemedText themeColor="mutedForeground" type="caption">
                  {log.autor}
                </ThemedText>
                <ThemedText themeColor="mutedForeground" type="caption">
                  •
                </ThemedText>
                <ThemedText themeColor="mutedForeground" type="caption">
                  {formatTimestamp(log.timestamp)}
                </ThemedText>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Created by AI.
function formatTimestamp(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * `timeline_event.descricao` stores the Prisma enum names for status changes
 * (`Em_Andamento`, `Em_An_lise`); show the same labels the rest of the app uses.
 */
// Created by AI.
function humanizeStatuses(text: string): string {
  return text.replace(/Em_An_lise/g, 'Em Análise').replace(/Em_Andamento/g, 'Em Andamento');
}

/**
 * The reference's timeline shows one descriptive line per event. The backend
 * splits that into a generic `titulo` ("Status atualizado") plus a detailed
 * `descricao`, so prefer the description where it carries the actual change.
 */
// Created by AI.
function getLogTitle(log: DemandLog): string {
  if (log.tipo === 'criacao') return 'Chamado aberto pelo cidadão';
  if (log.tipo === 'status') return humanizeStatuses(log.descricao);
  return log.titulo ?? log.descricao;
}

// Created by AI.
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  rail: {
    alignItems: 'center',
    width: 30,
  },
  icon: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  connector: {
    flex: 1,
    marginVertical: 2,
    width: 1,
  },
  body: {
    flex: 1,
    gap: 1,
    paddingTop: 4,
  },
  bodySpaced: {
    paddingBottom: Spacing.four,
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
});
