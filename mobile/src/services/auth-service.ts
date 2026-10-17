import type { Usuario } from '@/models/usuario';
import { request } from '@/services/api-client';

/**
 * Service — POST /auth/register, POST /auth/login, GET /auth/me and
 * POST /auth/logout, registered in backend/src/routes/authRoutes.ts.
 */

// Created by AI.
// Updated by AI.
type LoginResponse = Usuario & { token: string; refreshToken: string };

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

export function login(email: string, senha: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', { method: 'POST', body: { email, senha } });
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
export function exportMe(): Promise<unknown> {
  return request<unknown>('/auth/me/export');
}

// Created by AI.
export function deleteMe(senha: string, mode: 'delete' | 'anonymize'): Promise<void> {
  return request<void>('/auth/me', { method: 'DELETE', body: { senha, mode } });
}

// Created by AI.
export function setAnonymization(enabled: boolean, senha?: string): Promise<void> {
  return request<void>('/auth/me/anonymization', {
    method: 'PATCH',
    body: { enabled, ...(senha ? { senha } : {}) },
  });
}

// Created by AI.
export function changePassword(senhaAtual: string, novaSenha: string, confirmarNovaSenha: string): Promise<void> {
  return request<void>('/auth/me/password', {
    method: 'PATCH',
    body: { senhaAtual, novaSenha, confirmarNovaSenha },
  });
}

export function logout(refreshToken: string | null): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST', body: { refreshToken } });
}
