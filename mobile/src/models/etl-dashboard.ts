// Created by AI.
export type EtlDashboardRow = {
  bairro: string | null;
  chamados: number;
  populacao: number | null;
  chamados_por_1000: number | null;
};

// Created by AI.
export type EtlDashboardResponse = {
  data: EtlDashboardRow[];
  updatedAt: string;
};

// Created by AI.
export type EtlClimateRow = {
  data: string;
  temperatura: number | null;
  precipitacao: number | null;
  chamados: number;
};

// Created by AI.
export type EtlClimateResponse = {
  data: EtlClimateRow[];
  updatedAt: string;
};
