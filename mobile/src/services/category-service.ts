import type { Category } from '@/models/category';
import { request } from '@/services/api-client';

/** Service — GET /categories, registered in backend/src/routes/categoryRoutes.ts. */
export function list(): Promise<Category[]> {
  return request<Category[]>('/categories');
}
