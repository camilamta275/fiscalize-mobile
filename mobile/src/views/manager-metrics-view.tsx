import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Icons } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type {
  AverageResponseTimeResponse,
  DemandsByCategoryRow,
  TotalDemandsResponse,
} from '@/models/metrics';
import * as metricsService from '@/services/metrics-service';

/**
 * View — the Gestor's operational indicators: total demands (with status
 * breakdown), distribution by category and average response time, all from
 * the Gestor-only /metrics endpoints (scoped to the manager's organization).
 */
// Created by AI.
export function ManagerMetricsView() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [total, setTotal] = useState<TotalDemandsResponse | null>(null);
  const [categories, setCategories] = useState<DemandsByCategoryRow[]>([]);
  const [average, setAverage] = useState<AverageResponseTimeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const [totalResult, categoryResult, averageResult] = await Promise.all([
        metricsService.getTotalDemands(),
        metricsService.getDemandsByCategory(),
        metricsService.getAverageResponseTime(),
      ]);
      setTotal(totalResult);
      setCategories(categoryResult.data);
      setAverage(averageResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar os indicadores.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const maxCategory = Math.max(...categories.map((row) => row.total), 1);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
        right={
          <Pressable
            accessibilityLabel="Atualizar indicadores"
            accessibilityRole="button"
            disabled={isRefreshing}
            onPress={() => void load(true)}
            style={({ pressed }) => [styles.reload, { backgroundColor: theme.primarySoft }, pressed && styles.pressed]}>
            <Icon color={theme.primary} name={Icons.refresh} size={18} />
          </Pressable>
        }
        subtitle="Visão operacional do seu órgão"
        title="Indicadores"
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.five }]}
        refreshControl={
          <RefreshControl onRefresh={() => void load(true)} refreshing={isRefreshing} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}>
        {error ? (
          <Card>
            <ThemedText style={{ color: theme.destructive }} type="small">{error}</ThemedText>
          </Card>
        ) : null}
        {isLoading ? <ThemedText themeColor="mutedForeground">Carregando indicadores...</ThemedText> : null}

        {!isLoading && !error && total && average ? (
          <>
            <View style={styles.metrics}>
              <MetricCard label="Total de demandas" value={String(total.total)} />
              <MetricCard
                label="Tempo médio"
                value={average.media_horas === null ? 'N/I' : formatHours(average.media_horas)}
              />
            </View>
            <ThemedText themeColor="mutedForeground" type="caption">
              Tempo médio de atendimento calculado sobre {average.total_demandas_consideradas}{' '}
              {average.total_demandas_consideradas === 1 ? 'demanda resolvida' : 'demandas resolvidas'}.
            </ThemedText>

            <Card style={styles.chartCard}>
              <ThemedText type="subtitle">Demandas por status</ThemedText>
              <StatusRow label="Abertas" value={total.aberta} max={total.total} />
              <StatusRow label="Em andamento" value={total.em_andamento} max={total.total} />
              <StatusRow label="Resolvidas" value={total.resolvida} max={total.total} />
              <StatusRow label="Encerradas" value={total.encerrada} max={total.total} />
            </Card>

            <Card style={styles.chartCard}>
              <ThemedText type="subtitle">Distribuição por categoria</ThemedText>
              {categories.length === 0 ? (
                <ThemedText themeColor="mutedForeground" type="small">Sem dados de categoria.</ThemedText>
              ) : null}
              {categories.map((row) => (
                <View key={row.category} style={styles.barRow}>
                  <ThemedText numberOfLines={1} style={styles.barLabel} type="caption">{row.category}</ThemedText>
                  <View style={[styles.barTrack, { backgroundColor: theme.backgroundElement }]}>
                    <View
                      style={[styles.bar, { backgroundColor: theme.primary, width: `${(row.total / maxCategory) * 100}%` }]}
                    />
                  </View>
                  <ThemedText style={styles.barValue} type="caption">
                    {row.total} ({row.percentage.toFixed(1)}%)
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
function formatHours(hours: number): string {
  if (hours >= 48) return `${(hours / 24).toFixed(1)} dias`;
  return `${hours.toFixed(1)} h`;
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
function StatusRow({ label, value, max }: { label: string; value: number; max: number }) {
  const theme = useTheme();
  return (
    <View style={styles.barRow}>
      <ThemedText numberOfLines={1} style={styles.barLabel} type="caption">{label}</ThemedText>
      <View style={[styles.barTrack, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.bar, { backgroundColor: theme.primary, width: `${max ? (value / max) * 100 : 0}%` }]} />
      </View>
      <ThemedText style={styles.barValue} type="caption">{value}</ThemedText>
    </View>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { gap: Spacing.three, padding: Spacing.three },
  reload: { alignItems: 'center', borderRadius: Radius.pill, height: 36, justifyContent: 'center', width: 36 },
  pressed: { opacity: 0.7 },
  metrics: { flexDirection: 'row', gap: Spacing.two },
  metricCard: { flex: 1, gap: Spacing.one, minHeight: 94 },
  chartCard: { gap: Spacing.three },
  barRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two },
  barLabel: { width: 96 },
  barTrack: { borderRadius: Radius.pill, flex: 1, height: 12, overflow: 'hidden' },
  bar: { borderRadius: Radius.pill, height: '100%' },
  barValue: { minWidth: 64, textAlign: 'right' },
});
