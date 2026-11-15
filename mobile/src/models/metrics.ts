// Created by AI.
/** Mirrors GET /metrics/* (backend/src/controllers/metricsController.ts). */
export type MetricsScope = 'plataforma' | 'gestor';

export type TotalDemandsResponse = {
  escopo: MetricsScope;
  total: number;
  aberta: number;
  em_andamento: number;
  resolvida: number;
  encerrada: number;
};

export type DemandsByCategoryRow = { category: string; total: number; percentage: number };

export type DemandsByCategoryResponse = { escopo: MetricsScope; data: DemandsByCategoryRow[] };

export type AverageResponseTimeResponse = {
  escopo: MetricsScope;
  total_demandas_consideradas: number;
  media_horas: number | null;
};
