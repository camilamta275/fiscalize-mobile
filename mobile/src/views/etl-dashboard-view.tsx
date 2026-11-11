import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import type { EtlClimateRow, EtlDashboardRow } from '@/models/etl-dashboard';
import { getClimate, getPopulation } from '@/services/etl-dashboard-service';
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
  const [climate, setClimate] = useState<EtlClimateRow[]>([]);
  const [climateError, setClimateError] = useState<string | null>(null);
  const [selectedBairro, setSelectedBairro] = useState('Todos');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    setClimateError(null);
    try {
      const [response, climateResult] = await Promise.all([
        getPopulation(),
        getClimate().catch((caught: unknown) => caught instanceof Error ? caught : new Error('Não foi possível carregar o clima.')),
      ]);
      setRows(response.data);
      if (climateResult instanceof Error) {
        setClimate([]);
        setClimateError(climateResult.message);
      } else {
        setClimate(climateResult.data);
      }
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
              <Pressable
                accessibilityLabel="Filtrar por bairro"
                accessibilityRole="button"
                onPress={() => setIsFilterOpen(true)}
                style={({ pressed }) => [styles.filterSelect, { borderColor: theme.border }, pressed && styles.pressed]}>
                <ThemedText style={styles.filterLabel} type="default">{selectedBairro === 'Todos' ? 'Todos os bairros' : selectedBairro}</ThemedText>
                <Icon color={theme.mutedForeground} name={Icons.chevronDown} size={18} />
              </Pressable>
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
            <Card style={styles.chartCard}>
              <ThemedText type="subtitle">Clima x chamados por dia</ThemedText>
              <ThemedText themeColor="mutedForeground" type="caption">
                Série diária da Open-Meteo para o Recife. O filtro de bairro não se aplica ao clima.
              </ThemedText>
              {climateError ? <ThemedText style={{ color: theme.destructive }} type="small">{climateError}</ThemedText> : null}
              {!climateError && climate.length === 0 ? (
                <ThemedText themeColor="mutedForeground" type="small">Ainda não há dados de clima. Execute o ETL para gerá-los.</ThemedText>
              ) : null}
              {climate.length > 0 ? (
                <>
                  <View style={styles.metrics}>
                    <MetricCard label="Chamados" value={String(climate.reduce((total, row) => total + row.chamados, 0))} />
                    <MetricCard label="Chuva acum." value={`${sum(climate.map((row) => row.precipitacao)).toFixed(1)} mm`} />
                    <MetricCard label="Temp. média" value={formatAverage(climate.map((row) => row.temperatura), ' °C')} />
                  </View>
                  <ThemedText type="smallBold">Chamados x precipitação diária</ThemedText>
                  <ClimateChart color={CLIMATE_RAIN_COLOR} field="precipitacao" rows={climate} unit="mm" />
                  <ThemedText type="smallBold">Chamados x temperatura média diária</ThemedText>
                  <ClimateChart color={CLIMATE_TEMPERATURE_COLOR} field="temperatura" rows={climate} unit="°C" />
                </>
              ) : null}
            </Card>
            {climate.length > 0 ? (
              <Card style={styles.tableCard}>
                <ThemedText type="subtitle">Dados diários de clima e chamados</ThemedText>
                {[...climate].reverse().map((row) => (
                  <View key={`clima-${row.data}`} style={[styles.dataRow, { borderBottomColor: theme.border }]}>
                    <ThemedText style={styles.dataName} type="smallBold">{formatDate(row.data)}</ThemedText>
                    <ThemedText themeColor="mutedForeground" type="caption">
                      {row.chamados} chamados · {row.temperatura?.toFixed(1) ?? 'N/I'} °C · {row.precipitacao?.toFixed(1) ?? 'N/I'} mm
                    </ThemedText>
                  </View>
                ))}
              </Card>
            ) : null}
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
      <Modal animationType="fade" transparent visible={isFilterOpen} onRequestClose={() => setIsFilterOpen(false)}>
        <Pressable onPress={() => setIsFilterOpen(false)} style={styles.modalBackdrop}>
          <Pressable onPress={() => undefined} style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">Filtrar por bairro</ThemedText>
              <Pressable accessibilityLabel="Fechar filtro" onPress={() => setIsFilterOpen(false)}>
                <Icon color={theme.mutedForeground} name={Icons.close} size={20} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {bairros.map((bairro) => (
                <Pressable
                  key={bairro}
                  onPress={() => {
                    setSelectedBairro(bairro);
                    setIsFilterOpen(false);
                  }}
                  style={[styles.option, bairro === selectedBairro && { backgroundColor: theme.primarySoft }]}>
                  <ThemedText type={bairro === selectedBairro ? 'smallBold' : 'default'}>{bairro === 'Todos' ? 'Todos os bairros' : bairro}</ThemedText>
                  {bairro === selectedBairro ? <Icon color={theme.primary} name={Icons.check} size={18} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Created by AI.
const CLIMATE_RAIN_COLOR = '#4C9BE8';
const CLIMATE_TEMPERATURE_COLOR = '#E8844C';
const CHART_HEIGHT = 140;

// Created by AI.
function sum(values: (number | null)[]) {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

// Created by AI.
function formatAverage(values: (number | null)[], suffix: string) {
  const valid = values.filter((value): value is number => value !== null);
  return valid.length ? `${(sum(valid) / valid.length).toFixed(1)}${suffix}` : 'N/I';
}

// Created by AI.
function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

// Created by AI.
function ClimateChart({
  color,
  field,
  rows,
  unit,
}: {
  color: string;
  field: 'temperatura' | 'precipitacao';
  rows: EtlClimateRow[];
  unit: string;
}) {
  const theme = useTheme();
  const maxChamados = Math.max(...rows.map((row) => row.chamados), 1);
  const maxClimate = Math.max(...rows.map((row) => row[field] ?? 0), 1);

  return (
    <View style={styles.climateChart}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: theme.primary }]} />
          <ThemedText type="caption">Chamados (máx. {maxChamados})</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <ThemedText type="caption">{field === 'temperatura' ? 'Temperatura' : 'Precipitação'} (máx. {maxClimate.toFixed(1)} {unit})</ThemedText>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.climateColumns}>
          {rows.map((row) => {
            const value = row[field];
            return (
              <View key={row.data} style={styles.climateColumn}>
                <View style={[styles.climatePlot, { backgroundColor: theme.backgroundElement }]}>
                  <View style={[styles.climateBar, { backgroundColor: theme.primary, height: (row.chamados / maxChamados) * CHART_HEIGHT }]} />
                  {value !== null ? (
                    <View style={[styles.climateDot, { backgroundColor: color, bottom: (value / maxClimate) * CHART_HEIGHT - 4 }]} />
                  ) : null}
                </View>
                <ThemedText themeColor="mutedForeground" type="caption">{row.data.slice(8, 10)}/{row.data.slice(5, 7)}</ThemedText>
              </View>
            );
          })}
        </View>
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
  filterSelect: { alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: Spacing.three },
  filterLabel: { flexShrink: 1 },
  modalBackdrop: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', flex: 1, justifyContent: 'center', padding: Spacing.four },
  modalCard: { borderRadius: Radius.lg, gap: Spacing.one, maxHeight: '80%', maxWidth: 440, padding: Spacing.three, width: '100%' },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: Spacing.two },
  option: { alignItems: 'center', borderRadius: Radius.sm, flexDirection: 'row', justifyContent: 'space-between', minHeight: 44, paddingHorizontal: Spacing.two },
  climateChart: { gap: Spacing.two },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: Spacing.one },
  legendSwatch: { borderRadius: 2, height: 10, width: 10 },
  legendDot: { borderRadius: Radius.pill, height: 10, width: 10 },
  climateColumns: { flexDirection: 'row', gap: Spacing.one },
  climateColumn: { alignItems: 'center', gap: Spacing.one, width: 40 },
  climatePlot: { borderRadius: Radius.sm, height: CHART_HEIGHT, justifyContent: 'flex-end', overflow: 'visible', width: 26 },
  climateBar: { borderRadius: Radius.sm, opacity: 0.6, width: '100%' },
  climateDot: { alignSelf: 'center', borderRadius: Radius.pill, height: 8, position: 'absolute', width: 8 },
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
