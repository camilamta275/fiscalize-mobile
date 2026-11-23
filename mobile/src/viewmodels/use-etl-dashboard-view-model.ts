import { useCallback, useEffect, useMemo, useState } from 'react';

import type { EtlClimateRow, EtlDashboardRow } from '@/models/etl-dashboard';
import { getClimate, getPopulation } from '@/services/etl-dashboard-service';

/** The ETL stores unmapped addresses as "NAO INFORMADO" (or null). */
// Created by AI.
export function isUnknownBairro(bairro: string | null): boolean {
  if (!bairro) return true;
  const key = bairro.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
  return key === 'NAO INFORMADO' || key === 'N/I' || key === '';
}

const LOWERCASE_WORDS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

/** "BOA VIAGEM" -> "Boa Viagem", "JARDIM SAO PAULO" -> "Jardim Sao Paulo". */
// Created by AI.
export function formatBairro(bairro: string | null): string {
  if (isUnknownBairro(bairro)) return 'Não informado';
  return (bairro as string)
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) =>
      index > 0 && LOWERCASE_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** Weekday abbreviation for an ISO date, without relying on Intl being available. */
// Created by AI.
export function weekdayOf(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return WEEKDAYS[new Date(year, month - 1, day).getDay()] ?? '';
}

// Created by AI.
export function formatShortDate(isoDate: string): string {
  return `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;
}

/** Pearson correlation of two series; null when it is not meaningful. */
// Created by AI.
export function pearson(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 5) return null;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i += 1) {
    cov += (xs[i] - meanX) * (ys[i] - meanY);
    varX += (xs[i] - meanX) ** 2;
    varY += (ys[i] - meanY) ** 2;
  }
  if (varX === 0 || varY === 0) return null;
  return cov / Math.sqrt(varX * varY);
}

// Created by AI.
export function describeCorrelation(r: number): string {
  const strength = Math.abs(r);
  const size = strength < 0.2 ? 'muito fraca' : strength < 0.4 ? 'fraca' : strength < 0.7 ? 'moderada' : 'forte';
  return `${size} ${r >= 0 ? 'positiva' : 'negativa'}`;
}

export type RankingMetric = 'chamados' | 'incidencia';

export type BairroSummary = {
  /** Raw name from the ETL (used as the filter key). */
  key: string;
  name: string;
  chamados: number;
  populacao: number | null;
  incidencia: number | null;
  unknown: boolean;
};

// Created by AI.
function toSummary(row: EtlDashboardRow): BairroSummary {
  return {
    key: row.bairro ?? 'NAO INFORMADO',
    name: formatBairro(row.bairro),
    chamados: row.chamados,
    populacao: row.populacao,
    incidencia: row.chamados_por_1000,
    unknown: isUnknownBairro(row.bairro),
  };
}

/**
 * Loads the ETL tables through the backend and derives everything the screen
 * shows. Read-only: nothing here writes to the backend or the ETL.
 */
// Created by AI.
export function useEtlDashboardViewModel() {
  const [rows, setRows] = useState<EtlDashboardRow[]>([]);
  const [climate, setClimate] = useState<EtlClimateRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [climateError, setClimateError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBairro, setSelectedBairro] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    setClimateError(null);
    try {
      const [population, climateResult] = await Promise.all([
        getPopulation(),
        getClimate().catch((caught: unknown) =>
          caught instanceof Error ? caught : new Error('Não foi possível carregar o clima.'),
        ),
      ]);
      setRows(population.data);
      setUpdatedAt(population.updatedAt);
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
    void load();
  }, [load]);

  const all = useMemo(() => rows.map(toSummary), [rows]);
  const visible = useMemo(
    () => (selectedBairro === null ? all : all.filter((item) => item.key === selectedBairro)),
    [all, selectedBairro],
  );

  const summary = useMemo(() => {
    const totalChamados = visible.reduce((total, item) => total + item.chamados, 0);
    const withPopulation = visible.filter((item) => item.populacao);
    const populacao = withPopulation.reduce((total, item) => total + (item.populacao ?? 0), 0);
    const chamadosComPopulacao = withPopulation.reduce((total, item) => total + item.chamados, 0);
    const unknownChamados = visible.filter((item) => item.unknown).reduce((total, item) => total + item.chamados, 0);
    const mapped = visible.filter((item) => !item.unknown);
    const topByChamados = [...mapped].sort((a, b) => b.chamados - a.chamados)[0] ?? null;
    const topByIncidencia =
      [...mapped].filter((item) => item.incidencia !== null).sort((a, b) => (b.incidencia ?? 0) - (a.incidencia ?? 0))[0] ??
      null;
    return {
      totalChamados,
      populacao,
      // Weighted: only bairros with a known population count towards the rate.
      incidenciaGeral: populacao ? (chamadosComPopulacao / populacao) * 1000 : null,
      bairrosMapeados: mapped.length,
      unknownChamados,
      unknownShare: totalChamados ? unknownChamados / totalChamados : 0,
      topByChamados,
      topByIncidencia,
    };
  }, [visible]);

  const climateSummary = useMemo(() => {
    if (climate.length === 0) return null;
    const chamados = climate.map((row) => row.chamados);
    const rain = climate.map((row) => row.precipitacao ?? 0);
    const temps = climate.filter((row) => row.temperatura !== null).map((row) => row.temperatura as number);
    const peak = climate.reduce((best, row) => (row.chamados > best.chamados ? row : best), climate[0]);
    const wettest = climate.reduce((best, row) => ((row.precipitacao ?? 0) > (best.precipitacao ?? 0) ? row : best), climate[0]);
    return {
      days: climate.length,
      totalChamados: chamados.reduce((a, b) => a + b, 0),
      totalRain: rain.reduce((a, b) => a + b, 0),
      avgTemp: temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null,
      peak,
      wettest,
      rainCorrelation: pearson(rain, chamados),
      tempCorrelation: temps.length === climate.length ? pearson(temps, chamados) : null,
    };
  }, [climate]);

  return {
    all,
    visible,
    summary,
    climate,
    climateSummary,
    climateError,
    updatedAt,
    error,
    isLoading,
    isRefreshing,
    selectedBairro,
    setSelectedBairro,
    reload: () => load(true),
  };
}
