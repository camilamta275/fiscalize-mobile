import type { Usuario } from '@/models/usuario';
import { request } from '@/services/api-client';

/**
 * Service — POST /auth/register, POST /auth/login, GET /auth/me and
 * POST /auth/logout, registered in backend/src/routes/authRoutes.ts.
 */

// Created by AI.
// Updated by AI.
export type LoginResponse = Usuario & { token: string; refreshToken: string };
export type MfaChallenge = {
  mfaRequired: true;
  challengeToken: string;
  destination: string;
};

/**
 * The backend hardcodes `perfil: 'Cidadao'` for every account created here
 * (backend/src/services/authService.ts) — there's no field to request another
 * role, and none of the three the request body accepts would let you. It also
 * doesn't log the new user in (no `token` in the response), so the caller
 * still has to go through `login`.
 */
// Updated by AI.
export function register(data: {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  complemento?: string;
}): Promise<Usuario> {
  return request<Usuario>('/auth/register', { method: 'POST', body: data });
}

export function login(
  email: string,
  senha: string,
  deviceId: string,
  deviceName: string
): Promise<LoginResponse | MfaChallenge> {
  return request<LoginResponse | MfaChallenge>('/auth/login', {
    method: 'POST',
    body: { email, senha, deviceId, deviceName },
  });
}

export function verifyOtp(
  challengeToken: string,
  code: string,
  deviceId: string
): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/2fa/verify', {
    method: 'POST',
    body: { challengeToken, code, deviceId },
    skipRefresh: true,
  });
}

export function requestCriticalOtp(
  action: 'password' | 'export' | 'delete' | 'anonymization'
): Promise<{ challengeToken: string; destination: string }> {
  return request('/auth/2fa/request-critical', { method: 'POST', body: { action } });
}

export function verifyCriticalOtp(
  challengeToken: string,
  code: string
): Promise<{ verificationToken: string }> {
  return request<{ verificationToken: string }>('/auth/2fa/verify', {
    method: 'POST',
    body: { challengeToken, code },
    skipRefresh: true,
  });
}

// Created by AI.
export function refresh(refreshToken: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    skipRefresh: true,
  });
}

/** Resolves the token restored from SecureStore into its user, on app launch. */
export function me(): Promise<Usuario> {
  return request<Usuario>('/auth/me');
}

// Created by AI.
export function updateMe(data: {
  nome: string;
  email: string;
  rua?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  complemento?: string | null;
}): Promise<Usuario> {
  return request<Usuario>('/auth/me', { method: 'PUT', body: data });
}

// Created by AI.
export function exportMe(mfaToken: string): Promise<unknown> {
  return request<unknown>('/auth/me/export', { method: 'POST', body: { mfaToken } });
}

// Created by AI.
export function deleteMe(senha: string, mode: 'delete' | 'anonymize', mfaToken: string): Promise<void> {
  return request<void>('/auth/me', { method: 'DELETE', body: { senha, mode, mfaToken } });
}

// Created by AI.
export function setAnonymization(enabled: boolean, senha: string | undefined, mfaToken: string): Promise<void> {
  return request<void>('/auth/me/anonymization', {
    method: 'PATCH',
    body: { enabled, mfaToken, ...(senha ? { senha } : {}) },
  });
}

// Created by AI.
export function changePassword(senhaAtual: string, novaSenha: string, confirmarNovaSenha: string, mfaToken: string): Promise<void> {
  return request<void>('/auth/me/password', {
    method: 'PATCH',
    body: { senhaAtual, novaSenha, confirmarNovaSenha, mfaToken },
  });
}

export function logout(refreshToken: string | null): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST', body: { refreshToken } });
}
