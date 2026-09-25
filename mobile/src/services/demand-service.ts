import type { Demand, DemandListResult } from '@/models/demand';
import { request } from '@/services/api-client';

/**
 * Service — the demand ("chamado") CRUD, registered in
 * backend/src/routes/demandRoutes.ts.
 *
 * There's no `remove` here: DELETE /demands/:id is restricted to the
 * `Gestor` role (`requireRole(['Gestor'])`) and this app only ever
 * authenticates `Cidadao` accounts (see models/usuario.ts) — a Cidadão
 * calling it always gets a 403, so there's nothing for this app to expose.
 */

export type ListDemandsParams = {
  status?: string;
  categoria?: number;
  regiao?: string;
  page?: number;
  limit?: number;
};

export function list(params: ListDemandsParams = {}): Promise<DemandListResult> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.categoria !== undefined) query.set('categoria', String(params.categoria));
  if (params.regiao) query.set('regiao', params.regiao);
  query.set('page', String(params.page ?? 1));
  query.set('limit', String(params.limit ?? 20));

  return request<DemandListResult>(`/demands?${query.toString()}`);
}

export function getById(id: string): Promise<Demand> {
  return request<Demand>(`/demands/${id}`);
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
export function update(id: string, input: DemandInput): Promise<Demand> {
  return request<Demand>(`/demands/${id}`, { method: 'PUT', body: input });
}
