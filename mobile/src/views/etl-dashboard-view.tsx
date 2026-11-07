import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import type { EtlDashboardRow } from '@/models/etl-dashboard';
import { getPopulation } from '@/services/etl-dashboard-service';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Icons } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Created by AI.
export function EtlDashboardView() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<EtlDashboardRow[]>([]);
  const [selectedBairro, setSelectedBairro] = useState('Todos');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const response = await getPopulation();
      setRows(response.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar o dashboard.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboard();
  }, [loadDashboard]);

  const bairros = useMemo(
    () => ['Todos', ...rows.map((row) => row.bairro).filter((bairro): bairro is string => Boolean(bairro))],
    [rows],
  );
  const filteredRows = useMemo(
    () => selectedBairro === 'Todos' ? rows : rows.filter((row) => row.bairro === selectedBairro),
    [rows, selectedBairro],
  );
  const totalChamados = filteredRows.reduce((total, row) => total + row.chamados, 0);
  const totalPopulacao = filteredRows.reduce((total, row) => total + (row.populacao ?? 0), 0);
  const mediaPorMil = filteredRows.length
    ? filteredRows.reduce((total, row) => total + (row.chamados_por_1000 ?? 0), 0) / filteredRows.length
    : null;
  const maxChamados = Math.max(...filteredRows.map((row) => row.chamados), 1);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
        right={
          <Pressable
            accessibilityLabel="Atualizar dashboard"
            accessibilityRole="button"
            disabled={isRefreshing}
            onPress={() => void loadDashboard(true)}
            style={({ pressed }) => [styles.reload, { backgroundColor: theme.primarySoft }, pressed && styles.pressed]}>
            <Icon color={theme.primary} name={Icons.refresh} size={18} />
          </Pressable>
        }
        subtitle="Engenharia de Dados e Big Data"
        title="Dashboard ETL"
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.five }]}
        refreshControl={<RefreshControl onRefresh={() => void loadDashboard(true)} refreshing={isRefreshing} tintColor={theme.primary} />}
        showsVerticalScrollIndicator={false}>
        {error ? (
          <Card>
            <ThemedText style={{ color: theme.destructive }} type="small">{error}</ThemedText>
          </Card>
        ) : null}
        {isLoading ? <ThemedText themeColor="mutedForeground">Carregando dados do Neon...</ThemedText> : null}
        {!isLoading && !error ? (
          <>
            <Card style={styles.filterCard}>
              <ThemedText type="smallBold">Filtrar por bairro</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {bairros.map((bairro) => (
                  <Pressable
                    accessibilityRole="button"
                    key={bairro}
                    onPress={() => setSelectedBairro(bairro)}
                    style={[
                      styles.chip,
                      { backgroundColor: selectedBairro === bairro ? theme.primary : theme.backgroundElement },
                    ]}>
                    <ThemedText style={{ color: selectedBairro === bairro ? theme.primaryForeground : theme.text }} type="caption">
                      {bairro}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </Card>
            <View style={styles.metrics}>
              <MetricCard label="Total de chamados" value={String(totalChamados)} />
              <MetricCard label="População" value={totalPopulacao ? totalPopulacao.toLocaleString('pt-BR') : 'N/I'} />
              <MetricCard label="Média / 1.000 hab." value={mediaPorMil === null ? 'N/I' : mediaPorMil.toFixed(2)} />
            </View>
            <Card style={styles.chartCard}>
              <ThemedText type="subtitle">Chamados por bairro</ThemedText>
              {filteredRows.map((row) => (
                <View key={row.bairro ?? 'sem-bairro'} style={styles.barRow}>
                  <ThemedText numberOfLines={1} style={styles.barLabel} type="caption">{row.bairro ?? 'Não informado'}</ThemedText>
                  <View style={[styles.barTrack, { backgroundColor: theme.backgroundElement }]}>
                    <View style={[styles.bar, { backgroundColor: theme.primary, width: `${(row.chamados / maxChamados) * 100}%` }]} />
                  </View>
                  <ThemedText style={styles.barValue} type="caption">{row.chamados}</ThemedText>
                </View>
              ))}
            </Card>
            <Card style={styles.tableCard}>
              <ThemedText type="subtitle">Dados da tabela final</ThemedText>
              {filteredRows.map((row) => (
                <View key={`data-${row.bairro ?? 'sem-bairro'}`} style={[styles.dataRow, { borderBottomColor: theme.border }]}>
                  <ThemedText style={styles.dataName} type="smallBold">{row.bairro ?? 'Não informado'}</ThemedText>
                  <ThemedText themeColor="mutedForeground" type="caption">
                    {row.chamados} chamados · {row.chamados_por_1000?.toFixed(2) ?? 'N/I'} / 1.000
                  </ThemedText>
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

// Created by AI.
function MetricCard({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <Card style={styles.metricCard}>
      <ThemedText themeColor="mutedForeground" type="caption">{label}</ThemedText>
      <ThemedText style={{ color: theme.primary }} type="heading">{value}</ThemedText>
    </Card>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { gap: Spacing.three, padding: Spacing.three },
  reload: { alignItems: 'center', borderRadius: Radius.pill, height: 36, justifyContent: 'center', width: 36 },
  pressed: { opacity: 0.7 },
  filterCard: { gap: Spacing.two },
  chips: { gap: Spacing.two },
  chip: { borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  metrics: { flexDirection: 'row', gap: Spacing.two },
  metricCard: { flex: 1, gap: Spacing.one, minHeight: 94 },
  chartCard: { gap: Spacing.three },
  barRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  barLabel: { width: 84 },
  barTrack: { borderRadius: Radius.pill, flex: 1, height: 12, overflow: 'hidden' },
  bar: { borderRadius: Radius.pill, height: '100%' },
  barValue: { textAlign: 'right', width: 24 },
  tableCard: { gap: Spacing.two },
  dataRow: { borderBottomWidth: 1, gap: Spacing.one, paddingBottom: Spacing.two },
  dataName: { flex: 1 },
});
