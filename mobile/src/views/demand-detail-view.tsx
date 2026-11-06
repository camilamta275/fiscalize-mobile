import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DemandOptionsMenu } from '@/components/demand-options-menu';
import { CategoryEmoji } from '@/components/category-emoji';
import { DemandTimeline } from '@/components/demand-timeline';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { InlineMessage } from '@/components/ui/inline-message';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { ScreenHeader } from '@/components/ui/screen-header';
import { STATUS_TONES, StatusBadge } from '@/components/ui/status-badge';
import { Icons, type IconName } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/contexts/session-context';
import { useTheme } from '@/hooks/use-theme';
import {
  BLOCKED_EDIT_STATUSES,
  DEMAND_STATUS_PROGRESS,
  type DemandDetail,
  type DemandLog,
  type DemandStatus,
} from '@/models/demand';
import { isGestor } from '@/models/usuario';
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
// Updated by AI.
export function DemandDetailView({ demandId }: { demandId: string }) {
  const {
    demand,
    isLoading,
    error,
    isDeleting,
    deleteDemand,
    reload,
    isUpdatingStatus,
    statusError,
    updateStatus,
  } = useDemandDetailViewModel(demandId);
  const { usuario } = useSession();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isGestorUser = isGestor(usuario?.perfil);
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  // Created by AI.
  // The store already dropped the demand from its caches, so the tap on
  // "Sim, excluir" lands back on the list — which no longer lists it.
  const handleDelete = useCallback(async () => {
    await deleteDemand();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [deleteDemand]);

  // Created by AI.
  // Same pattern as the delete confirmation: an API failure keeps the modal
  // open with the ViewModel's `statusError` shown inside it.
  const handleStatusConfirm = useCallback(
    async (status: DemandStatus) => {
      try {
        await updateStatus(status);
        setIsStatusPickerOpen(false);
      } catch {
        // `statusError` was already set by the ViewModel.
      }
    },
    [updateStatus]
  );

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
        right={
          // Created by AI.
          <View style={styles.headerRight}>
            <StatusBadge status={demand.status} />
            <DemandOptionsMenu deleteRequest={handleDelete} isDeleting={isDeleting} />
          </View>
        }
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

        {canEdit && !isGestorUser ? (
          <Button
            icon={Icons.edit}
            onPress={() =>
              router.push({ pathname: '/[id]/edit', params: { id: demand.id } })
            }
            title="Editar ocorrência"
            variant="secondary"
          />
        ) : null}

        {isGestorUser ? (
          // Created by AI.
          // Gestor can't edit the demand's content (PUT is Cidadao-only —
          // it would be a 403) but drives the lifecycle via
          // PATCH /demands/:id/status: one button here opens the picker.
          <Button
            icon={Icons.refresh}
            onPress={() => setIsStatusPickerOpen(true)}
            title="Atualizar status"
            variant="secondary"
          />
        ) : null}
      </ScrollView>

      {isStatusPickerOpen ? (
        // Created by AI.
        // Local copy of the list's FilterModal with its own draft selection,
        // footer buttons and inline error slot.
        <StatusPickerModal
          current={demand.status}
          error={statusError}
          isUpdating={isUpdatingStatus}
          onCancel={() => setIsStatusPickerOpen(false)}
          onConfirm={handleStatusConfirm}
        />
      ) : null}
    </View>
  );
}

// Created by AI.
// Copied from the list's `FilterModal` (views/demands-list-view.tsx) with its
// own names, plus the pieces the plan requires: a draft pre-selected with the
// demand's current status, a Cancel/Atualizar footer and an inline error slot
// that keeps the modal open on failure.
function StatusPickerModal({
  current,
  error,
  isUpdating,
  onCancel,
  onConfirm,
}: {
  current: DemandStatus;
  error: string | null;
  isUpdating: boolean;
  onCancel: () => void;
  onConfirm: (status: DemandStatus) => void;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState<DemandStatus>(current);
  const statusOptions = Object.keys(STATUS_TONES) as DemandStatus[];

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible>
      <Pressable onPress={onCancel} style={styles.modalBackdrop}>
        <View
          onStartShouldSetResponder={() => true}
          style={[styles.modalCard, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">Atualizar status</ThemedText>
            <Pressable accessibilityLabel="Fechar seletor" onPress={onCancel}>
              <Icon color={theme.mutedForeground} name={Icons.close} size={20} />
            </Pressable>
          </View>
          {statusOptions.map((status) => (
            <Pressable
              accessibilityLabel={`Status ${STATUS_TONES[status].label}`}
              accessibilityRole="button"
              key={status}
              onPress={() => setDraft(status)}
              style={[styles.option, draft === status && { backgroundColor: theme.primarySoft }]}>
              <ThemedText type={draft === status ? 'smallBold' : 'default'}>
                {STATUS_TONES[status].label}
              </ThemedText>
              {draft === status ? <Icon color={theme.primary} name={Icons.check} size={18} /> : null}
            </Pressable>
          ))}
          {error ? <InlineMessage message={error} /> : null}
          <View style={styles.modalFooter}>
            <Button
              onPress={onCancel}
              style={styles.modalButton}
              title="Cancelar"
              variant="secondary"
            />
            <Button
              loading={isUpdating}
              onPress={() => onConfirm(draft)}
              style={styles.modalButton}
              title="Atualizar"
              variant="primary"
            />
          </View>
        </View>
      </Pressable>
    </Modal>
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

// Updated by AI.
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  // Created by AI.
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
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
  // Created by AI.
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    borderRadius: Radius.lg,
    gap: Spacing.one,
    maxWidth: 440,
    padding: Spacing.three,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.two,
  },
  option: {
    alignItems: 'center',
    borderRadius: Radius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: Spacing.two,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalButton: {
    flex: 1,
  },
});
