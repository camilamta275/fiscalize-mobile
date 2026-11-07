import type { EtlDashboardResponse } from '@/models/etl-dashboard';
import { request } from '@/services/api-client';

// Created by AI.
export function getPopulation(): Promise<EtlDashboardResponse> {
  return request<EtlDashboardResponse>('/dashboard/etl/population');
}
