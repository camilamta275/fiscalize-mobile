import { Platform } from 'react-native';

import { ApiError } from '@/models/api-error';

/**
 * Service — the single place the app performs HTTP.
 *
 * Routing every call through `request` means the base URL and the error
 * normalization are configured once instead of at each call site.
 */

/**
 * `localhost` resolves to the device itself, not the development machine. The
 * Android emulator reaches the host through 10.0.2.2, while the iOS simulator
 * shares the host's loopback. A physical device needs this machine's LAN IP,
 * which is what EXPO_PUBLIC_API_BASE_URL is for — see .env.example.
 */
const defaultBaseUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultBaseUrl;

/**
 * The backend accepts the JWT via cookie or `Authorization: Bearer`
 * (backend/src/middlewares/authMiddleware.ts) — a cookie jar shared across app
 * restarts isn't something `fetch` gives us on native, so the app authenticates
 * with the header instead. `session-context.tsx` calls this once the token is
 * known (on sign-in, and after restoring it from SecureStore on launch).
 */
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /**
   * Non-2xx codes to treat as success. GET /health answers 503 with a complete,
   * meaningful body, so its caller wants the payload rather than an exception.
   */
  allowStatuses?: number[];
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, allowStatuses = [] } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch rejects only on transport failure, never on an HTTP error status.
    throw new ApiError(0, `Não foi possível conectar a ${baseUrl}. O servidor está rodando?`);
  }

  const payload = await parseBody(response);

  if (!response.ok && !allowStatuses.includes(response.status)) {
    throw new ApiError(response.status, errorMessage(payload, response.status, path), payload);
  }

  return payload as T;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(payload: unknown, status: number, path: string): string {
  if (typeof payload === 'object' && payload !== null && 'error' in payload) {
    const { error } = payload as { error: unknown };

    if (typeof error === 'string') {
      return error;
    }
  }

  return `Erro ${status} ao chamar ${path}`;
}
