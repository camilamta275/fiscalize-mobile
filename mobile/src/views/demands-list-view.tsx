import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
    refresh,
    loadMore,
  } = useDemandsListViewModel();
  const { usuario } = useSession();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [searchDraft, setSearchDraft] = useState('');
  const [isFocused, setIsFocused] = useState(true);

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
                  onChangeText={setSearchDraft}
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
              <ScrollView
                contentContainerStyle={styles.chipsRow}
                horizontal
                showsHorizontalScrollIndicator={false}>
                <StatusChip
                  label="Todos"
                  onPress={() => setStatusFilter(null)}
                  selected={statusFilter === null}
                />
                {ALL_STATUSES.map((status) => (
                  <StatusChip
                    key={status}
                    label={STATUS_TONES[status].label}
                    onPress={() => setStatusFilter(statusFilter === status ? null : status)}
                    selected={statusFilter === status}
                  />
                ))}
              </ScrollView>

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
    </View>
  );
}

// Created by AI.
function StatusChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.card,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <ThemedText
        style={{ color: selected ? theme.primaryForeground : theme.textSecondary }}
        type="smallBold">
        {label}
      </ThemedText>
    </Pressable>
  );
}

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
  chipsRow: {
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  chip: {
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
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
