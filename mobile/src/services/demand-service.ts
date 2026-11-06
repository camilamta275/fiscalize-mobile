import type {
  Demand,
  DemandDetail,
  DemandListResult,
  DemandStatus,
  DemandStatusUpdate,
  PublicDemand,
} from '@/models/demand';
import { STATUS_API_VALUES } from '@/models/demand';
import { request } from '@/services/api-client';

// Updated by AI.
/**
 * Service — the demand ("chamado") CRUD, registered in
 * backend/src/routes/demandRoutes.ts.
 *
 * `remove` hits DELETE /demands/:id, which the demand's owner (Cidadao) or a
 * Gestor may call — the backend does a soft delete (flags the demand as
 * 'Fechado' and logs a "Demanda removida" timeline event).
 *
 * `updateStatus` hits PATCH /demands/:id/status, the lifecycle progress action:
 * per the plan, status changes made by a Gestor come from here, not from the
 * Cidadao-only PUT.
 */

export type ListDemandsParams = {
  status?: string;
  categoria?: number;
  regiao?: string;
  page?: number;
  limit?: number;
  orgao?: string;
  ordenacao?: 'recent' | 'oldest' | 'priority' | 'sla';
};

// Created by AI.
export type DemandOrganization = { id: string; nome: string; sigla: string };

export function list(params: ListDemandsParams = {}): Promise<DemandListResult> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.categoria !== undefined) query.set('categoria', String(params.categoria));
  if (params.regiao) query.set('regiao', params.regiao);
  if (params.orgao) query.set('orgao', params.orgao);
  if (params.ordenacao) query.set('ordenacao', params.ordenacao);
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 20));

  return request<DemandListResult>(`/demands?${query.toString()}`);
}

// Created by AI.
export function listOrganizations(): Promise<DemandOrganization[]> {
  return request<DemandOrganization[]>('/demands/organizations');
}

// Created by AI.
export function listPublic(params: { status?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 20));
  return request<{ data: PublicDemand[]; total: number; page: number; limit: number; totalPages: number }>(
    `/demands/public?${query.toString()}`,
  );
}

// Updated by AI.
export function getById(id: string): Promise<DemandDetail> {
  return request<DemandDetail>(`/demands/${id}`);
}

export type DemandInput = {
  title: string;
  description: string;
  category_id: number;
  location: string;
  latitude?: number;
  longitude?: number;
};

/** Cidadao-only (backend/src/routes/demandRoutes.ts). */
export function create(input: DemandInput): Promise<Demand> {
  return request<Demand>('/demands', { method: 'POST', body: input });
}

/**
 * Cidadao-only, and only on demands the caller owns and that aren't already
 * 'Em Andamento' / 'Resolvido' / 'Fechado' — see `BLOCKED_EDIT_STATUSES` in
 * models/demand.ts.
 */
// Updated by AI.
export function update(id: string, input: DemandInput): Promise<Demand> {
  return request<Demand>(`/demands/${id}`, { method: 'PUT', body: input });
}

// Created by AI.
/** Somente Gestor (requireRole(['Gestor']) em demandRoutes.ts). */
export function updateStatus(id: string, status: DemandStatus): Promise<DemandStatusUpdate> {
  return request<DemandStatusUpdate>(`/demands/${id}/status`, {
    method: 'PATCH',
    body: { status_id: STATUS_API_VALUES[status] },
  });
}

// Created by AI.
/** Owner (Cidadao) or Gestor — backend/src/services/demandService.ts. */
export function remove(id: string): Promise<void> {
  return request<void>(`/demands/${id}`, { method: 'DELETE' });
}
