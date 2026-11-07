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
