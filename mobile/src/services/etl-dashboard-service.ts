import type { EtlClimateResponse, EtlDashboardResponse } from '@/models/etl-dashboard';
import { request } from '@/services/api-client';

// Created by AI.
export function getPopulation(): Promise<EtlDashboardResponse> {
  return request<EtlDashboardResponse>('/dashboard/etl/population');
}

// Created by AI.
export function getClimate(): Promise<EtlClimateResponse> {
  return request<EtlClimateResponse>('/dashboard/etl/climate');
}
