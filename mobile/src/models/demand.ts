/**
 * Model — a "demanda" (chamado/ocorrência urbana).
 *
 * Mirrored from what the backend actually serializes
 * (backend/src/services/demandService.ts maps its Prisma rows to exactly
 * these fields before responding, already translating status to the
 * human-readable label — the raw enum with underscores never reaches here).
 */

export type DemandStatus =
  | 'Aberto'
  | 'Em Análise'
  | 'Em Andamento'
  | 'Aguardando'
  | 'Resolvido'
  | 'Fechado';

// Created by AI.
export type DemandPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

/**
 * A demand in one of these statuses rejects PUT /demands/:id with 403
 * (`demandService.update`'s BLOCKED_STATUSES) — the form disables editing
 * instead of letting the user hit that wall.
 */
export const BLOCKED_EDIT_STATUSES: readonly DemandStatus[] = [
  'Em Andamento',
  'Resolvido',
  'Fechado',
];

/**
 * Percentage of the four-step progress bar (Aberto → Análise → Execução →
 * Resolvido) that each backend status represents. Shared by the list card and
 * the detail screen so both bars never disagree.
 */
// Created by AI.
export const DEMAND_STATUS_PROGRESS: Record<DemandStatus, number> = {
  Aberto: 25,
  'Em Análise': 50,
  'Em Andamento': 75,
  Aguardando: 62,
  Resolvido: 100,
  Fechado: 100,
};

// Created by AI.
export type DemandLogType = 'criacao' | 'status' | 'mensagem' | 'transferencia' | 'conclusao';

/**
 * One entry of `timeline_event`, serialized by `demandService.findById`.
 */
// Created by AI.
export type DemandLog = {
  id: string;
  tipo: DemandLogType;
  titulo: string | null;
  descricao: string;
  autor: string;
  timestamp: string;
};

export type Demand = {
  id: string;
  protocolo: string;
  title: string;
  description: string;
  status: DemandStatus;
  location: string;
  latitude: number;
  longitude: number;
  category: { id: number; nome: string };
  creator: { id: string; nome: string; email: string };
  createdAt: string;
  updatedAt: string;
};

/**
 * `GET /demands/:id` adds the routing/SLA fields and the timeline that the
 * list endpoint doesn't serialize. Every extra field is optional so a stale
 * backend (or a cached list item) still type-checks.
 */
// Created by AI.
export type DemandDetail = Demand & {
  assignedOrg?: { id: string; nome: string; sigla: string } | null;
  priority?: DemandPriority;
  slaHours?: number;
  slaDeadline?: string;
  slaJustification?: string | null;
  photoUrl?: string | null;
  resolutionNote?: string | null;
  resolutionPhotoUrl?: string | null;
  logs?: DemandLog[];
};

export type DemandListResult = {
  data: Demand[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
