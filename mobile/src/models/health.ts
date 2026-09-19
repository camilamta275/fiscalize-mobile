/**
 * Model — the GET /health payload.
 *
 * Mirrored from the backend rather than invented here:
 * backend/src/config/health.ts
 */

/** 'ok' once the database answers; 'degraded' otherwise, served with HTTP 503. */
export type HealthStatus = 'ok' | 'degraded';

export type DatabaseStatus = 'connected' | 'disconnected';

/** Redis is optional — the backend reports 'unavailable' when REDIS_URL is unset. */
export type RedisStatus = 'connected' | 'unavailable';

export type Health = {
  status: HealthStatus;
  timestamp: string;
  environment: string;
  database: DatabaseStatus;
  redis: RedisStatus;
};
