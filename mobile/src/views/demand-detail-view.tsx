import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryEmoji } from '@/components/category-emoji';
import { DemandTimeline } from '@/components/demand-timeline';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { InlineMessage } from '@/components/ui/inline-message';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { ScreenHeader } from '@/components/ui/screen-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Icons, type IconName } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  BLOCKED_EDIT_STATUSES,
  DEMAND_STATUS_PROGRESS,
  type DemandDetail,
  type DemandLog,
} from '@/models/demand';
import { useDemandDetailViewModel } from '@/viewmodels/use-demand-detail-view-model';

// Created by AI.
const PROGRESS_STEPS = ['Aberto', 'Análise', 'Execução', 'Resolvido'] as const;

// Created by AI.
const HOUR_MS = 60 * 60 * 1000;

// Created by AI.
const DAY_MS = 24 * HOUR_MS;

/**
 * View — the demand detail screen, ported from the reference's `TicketDetail`:
 * a bordered header with protocol/category/status, the photo slot, the info
 * card (description, location, date, org, priority), the SLA banner, the
 * four-step progress bar and the timeline.
 */
// Created by AI.
export function DemandDetailView({ demandId }: { demandId: string }) {
  const { demand, isLoading, error, reload } = useDemandDetailViewModel(demandId);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader onBack={goBack} title="Ocorrência" />
        <ActivityIndicator color={theme.primary} style={styles.loading} />
      </View>
    );
  }

  if (error || !demand) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader onBack={goBack} title="Ocorrência" />
        <View style={styles.stateContainer}>
          <InlineMessage message={error ?? 'Ocorrência não encontrada.'} />
          <Button onPress={reload} title="Tentar novamente" variant="secondary" />
        </View>
      </View>
    );
  }

  const isFinished = demand.status === 'Resolvido' || demand.status === 'Fechado';
  const canEdit = !BLOCKED_EDIT_STATUSES.includes(demand.status);
  const progress = DEMAND_STATUS_PROGRESS[demand.status];
  const sla = getSlaInfo(demand);
  const progressColor = isFinished
    ? theme.statusDone
    : sla?.expired
      ? theme.statusCritical
      : theme.primary;
  const logs = buildLogs(demand);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader
        onBack={goBack}
        right={<StatusBadge status={demand.status} />}
        subtitle={demand.category.nome}
        title={demand.protocolo}
        titleType="subtitle"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + Spacing.five },
        ]}
        showsVerticalScrollIndicator={false}>
        {demand.photoUrl ? (
          <Image contentFit="cover" source={{ uri: demand.photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.photoPlaceholderIcon}>
              <Icon color={theme.mutedForeground} name={Icons.image} size={40} />
            </View>
          </View>
        )}

        <Card style={styles.infoCard}>
          <View style={styles.infoTop}>
            <CategoryEmoji name={demand.category.nome} size={26} />
            <View style={styles.infoText}>
              <ThemedText type="subtitle">{demand.category.nome}</ThemedText>
              <ThemedText themeColor="textSecondary" type="small">
                {demand.description}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.metaGrid}>
            <MetaItem icon={Icons.mapPin} text={demand.location} />
            <MetaItem icon={Icons.clock} text={formatDate(demand.createdAt)} />
            <MetaItem icon={Icons.building} text={demand.assignedOrg?.nome ?? 'A definir'} />
            <View style={styles.metaItem}>
              {demand.priority ? <PriorityBadge priority={demand.priority} /> : null}
            </View>
          </View>
        </Card>

        {!isFinished && sla ? (
          <View
            style={[
              styles.sla,
              {
                backgroundColor: sla.expired ? theme.destructiveSoft : theme.statusOpenBg,
              },
            ]}>
            <View style={styles.slaLeft}>
              <Icon
                color={sla.expired ? theme.statusCritical : theme.statusOpen}
                name={Icons.clock}
                size={18}
              />
              <ThemedText
                style={{ color: sla.expired ? theme.statusCritical : theme.statusOpen }}
                type="smallBold">
                {sla.expired ? 'Prazo encerrado' : 'Prazo de atendimento'}
              </ThemedText>
            </View>
            <ThemedText
              style={[
                styles.slaValue,
                { color: sla.expired ? theme.statusCritical : theme.statusOpen },
              ]}
              type="smallBold">
              {sla.label}
            </ThemedText>
          </View>
        ) : null}

        {sla?.expired && demand.slaJustification ? (
          <View style={[styles.justification, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText themeColor="mutedForeground" type="small">
              <ThemedText type="smallBold">Motivo do atraso: </ThemedText>
              {demand.slaJustification}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.progress}>
          <View style={styles.progressLabels}>
            {PROGRESS_STEPS.map((step) => (
              <ThemedText key={step} themeColor="mutedForeground" type="caption">
                {step}
              </ThemedText>
            ))}
          </View>
          <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
            <View
              style={[
                styles.fill,
                { backgroundColor: progressColor, width: `${progress}%` },
              ]}
            />
          </View>
        </View>

        {demand.resolutionNote ? (
          <Card style={styles.resolution}>
            <ThemedText type="subtitle">Resolução</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              {demand.resolutionNote}
            </ThemedText>
            {demand.resolutionPhotoUrl ? (
              <Image
                contentFit="cover"
                source={{ uri: demand.resolutionPhotoUrl }}
                style={styles.resolutionPhoto}
              />
            ) : null}
          </Card>
        ) : null}

        <View style={styles.history}>
          <ThemedText type="subtitle">Histórico</ThemedText>
          <DemandTimeline logs={logs} />
        </View>

        {canEdit ? (
          <Button
            icon={Icons.edit}
            onPress={() =>
              router.push({ pathname: '/[id]/edit', params: { id: demand.id } })
            }
            title="Editar ocorrência"
            variant="secondary"
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

// Created by AI.
function MetaItem({ icon, text }: { icon: IconName; text: string }) {
  const theme = useTheme();

  return (
    <View style={styles.metaItem}>
      <Icon color={theme.mutedForeground} name={icon} size={14} />
      <ThemedText
        numberOfLines={2}
        style={styles.metaText}
        themeColor="mutedForeground"
        type="small">
        {text}
      </ThemedText>
    </View>
  );
}

// Created by AI.
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR');
}

/**
 * Mirrors the reference's `getSlaInfo`: the backend already stores the exact
 * deadline (`sladeadline`), so it is used directly; `slaHours`/`createdAt` are
 * only a fallback for responses from an older backend.
 */
// Created by AI.
function getSlaInfo(demand: DemandDetail): { expired: boolean; label: string } | null {
  const deadline = demand.slaDeadline ? new Date(demand.slaDeadline).getTime() : NaN;
  const created = new Date(demand.createdAt).getTime();

  if (Number.isNaN(deadline) && (demand.slaHours === undefined || Number.isNaN(created))) {
    return null;
  }

  const target = Number.isNaN(deadline) ? created + (demand.slaHours ?? 0) * HOUR_MS : deadline;
  const remaining = target - Date.now();
  const expired = remaining <= 0;
  const elapsed = Math.abs(remaining);

  if (expired) {
    return {
      expired,
      label:
        elapsed < DAY_MS
          ? `Prazo encerrado há ${Math.ceil(elapsed / HOUR_MS)}h`
          : `Prazo encerrado há ${Math.ceil(elapsed / DAY_MS)} dia(s)`,
    };
  }

  return {
    expired,
    label:
      remaining < DAY_MS
        ? `Resposta esperada em ${Math.ceil(remaining / HOUR_MS)}h`
        : `Resposta esperada em ${Math.ceil(remaining / DAY_MS)} dia(s)`,
  };
}

/**
 * `timeline_event` is created on every create/update/status change, but a very
 * old row may have none — fall back to the two timestamps the demand always
 * carries so the section is never empty.
 */
// Created by AI.
function buildLogs(demand: DemandDetail): DemandLog[] {
  if (demand.logs && demand.logs.length > 0) return demand.logs;

  const logs: DemandLog[] = [
    {
      id: 'created',
      tipo: 'criacao',
      titulo: 'Chamado aberto pelo cidadão',
      descricao: 'Chamado aberto pelo cidadão',
      autor: demand.creator.nome,
      timestamp: demand.createdAt,
    },
  ];

  if (demand.updatedAt !== demand.createdAt) {
    logs.push({
      id: 'updated',
      tipo: 'status',
      titulo: 'Ocorrência atualizada',
      descricao: `Status atual: ${demand.status}`,
      autor: 'Sistema',
      timestamp: demand.updatedAt,
    });
  }

  return logs;
}

// Created by AI.
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    marginTop: Spacing.six,
  },
  stateContainer: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  scroll: {
    gap: Spacing.three,
    padding: Spacing.three,
  },
  photo: {
    borderRadius: Radius.xl,
    height: 200,
    width: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    opacity: 0.4,
  },
  infoCard: {
    gap: Spacing.three,
  },
  infoTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  metaItem: {
    alignItems: 'center',
    flexBasis: '46%',
    flexDirection: 'row',
    flexGrow: 1,
    gap: Spacing.one + 2,
    minWidth: 0,
  },
  metaText: {
    flex: 1,
  },
  sla: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  slaLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    flexShrink: 0,
  },
  slaValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  justification: {
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  progress: {
    gap: Spacing.two,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    borderRadius: Radius.pill,
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.pill,
    height: '100%',
  },
  resolution: {
    gap: Spacing.two,
  },
  resolutionPhoto: {
    borderRadius: Radius.md,
    height: 140,
    width: '100%',
  },
  history: {
    gap: Spacing.three,
  },
});
