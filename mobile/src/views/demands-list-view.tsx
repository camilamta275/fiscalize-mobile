import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Demand, DemandStatus } from '@/models/demand';
import { useDemandsListViewModel } from '@/viewmodels/use-demands-list-view-model';

const ALL_STATUSES: DemandStatus[] = [
  'Aberto',
  'Em Análise',
  'Em Andamento',
  'Aguardando',
  'Resolvido',
  'Fechado',
];

/**
 * View — the demands list. Holds no state of its own except the search
 * box's draft text (applied to the ViewModel only on submit, so typing
 * doesn't re-query on every keystroke); everything else comes from the
 * ViewModel.
 */
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
  const theme = useTheme();
  const [searchDraft, setSearchDraft] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.header}>
        <TextInput
          onChangeText={setSearchDraft}
          onSubmitEditing={() => setSearch(searchDraft)}
          placeholder="Buscar por endereço..."
          placeholderTextColor={theme.textSecondary}
          returnKeyType="search"
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
          value={searchDraft}
        />

        <FlatList
          contentContainerStyle={styles.chipsRow}
          data={ALL_STATUSES}
          horizontal
          keyExtractor={(status) => status}
          renderItem={({ item: status }) => {
            const selected = statusFilter === status;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setStatusFilter(selected ? null : status)}
                style={[
                  styles.chip,
                  { backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement },
                ]}>
                <ThemedText type="small">{status}</ThemedText>
              </Pressable>
            );
          }}
          showsHorizontalScrollIndicator={false}
        />
      </ThemedView>

      {error ? (
        <ThemedText style={styles.feedback} themeColor="textSecondary">
          {error}
        </ThemedText>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={theme.text} style={styles.feedback} />
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={demands}
          ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <ThemedText style={styles.feedback} themeColor="textSecondary">
              Nenhuma ocorrência encontrada.
            </ThemedText>
          }
          ListFooterComponent={
            isLoadingMore ? <ActivityIndicator color={theme.text} style={styles.feedback} /> : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl onRefresh={refresh} refreshing={isRefreshing} tintColor={theme.text} />
          }
          renderItem={({ item }) => <DemandListItem demand={item} />}
        />
      )}

      <Link href="/new" asChild>
        <Pressable
          accessibilityRole="button"
          style={StyleSheet.flatten([styles.fab, { backgroundColor: theme.backgroundSelected }])}>
          <ThemedText type="smallBold">+ Nova</ThemedText>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}

function DemandListItem({ demand }: { demand: Demand }) {
  return (
    <Link href={{ pathname: '/[id]', params: { id: demand.id } }} asChild>
      <Pressable accessibilityRole="button">
        <ThemedView style={styles.card} type="backgroundElement">
          <ThemedView style={styles.cardTopRow} type="backgroundElement">
            <ThemedText type="smallBold">{demand.protocolo}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {demand.status}
            </ThemedText>
          </ThemedView>
          <ThemedText numberOfLines={1} type="default">
            {demand.title}
          </ThemedText>
          <ThemedText numberOfLines={2} themeColor="textSecondary" type="small">
            {demand.location}
          </ThemedText>
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  input: {
    borderRadius: Spacing.two,
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipsRow: {
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  feedback: {
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  listContent: {
    paddingBottom: Spacing.six,
    paddingHorizontal: Spacing.three,
  },
  separator: {
    height: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    gap: Spacing.one,
    padding: Spacing.three,
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fab: {
    alignItems: 'center',
    borderRadius: Spacing.five,
    bottom: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    position: 'absolute',
    right: Spacing.four,
  },
});
