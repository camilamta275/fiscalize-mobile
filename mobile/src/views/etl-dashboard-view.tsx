import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ThemedText } from '@/components/themed-text';
import { Icons, type IconName } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { EtlClimateRow } from '@/models/etl-dashboard';
import {
  describeCorrelation,
  formatShortDate,
  useEtlDashboardViewModel,
  weekdayOf,
  type BairroSummary,
  type RankingMetric,
} from '@/viewmodels/use-etl-dashboard-view-model';

type ClimateMetric = 'precipitacao' | 'temperatura';

// Created by AI.
const RAIN_COLOR = '#4C9BE8';
const TEMPERATURE_COLOR = '#E8844C';
const CHART_HEIGHT = 150;
const DAILY_PREVIEW = 7;

// Created by AI.
// Updated by AI.
export function EtlDashboardView() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const vm = useEtlDashboardViewModel();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [rankingMetric, setRankingMetric] = useState<RankingMetric>('chamados');
  const [climateMetric, setClimateMetric] = useState<ClimateMetric>('precipitacao');
  const [showAllDays, setShowAllDays] = useState(false);

  const { summary, climateSummary, selectedBairro } = vm;
  const selectedName = vm.all.find((item) => item.key === selectedBairro)?.name ?? null;

  const ranking = useMemo(() => {
    const known = vm.visible.filter((item) => !item.unknown);
    const value = (item: BairroSummary) => (rankingMetric === 'chamados' ? item.chamados : item.incidencia);
    return [...known].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (va === null && vb === null) return b.chamados - a.chamados;
      if (va === null) return 1;
      if (vb === null) return -1;
      return vb - va || b.chamados - a.chamados;
    });
  }, [vm.visible, rankingMetric]);
  const unknownRow = vm.visible.find((item) => item.unknown) ?? null;
  const rankingMax = Math.max(
    ...ranking.map((item) => (rankingMetric === 'chamados' ? item.chamados : item.incidencia ?? 0)),
    0.0001,
  );

  const dailyRows = useMemo(() => [...vm.climate].reverse(), [vm.climate]);
  const shownDays = showAllDays ? dailyRows : dailyRows.slice(0, DAILY_PREVIEW);
  const tableRows = useMemo(
    () => [...vm.visible].sort((a, b) => Number(a.unknown) - Number(b.unknown) || b.chamados - a.chamados),
    [vm.visible],
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
        right={
          <Pressable
            accessibilityLabel="Atualizar dashboard"
            accessibilityRole="button"
            disabled={vm.isRefreshing}
            onPress={() => void vm.reload()}
            style={[styles.reload, { backgroundColor: theme.primarySoft }]}>
            <Icon color={theme.primary} name={Icons.refresh} size={18} />
          </Pressable>
        }
        subtitle="Engenharia de Dados e Big Data"
        title="Dashboard ETL"
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.five }]}
        refreshControl={
          <RefreshControl onRefresh={() => void vm.reload()} refreshing={vm.isRefreshing} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}>
        {vm.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.primary} />
            <ThemedText themeColor="mutedForeground" type="small">
              Carregando os dados do ETL...
            </ThemedText>
          </View>
        ) : null}

        {vm.error ? (
          <Card style={styles.gap}>
            <ThemedText style={{ color: theme.destructive }} type="smallBold">
              Não foi possível carregar o dashboard
            </ThemedText>
            <ThemedText themeColor="mutedForeground" type="small">
              {vm.error}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => void vm.reload()}
              style={[styles.retry, { backgroundColor: theme.primarySoft }]}>
              <ThemedText style={{ color: theme.primary }} type="smallBold">
                Tentar novamente
              </ThemedText>
            </Pressable>
          </Card>
        ) : null}

        {!vm.isLoading && !vm.error && vm.all.length === 0 ? (
          <EmptyState
            description="Execute o ETL para gerar as tabelas finais e volte aqui."
            icon={Icons.document}
            title="Ainda não há dados no dashboard"
          />
        ) : null}

        {!vm.isLoading && !vm.error && vm.all.length > 0 ? (
          <>
            {/* KPIs */}
            <View style={styles.tiles}>
              <Kpi label="Chamados" value={summary.totalChamados.toLocaleString('pt-BR')} />
              <Kpi
                label="Habitantes"
                value={summary.populacao ? summary.populacao.toLocaleString('pt-BR') : 'N/I'}
              />
              <Kpi
                label="Por 1.000 hab."
                value={summary.incidenciaGeral === null ? 'N/I' : summary.incidenciaGeral.toFixed(2)}
              />
            </View>
            {vm.updatedAt ? (
              <ThemedText themeColor="mutedForeground" type="caption">
                {selectedName ? `Bairro: ${selectedName} · ` : ''}
                Atualizado em {new Date(vm.updatedAt).toLocaleString('pt-BR')}
              </ThemedText>
            ) : null}

            {/* Filter */}
            <Pressable
              accessibilityLabel="Filtrar por bairro"
              accessibilityRole="button"
              onPress={() => setIsFilterOpen(true)}
              style={[styles.filterSelect, { backgroundColor: theme.card, borderColor: theme.borderStrong }]}>
              <Icon color={theme.mutedForeground} name={Icons.filter} size={16} />
              <ThemedText numberOfLines={1} style={styles.filterLabel} type="small">
                {selectedName ?? 'Todos os bairros'}
              </ThemedText>
              {selectedBairro !== null ? (
                <Pressable
                  accessibilityLabel="Limpar filtro"
                  accessibilityRole="button"
                  hitSlop={Spacing.two}
                  onPress={() => vm.setSelectedBairro(null)}>
                  <Icon color={theme.mutedForeground} name={Icons.close} size={16} />
                </Pressable>
              ) : (
                <Icon color={theme.mutedForeground} name={Icons.chevronDown} size={16} />
              )}
            </Pressable>

            {/* Insights */}
            {selectedBairro === null ? (
              <View style={styles.gapSmall}>
                {summary.topByChamados ? (
                  <InsightRow
                    icon={Icons.chart}
                    text={`${summary.topByChamados.chamados} ${summary.topByChamados.chamados === 1 ? 'chamado' : 'chamados'} no total`}
                    title={`${summary.topByChamados.name} lidera em volume`}
                    tone="primary"
                  />
                ) : null}
                {summary.topByIncidencia && summary.topByIncidencia.incidencia !== null ? (
                  <InsightRow
                    icon={Icons.mapPin}
                    text={`${summary.topByIncidencia.incidencia.toFixed(2)} chamados por 1.000 habitantes`}
                    title={`${summary.topByIncidencia.name} tem a maior incidência`}
                    tone="primary"
                  />
                ) : null}
                {summary.unknownChamados > 0 ? (
                  <InsightRow
                    icon={Icons.warning}
                    text={`${summary.unknownChamados} de ${summary.totalChamados} chamados (${Math.round(summary.unknownShare * 100)}%) chegaram sem bairro e ficam fora do ranking`}
                    title="Qualidade dos dados"
                    tone="gold"
                  />
                ) : null}
              </View>
            ) : null}

            {/* Ranking */}
            <Card style={styles.gap}>
              <View style={styles.cardHeader}>
                <ThemedText type="subtitle">Ranking por bairro</ThemedText>
              </View>
              <Segmented
                onChange={setRankingMetric}
                options={[
                  { label: 'Chamados', value: 'chamados' },
                  { label: 'Por 1.000 hab.', value: 'incidencia' },
                ]}
                value={rankingMetric}
              />
              {ranking.length === 0 ? (
                <ThemedText themeColor="mutedForeground" type="small">
                  Nenhum bairro identificado para este filtro.
                </ThemedText>
              ) : null}
              {ranking.map((item, index) => {
                const value = rankingMetric === 'chamados' ? item.chamados : item.incidencia;
                const ratio = value === null ? 0 : value / rankingMax;
                return (
                  <View key={item.key} style={styles.rankRow}>
                    <RankBadge position={index + 1} />
                    <View style={styles.rankBody}>
                      <View style={styles.rankTop}>
                        <ThemedText numberOfLines={1} style={styles.rankName} type="smallBold">
                          {item.name}
                        </ThemedText>
                        <ThemedText style={{ color: theme.primary }} type="smallBold">
                          {value === null
                            ? 'N/I'
                            : rankingMetric === 'chamados'
                              ? String(value)
                              : value.toFixed(2)}
                        </ThemedText>
                      </View>
                      <View style={[styles.barTrack, { backgroundColor: theme.backgroundElement }]}>
                        <View
                          style={[
                            styles.bar,
                            { backgroundColor: theme.primary, opacity: 0.4 + 0.6 * ratio, width: `${Math.max(ratio * 100, value ? 3 : 0)}%` },
                          ]}
                        />
                      </View>
                      <ThemedText themeColor="mutedForeground" type="caption">
                        {rankingMetric === 'chamados'
                          ? item.incidencia === null
                            ? 'taxa por 1.000 hab. indisponível'
                            : `${item.incidencia.toFixed(2)} por 1.000 hab.`
                          : `${item.chamados} ${item.chamados === 1 ? 'chamado' : 'chamados'}`}
                        {item.populacao ? ` · ${item.populacao.toLocaleString('pt-BR')} hab.` : ''}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
              {unknownRow ? (
                <View style={[styles.unknownRow, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
                  <Icon color={theme.gold} name={Icons.warning} size={18} />
                  <View style={styles.rankBody}>
                    <ThemedText type="smallBold">Sem bairro informado</ThemedText>
                    <ThemedText themeColor="mutedForeground" type="caption">
                      {unknownRow.chamados} {unknownRow.chamados === 1 ? 'chamado' : 'chamados'} · não entram no ranking
                    </ThemedText>
                  </View>
                </View>
              ) : null}
            </Card>

            {/* Climate */}
            <Card style={styles.gap}>
              <ThemedText type="subtitle">Clima x chamados</ThemedText>
              <ThemedText themeColor="mutedForeground" type="caption">
                Série diária da Open-Meteo para o Recife. O filtro de bairro não se aplica ao clima.
              </ThemedText>
              {vm.climateError ? (
                <ThemedText style={{ color: theme.destructive }} type="small">
                  {vm.climateError}
                </ThemedText>
              ) : null}
              {!vm.climateError && !climateSummary ? (
                <ThemedText themeColor="mutedForeground" type="small">
                  Ainda não há dados de clima. Execute o ETL para gerá-los.
                </ThemedText>
              ) : null}
              {climateSummary ? (
                <>
                  <View style={styles.tiles}>
                    <Kpi label="Chamados" value={String(climateSummary.totalChamados)} />
                    <Kpi label="Chuva acum." value={`${climateSummary.totalRain.toFixed(1)} mm`} />
                    <Kpi
                      label="Temp. média"
                      value={climateSummary.avgTemp === null ? 'N/I' : `${climateSummary.avgTemp.toFixed(1)} °C`}
                    />
                  </View>

                  <View style={styles.gapSmall}>
                    <InsightRow
                      icon={Icons.calendar}
                      text={`${climateSummary.peak.chamados} ${climateSummary.peak.chamados === 1 ? 'chamado' : 'chamados'}`}
                      title={`Pico de chamados: ${weekdayOf(climateSummary.peak.data)} ${formatShortDate(climateSummary.peak.data)}`}
                      tone="primary"
                    />
                    {(climateSummary.wettest.precipitacao ?? 0) > 0 ? (
                      <InsightRow
                        icon={Icons.info}
                        text={`${(climateSummary.wettest.precipitacao ?? 0).toFixed(1)} mm de chuva`}
                        title={`Dia mais chuvoso: ${weekdayOf(climateSummary.wettest.data)} ${formatShortDate(climateSummary.wettest.data)}`}
                        tone="primary"
                      />
                    ) : null}
                    {climateSummary.rainCorrelation !== null ? (
                      <InsightRow
                        icon={Icons.info}
                        text={`Correlação de Pearson r = ${climateSummary.rainCorrelation.toFixed(2)} em ${climateSummary.days} dias. Correlação não indica causa.`}
                        title={`Chuva x chamados: ${describeCorrelation(climateSummary.rainCorrelation)}`}
                        tone="gold"
                      />
                    ) : (
                      <ThemedText themeColor="mutedForeground" type="caption">
                        A correlação entre clima e chamados aparece a partir de 5 dias de dados ({climateSummary.days} até agora).
                      </ThemedText>
                    )}
                  </View>

                  <Segmented
                    onChange={setClimateMetric}
                    options={[
                      { label: 'Chuva', value: 'precipitacao' },
                      { label: 'Temperatura', value: 'temperatura' },
                    ]}
                    value={climateMetric}
                  />
                  <ClimateChart metric={climateMetric} rows={vm.climate} />
                </>
              ) : null}
            </Card>

            {/* Daily */}
            {dailyRows.length > 0 ? (
              <Card style={styles.gap}>
                <ThemedText type="subtitle">Dia a dia</ThemedText>
                {shownDays.map((row) => (
                  <View key={`clima-${row.data}`} style={[styles.dayRow, { borderBottomColor: theme.border }]}>
                    <View style={styles.dayDate}>
                      <ThemedText type="smallBold">{formatShortDate(row.data)}</ThemedText>
                      <ThemedText themeColor="mutedForeground" type="caption">
                        {weekdayOf(row.data)}
                      </ThemedText>
                    </View>
                    <View style={styles.chips}>
                      <Chip text={`${row.chamados} ${row.chamados === 1 ? 'chamado' : 'chamados'}`} />
                      <Chip text={row.temperatura === null ? 'N/I' : `${row.temperatura.toFixed(1)} °C`} />
                      <Chip text={row.precipitacao === null ? 'N/I' : `${row.precipitacao.toFixed(1)} mm`} />
                    </View>
                  </View>
                ))}
                {dailyRows.length > DAILY_PREVIEW ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setShowAllDays((current) => !current)}
                    style={[styles.retry, { backgroundColor: theme.primarySoft }]}>
                    <ThemedText style={{ color: theme.primary }} type="smallBold">
                      {showAllDays ? 'Mostrar menos' : `Ver todos os ${dailyRows.length} dias`}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </Card>
            ) : null}

            {/* Table */}
            <Card style={styles.gapSmall}>
              <ThemedText type="subtitle">Detalhamento por bairro</ThemedText>
              <View style={[styles.tableRow, styles.tableHead, { borderBottomColor: theme.border }]}>
                <ThemedText style={styles.colName} themeColor="mutedForeground" type="caption">
                  Bairro
                </ThemedText>
                <ThemedText style={styles.colNum} themeColor="mutedForeground" type="caption">
                  Chamados
                </ThemedText>
                <ThemedText style={styles.colNum} themeColor="mutedForeground" type="caption">
                  Habitantes
                </ThemedText>
                <ThemedText style={styles.colNum} themeColor="mutedForeground" type="caption">
                  / 1.000
                </ThemedText>
              </View>
              {tableRows.map((item) => (
                <View key={`t-${item.key}`} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                  <ThemedText numberOfLines={1} style={styles.colName} type="smallBold">
                    {item.name}
                  </ThemedText>
                  <ThemedText style={styles.colNum} type="small">
                    {item.chamados}
                  </ThemedText>
                  <ThemedText style={styles.colNum} themeColor={item.populacao ? undefined : 'mutedForeground'} type="small">
                    {item.populacao ? item.populacao.toLocaleString('pt-BR') : '—'}
                  </ThemedText>
                  <ThemedText style={styles.colNum} themeColor={item.incidencia === null ? 'mutedForeground' : undefined} type="small">
                    {item.incidencia === null ? '—' : item.incidencia.toFixed(2)}
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
              {[{ key: null as string | null, name: 'Todos os bairros' }, ...vm.all].map((option) => {
                const selected = option.key === selectedBairro;
                return (
                  <Pressable
                    key={option.key ?? 'todos'}
                    onPress={() => {
                      vm.setSelectedBairro(option.key);
                      setIsFilterOpen(false);
                    }}
                    style={[styles.option, selected && { backgroundColor: theme.primarySoft }]}>
                    <ThemedText type={selected ? 'smallBold' : 'default'}>{option.name}</ThemedText>
                    {selected ? <Icon color={theme.primary} name={Icons.check} size={18} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Created by AI.
function InsightRow({
  icon,
  text,
  title,
  tone,
}: {
  icon: IconName;
  text: string;
  title: string;
  tone: 'primary' | 'gold';
}) {
  const theme = useTheme();
  const palette = tone === 'gold' ? { bg: theme.goldSoft, fg: theme.gold } : { bg: theme.primarySoft, fg: theme.primary };

  return (
    <Card style={styles.insight}>
      <View style={[styles.insightIcon, { backgroundColor: palette.bg }]}>
        <Icon color={palette.fg} name={icon} size={18} />
      </View>
      <View style={styles.rankBody}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText themeColor="mutedForeground" type="caption">
          {text}
        </ThemedText>
      </View>
    </Card>
  );
}

// Created by AI.
function Segmented<T extends string>({
  onChange,
  options,
  value,
}: {
  onChange: (value: T) => void;
  options: { label: string; value: T }[];
  value: T;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.backgroundElement }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && { backgroundColor: theme.card, ...styles.segmentActive }]}>
            <ThemedText style={{ color: active ? theme.primary : theme.mutedForeground }} type="smallBold">
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

// Created by AI.
function RankBadge({ position }: { position: number }) {
  const theme = useTheme();
  const top = position <= 3;
  return (
    <View style={[styles.rankBadge, { backgroundColor: top ? theme.primary : theme.backgroundElement }]}>
      <ThemedText style={{ color: top ? theme.primaryForeground : theme.mutedForeground }} type="smallBold">
        {position}
      </ThemedText>
    </View>
  );
}

// Created by AI.
function Kpi({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <Card style={styles.kpi}>
      <ThemedText numberOfLines={1} themeColor="mutedForeground" type="caption">
        {label}
      </ThemedText>
      <ThemedText adjustsFontSizeToFit numberOfLines={1} style={{ color: theme.primary }} type="heading">
        {value}
      </ThemedText>
    </Card>
  );
}

// Created by AI.
function Chip({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="caption">{text}</ThemedText>
    </View>
  );
}

// Created by AI.
function ClimateChart({ metric, rows }: { metric: ClimateMetric; rows: EtlClimateRow[] }) {
  const theme = useTheme();
  const color = metric === 'precipitacao' ? RAIN_COLOR : TEMPERATURE_COLOR;
  const unit = metric === 'precipitacao' ? 'mm' : '°C';
  const maxChamados = Math.max(...rows.map((row) => row.chamados), 1);
  const maxMetric = Math.max(...rows.map((row) => row[metric] ?? 0), 1);

  return (
    <View style={styles.gapSmall}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: theme.primary }]} />
          <ThemedText type="caption">Chamados (máx. {maxChamados})</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <ThemedText type="caption">
            {metric === 'precipitacao' ? 'Chuva' : 'Temperatura'} (máx. {maxMetric.toFixed(1)} {unit})
          </ThemedText>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.chartScroll} horizontal showsHorizontalScrollIndicator={false}>
        {rows.map((row) => {
          const value = row[metric];
          const barHeight = row.chamados > 0 ? Math.max((row.chamados / maxChamados) * CHART_HEIGHT, 6) : 0;
          return (
            <View key={row.data} style={styles.chartColumn}>
              <ThemedText style={{ color: theme.primary }} type="caption">
                {row.chamados}
              </ThemedText>
              <View style={[styles.chartPlot, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.chartBar, { backgroundColor: theme.primary, height: barHeight }]} />
                {value !== null ? (
                  <View
                    style={[
                      styles.chartDot,
                      { backgroundColor: color, borderColor: theme.card, bottom: (value / maxMetric) * (CHART_HEIGHT - 10) },
                    ]}
                  />
                ) : null}
              </View>
              <ThemedText style={{ color }} type="caption">
                {value === null ? 'N/I' : value.toFixed(1)}
              </ThemedText>
              <ThemedText themeColor="mutedForeground" type="caption">
                {formatShortDate(row.data)}
              </ThemedText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { gap: Spacing.three, padding: Spacing.three },
  centered: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  gap: { gap: Spacing.three },
  gapSmall: { gap: Spacing.two },
  reload: { alignItems: 'center', borderRadius: Radius.pill, height: 36, justifyContent: 'center', width: 36 },
  retry: { alignItems: 'center', borderRadius: Radius.md, justifyContent: 'center', minHeight: 40, paddingHorizontal: Spacing.three },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },

  filterSelect: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  filterLabel: { flex: 1 },

  insight: { alignItems: 'center', flexDirection: 'row', gap: Spacing.three },
  insightIcon: { alignItems: 'center', borderRadius: Radius.md, height: 36, justifyContent: 'center', width: 36 },

  segmented: { borderRadius: Radius.md, flexDirection: 'row', padding: 3 },
  segment: { alignItems: 'center', borderRadius: Radius.sm, flex: 1, justifyContent: 'center', minHeight: 36 },
  segmentActive: { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },

  rankRow: { alignItems: 'flex-start', flexDirection: 'row', gap: Spacing.two },
  rankBadge: { alignItems: 'center', borderRadius: Radius.pill, height: 26, justifyContent: 'center', width: 26 },
  rankBody: { flex: 1, gap: 4 },
  rankTop: { alignItems: 'center', flexDirection: 'row', gap: Spacing.two, justifyContent: 'space-between' },
  rankName: { flex: 1 },
  barTrack: { borderRadius: Radius.pill, height: 8, overflow: 'hidden' },
  bar: { borderRadius: Radius.pill, height: '100%' },
  unknownRow: { alignItems: 'center', borderRadius: Radius.md, borderStyle: 'dashed', borderWidth: 1, flexDirection: 'row', gap: Spacing.two, padding: Spacing.two + 2 },

  tiles: { flexDirection: 'row', gap: Spacing.two },
  kpi: { flex: 1, gap: Spacing.one, paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.three },

  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: Spacing.one },
  legendSwatch: { borderRadius: 2, height: 10, width: 10 },
  legendDot: { borderRadius: Radius.pill, height: 10, width: 10 },
  chartScroll: { flexGrow: 1, gap: Spacing.two, justifyContent: 'space-around' },
  chartColumn: { alignItems: 'center', gap: 4, minWidth: 54 },
  chartPlot: { borderRadius: Radius.sm, height: CHART_HEIGHT, justifyContent: 'flex-end', width: 30 },
  chartBar: { borderRadius: Radius.sm, opacity: 0.85, width: '100%' },
  chartDot: { alignSelf: 'center', borderRadius: Radius.pill, borderWidth: 2, height: 14, position: 'absolute', width: 14 },

  dayRow: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: Spacing.three, paddingBottom: Spacing.two },
  dayDate: { minWidth: 48 },
  chips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' },
  chip: { borderRadius: Radius.pill, paddingHorizontal: Spacing.two, paddingVertical: 3 },

  tableRow: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: Spacing.one, paddingVertical: Spacing.two },
  tableHead: { paddingVertical: Spacing.one },
  colName: { flex: 1.6 },
  colNum: { flex: 1, textAlign: 'right' },

  modalBackdrop: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)', flex: 1, justifyContent: 'center', padding: Spacing.four },
  modalCard: { borderRadius: Radius.lg, gap: Spacing.one, maxHeight: '80%', maxWidth: 440, padding: Spacing.three, width: '100%' },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: Spacing.two },
  option: { alignItems: 'center', borderRadius: Radius.sm, flexDirection: 'row', justifyContent: 'space-between', minHeight: 44, paddingHorizontal: Spacing.two },
});
