import { ApiError } from '@/models/api-error';

// Updated by AI.
const defaultBaseUrl = 'https://fiscalize-backend.onrender.com';

export const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultBaseUrl;
// Created by AI.
// Updated by AI.
// O backend publicado no Render hiberna no plano gratuito e a primeira
// requisição pode levar até ~1 minuto; por isso o limite é maior que os 10s
// usados quando a API roda localmente.
const API_TIMEOUT_MS = 60000;

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

// Updated by AI.
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (caught) {
    const isTimeout = isAbortError(caught);
    throw new ApiError(
      0,
      isTimeout
        ? `A API não respondeu em ${API_TIMEOUT_MS / 1000} segundos. Se o backend estiver no Render, ele pode estar iniciando — tente novamente.`
        : `Não foi possível conectar a ${baseUrl}. ${transportFailureReason(caught)}`
    );
  } finally {
    clearTimeout(timeoutId);
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
// Updated by AI.
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
    } catch (caught) {
      if (
        !(caught instanceof ApiError) ||
        caught.isOffline ||
        caught.statusCode === 408 ||
        caught.statusCode === 429 ||
        caught.statusCode >= 500
      ) {
        throw caught;
      }

      setAuthTokens(null, null);
      onTokensRotated?.('', '');
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

// Created by AI.
/**
 * O React Native rejeita o `fetch` abortado com um `DOMException` cujo
 * protótipo nem sempre deriva de `Error`, então comparar com `instanceof
 * Error` esconde o timeout e mostra o erro genérico de conexão.
 */
function isAbortError(caught: unknown): boolean {
  return (
    typeof caught === 'object' &&
    caught !== null &&
    'name' in caught &&
    (caught as { name?: unknown }).name === 'AbortError'
  );
}

// Created by AI.
function transportFailureReason(caught: unknown): string {
  const name =
    typeof caught === 'object' && caught !== null && 'name' in caught
      ? String((caught as { name?: unknown }).name)
      : '';
  const message = caught instanceof Error ? caught.message : '';

  if (message && name) return `Falha de rede (${name}: ${message}).`;
  if (message) return `Falha de rede (${message}).`;
  return 'Verifique a conexão do aparelho.';
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
