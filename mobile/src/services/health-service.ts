import type { Health } from '@/models/health';
import { request } from '@/services/api-client';

/**
 * Service — GET /health, registered in backend/src/server.ts.
 *
 * The endpoint answers 200 when the database responds and 503 when it does not,
 * but both carry the same body. A 503 is therefore a result to display, not a
 * failure to throw.
 */
export function fetchHealth(): Promise<Health> {
  return request<Health>('/health', { allowStatuses: [503] });
}
