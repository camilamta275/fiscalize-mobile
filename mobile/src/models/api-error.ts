/**
 * Model — a transport failure in a shape the rest of the app can reason about.
 *
 * The backend funnels every failure through one middleware that answers with
 * `{ error, statusCode, timestamp, details? }`
 * (backend/src/middlewares/errorMiddleware.ts), so the message always lives in
 * `error` and is already written in Portuguese.
 */
export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** No response arrived at all — server down, wrong host, or no network. */
  get isOffline() {
    return this.statusCode === 0;
  }
}
