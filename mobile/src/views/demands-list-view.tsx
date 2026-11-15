import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DemandCard } from '@/components/demand-card';
import { ProfileButton } from '@/components/profile-button';
import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { GradientView } from '@/components/ui/gradient-view';
import { Icon } from '@/components/ui/icon';
import { InlineMessage } from '@/components/ui/inline-message';
import { StatTile } from '@/components/ui/stat-tile';
import { STATUS_TONES } from '@/components/ui/status-badge';
import { Icons } from '@/constants/icons';
import { Gradients, Radius, Shadows, Spacing } from '@/constants/theme';
import { useSession } from '@/contexts/session-context';
import { useTheme } from '@/hooks/use-theme';
import type { DemandStatus } from '@/models/demand';
import { isGestor } from '@/models/usuario';
import { useDemandsListViewModel } from '@/viewmodels/use-demands-list-view-model';

// Created by AI.
const ALL_STATUSES: DemandStatus[] = [
  'Aberto',
  'Em Análise',
  'Em Andamento',
  'Aguardando',
  'Resolvido',
  'Fechado',
];

// Created by AI.
const SUMMARY_STATUSES: DemandStatus[] = ['Aberto', 'Em Análise', 'Em Andamento'];

/**
 * View — the demands list, laid out like the reference's citizen dashboard:
 * gradient header with greeting and search, status chips and summary counts
 * on an overlapping sheet, then the ticket cards and a floating action button.
 */
// Updated by AI.
export function DemandsListView() {
  const {
    demands,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    setSearch,
    statusFilter,
    setStatusFilter,
    orgaoFilter,
    setOrgaoFilter,
    categoryFilter,
    setCategoryFilter,
    categories,
    sortBy,
    setSortBy,
    organizations,
    refresh,
    loadMore,
  } = useDemandsListViewModel();
  const { usuario } = useSession();
  const isGestorUser = isGestor(usuario?.perfil);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [searchDraft, setSearchDraft] = useState('');
  const [isFocused, setIsFocused] = useState(true);
  const [openFilter, setOpenFilter] = useState<'status' | 'orgao' | 'categoria' | 'sort' | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  const firstName = usuario?.nome.trim().split(' ')[0] ?? '';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={isFocused ? 'light' : 'dark'} />

      <FlatList
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
        data={demands}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={theme.primary} style={styles.loading} />
          ) : (
            <EmptyState
              description="Assim que você registrar uma ocorrência, ela aparece aqui."
              icon={Icons.document}
              title="Nenhuma ocorrência encontrada"
            />
          )
        }
        ListFooterComponent={
          isLoadingMore ? <ActivityIndicator color={theme.primary} style={styles.loading} /> : null
        }
        ListHeaderComponent={
          <>
            <GradientView
              colors={Gradients.hero}
              style={[styles.hero, { paddingTop: insets.top + Spacing.two }]}>
              <View style={styles.heroTop}>
                <View style={styles.greeting}>
                  <ThemedText style={styles.greetingText} type="small">
                    {firstName ? `Olá, ${firstName} 👋` : 'Olá 👋'}
                  </ThemedText>
                  <ThemedText style={styles.heroTitle} type="title">
                    Meus Chamados
                  </ThemedText>
                </View>
                <ProfileButton onGradient />
              </View>

              <View style={[styles.search, { backgroundColor: theme.card }]}>
                <Icon color={theme.mutedForeground} name={Icons.search} size={16} />
                <TextInput
                  onChangeText={(value) => {
                    setSearchDraft(value);
                    setSearch(value);
                  }}
                  onSubmitEditing={() => setSearch(searchDraft)}
                  placeholder="Buscar por endereço..."
                  placeholderTextColor={theme.mutedForeground}
                  returnKeyType="search"
                  style={[styles.searchInput, { color: theme.text }]}
                  value={searchDraft}
                />
                {searchDraft.length > 0 ? (
                  <Pressable
                    accessibilityLabel="Limpar busca"
                    accessibilityRole="button"
                    hitSlop={Spacing.two}
                    onPress={() => {
                      setSearchDraft('');
                      setSearch('');
                    }}>
                    <Icon color={theme.mutedForeground} name={Icons.close} size={16} />
                  </Pressable>
                ) : null}
              </View>
            </GradientView>

            <View style={[styles.sheet, { backgroundColor: theme.background }]}>
              <FilterSelect
                label={statusFilter ?? 'Todos os status'}
                onPress={() => setOpenFilter('status')}
              />
              <FilterSelect
                label={
                  categoryFilter !== null
                    ? categories.find((category) => category.id === categoryFilter)?.nome ??
                      'Categoria selecionada'
                    : 'Todas as categorias'
                }
                onPress={() => setOpenFilter('categoria')}
              />
              <View style={styles.filterRow}>
                <View style={styles.orgFilter}>
                  <FilterSelect
                    label={
                      orgaoFilter
                        ? organizations.find((organization) => organization.id === orgaoFilter)?.sigla ??
                          'Órgão selecionado'
                        : 'Todos os órgãos'
                    }
                    onPress={() => setOpenFilter('orgao')}
                  />
                </View>
                <View style={styles.sortFilter}>
                  <FilterSelect
                    label={SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? 'Mais recentes'}
                    onPress={() => setOpenFilter('sort')}
                    showSortIcon
                  />
                </View>
              </View>

              <View style={styles.statsRow}>
                {SUMMARY_STATUSES.map((status) => {
                  const tone = STATUS_TONES[status];
                  return (
                    <StatTile
                      key={status}
                      label={tone.label}
                      tone={{ background: tone.background, foreground: tone.foreground }}
                      value={demands.filter((demand) => demand.status === status).length}
                    />
                  );
                })}
              </View>

              <View style={styles.sectionRow}>
                <ThemedText type="subtitle">Ocorrências</ThemedText>
                <ThemedText themeColor="mutedForeground" type="caption">
                  {demands.length} {demands.length === 1 ? 'registro' : 'registros'}
                </ThemedText>
              </View>

              {error ? <InlineMessage message={error} /> : null}
            </View>
          </>
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            colors={[theme.primary]}
            onRefresh={refresh}
            refreshing={isRefreshing}
            tintColor={theme.primary}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrap}>
            <DemandCard demand={item} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      {/* Created by AI. POST /demands is Cidadao-only — a Gestor would score a
          403 on it, so the FAB is hidden behind the profile guard. */}
      {!isGestorUser ? (
        <Pressable
          accessibilityLabel="Registrar nova ocorrência"
          accessibilityRole="button"
          onPress={() => router.push('/new')}
          style={({ pressed }) => [
            styles.fab,
            Shadows.floating,
            {
              backgroundColor: theme.primary,
              bottom: insets.bottom + Spacing.four,
              shadowColor: theme.shadow,
            },
            pressed && styles.pressed,
          ]}>
          <Icon color={theme.primaryForeground} name={Icons.plus} size={26} />
        </Pressable>
      ) : null}

      <FilterModal
        options={[
          { label: 'Todos os status', value: null },
          ...ALL_STATUSES.map((status) => ({ label: STATUS_TONES[status].label, value: status })),
        ]}
        onClose={() => setOpenFilter(null)}
        onSelect={(value) => {
          setStatusFilter(value as DemandStatus | null);
          setOpenFilter(null);
        }}
        title="Filtrar por status"
        value={statusFilter}
        visible={openFilter === 'status'}
      />
      <FilterModal
        options={[
          { label: 'Todos os órgãos', value: null },
          ...organizations.map((organization) => ({
            label: `${organization.sigla} - ${organization.nome}`,
            value: organization.id,
          })),
        ]}
        onClose={() => setOpenFilter(null)}
        onSelect={(value) => {
          setOrgaoFilter(value);
          setOpenFilter(null);
        }}
        title="Filtrar por órgão"
        value={orgaoFilter}
        visible={openFilter === 'orgao'}
      />
      <FilterModal
        options={[
          { label: 'Todas as categorias', value: null },
          ...categories.map((category) => ({ label: category.nome, value: String(category.id) })),
        ]}
        onClose={() => setOpenFilter(null)}
        onSelect={(value) => {
          setCategoryFilter(value === null ? null : Number(value));
          setOpenFilter(null);
        }}
        title="Filtrar por categoria"
        value={categoryFilter === null ? null : String(categoryFilter)}
        visible={openFilter === 'categoria'}
      />
      <FilterModal
        options={SORT_OPTIONS}
        onClose={() => setOpenFilter(null)}
        onSelect={(value) => {
          setSortBy(value as 'recent' | 'oldest' | 'priority' | 'sla');
          setOpenFilter(null);
        }}
        title="Ordenar ocorrências"
        value={sortBy}
        visible={openFilter === 'sort'}
      />
    </View>
  );
}

