import type {
  AverageResponseTimeResponse,
  DemandsByCategoryResponse,
  TotalDemandsResponse,
} from '@/models/metrics';
import { request } from '@/services/api-client';

// Created by AI.
/** Service — Gestor-only operational indicators (backend/src/routes/metricsRoutes.ts). */
export function getTotalDemands(): Promise<TotalDemandsResponse> {
  return request<TotalDemandsResponse>('/metrics/total-demands');
}

export function getDemandsByCategory(): Promise<DemandsByCategoryResponse> {
  return request<DemandsByCategoryResponse>('/metrics/demands-by-category');
}

export function getAverageResponseTime(): Promise<AverageResponseTimeResponse> {
  return request<AverageResponseTimeResponse>('/metrics/average-response-time');
}
