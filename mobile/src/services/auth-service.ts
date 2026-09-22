import type { Usuario } from '@/models/usuario';
import { request } from '@/services/api-client';

/**
 * Service — POST /auth/register, POST /auth/login, GET /auth/me and
 * POST /auth/logout, registered in backend/src/routes/authRoutes.ts.
 */

type LoginResponse = Usuario & { token: string };

/**
 * The backend hardcodes `perfil: 'Cidadao'` for every account created here
 * (backend/src/services/authService.ts) — there's no field to request another
 * role, and none of the three the request body accepts would let you. It also
 * doesn't log the new user in (no `token` in the response), so the caller
 * still has to go through `login`.
 */
export function register(nome: string, email: string, senha: string): Promise<Usuario> {
  return request<Usuario>('/auth/register', { method: 'POST', body: { nome, email, senha } });
}

export function login(email: string, senha: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', { method: 'POST', body: { email, senha } });
}

/** Resolves the token restored from SecureStore into its user, on app launch. */
export function me(): Promise<Usuario> {
  return request<Usuario>('/auth/me');
}

export function logout(): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST' });
}
