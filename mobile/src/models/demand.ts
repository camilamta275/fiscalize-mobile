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

export type DemandListResult = {
  data: Demand[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