// Created by AI.
function FilterSelect({ label, onPress, showSortIcon = false }: { label: string; onPress: () => void; showSortIcon?: boolean }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.filterSelect, { borderColor: theme.border }, pressed && styles.pressed]}>
      <ThemedText style={styles.filterLabel} type="default">{label}</ThemedText>
      <Icon color={theme.mutedForeground} name={showSortIcon ? Icons.refresh : Icons.chevronDown} size={18} />
    </Pressable>
  );
}

// Created by AI.
function FilterModal({
  options,
  onClose,
  onSelect,
  title,
  value,
  visible,
}: {
  options: readonly { label: string; value: string | DemandStatus | null }[];
  onClose: () => void;
  onSelect: (value: string | DemandStatus | null) => void;
  title: string;
  value: string | DemandStatus | null;
  visible: boolean;
}) {
  const theme = useTheme();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <Pressable onPress={() => undefined} style={[styles.modalCard, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <ThemedText type="subtitle">{title}</ThemedText>
            <Pressable accessibilityLabel="Fechar filtro" onPress={onClose}>
              <Icon color={theme.mutedForeground} name={Icons.close} size={20} />
            </Pressable>
          </View>
          {options.map((option) => (
            <Pressable
              key={option.label}
              onPress={() => onSelect(option.value)}
              style={[styles.option, option.value === value && { backgroundColor: theme.primarySoft }]}>
              <ThemedText type={option.value === value ? 'smallBold' : 'default'}>{option.label}</ThemedText>
              {option.value === value ? <Icon color={theme.primary} name={Icons.check} size={18} /> : null}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Created by AI.
const SORT_OPTIONS = [
  { label: 'Mais recentes', value: 'recent' },
  { label: 'Mais antigos', value: 'oldest' },
  { label: 'Por prazo', value: 'sla' },
  { label: 'Por prioridade', value: 'priority' },
] as const;

// Updated by AI.
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  hero: {
    gap: Spacing.three,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.three,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  greeting: {
    gap: 2,
  },
  greetingText: {
    color: 'rgba(255,255,255,0.82)',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
  },
  search: {
    alignItems: 'center',
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    gap: Spacing.three,
    marginTop: -Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  orgFilter: {
    flex: 1,
  },
  sortFilter: {
    width: 150,
  },
  filterSelect: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: Spacing.three,
  },
  filterLabel: {
    flexShrink: 1,
  },
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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  sectionRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  separator: {
    height: Spacing.two,
  },
  cardWrap: {
    paddingHorizontal: Spacing.three,
  },
  loading: {
    marginVertical: Spacing.five,
  },
  fab: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.four,
    width: 56,
  },
  pressed: {
    opacity: 0.8,
  },
});
