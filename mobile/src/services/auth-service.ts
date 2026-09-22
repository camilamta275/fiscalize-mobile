import type { Usuario } from '@/models/usuario';
import { request } from '@/services/api-client';

/**
 * Service — POST /auth/login, GET /auth/me and POST /auth/logout, registered
 * in backend/src/routes/authRoutes.ts.
 */

type LoginResponse = Usuario & { token: string };

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
