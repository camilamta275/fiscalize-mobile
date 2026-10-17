import { Platform } from 'react-native';

import { ApiError } from '@/models/api-error';

const defaultBaseUrl =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultBaseUrl;

let authToken: string | null = null;
let refreshToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
let onTokensRotated: ((accessToken: string, nextRefreshToken: string) => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

// Created by AI.
export function setAuthTokens(accessToken: string | null, nextRefreshToken: string | null) {
  authToken = accessToken;
  refreshToken = nextRefreshToken;
}

// Created by AI.
export function setTokenRotationHandler(
  handler: ((accessToken: string, nextRefreshToken: string) => void) | null
) {
  onTokensRotated = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  allowStatuses?: number[];
  skipRefresh?: boolean;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, allowStatuses = [], skipRefresh = false } = options;
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
    throw new ApiError(0, `Não foi possível conectar a ${baseUrl}. O servidor está rodando?`);
  }

  const payload = await parseBody(response);

  if (
    response.status === 401 &&
    !skipRefresh &&
    path !== '/auth/refresh' &&
    refreshToken
  ) {
    const refreshed = await rotateTokens();
    if (refreshed) {
      return request<T>(path, { ...options, skipRefresh: true });
    }
  }

  if (!response.ok && !allowStatuses.includes(response.status)) {
    throw new ApiError(response.status, errorMessage(payload, response.status, path), payload);
  }

  return payload as T;
}

// Created by AI.
async function rotateTokens(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await request<{ token: string; refreshToken: string }>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        skipRefresh: true,
      });
      setAuthTokens(response.token, response.refreshToken);
      onTokensRotated?.(response.token, response.refreshToken);
      return true;
    } catch {
      setAuthTokens(null, null);
      onTokensRotated?.('', '');
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(payload: unknown, status: number, path: string): string {
  if (typeof payload === 'object' && payload !== null && 'error' in payload) {
    const { error } = payload as { error: unknown };
    if (typeof error === 'string') return error;
  }

  return `Erro ${status} ao chamar ${path}`;
}
