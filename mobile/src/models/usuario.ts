/**
 * Model — the authenticated user.
 *
 * Mirrored from the backend rather than invented here: `perfil` is the
 * `perfil` enum in backend/prisma/schema.prisma. `@map("Cidadão")` there only
 * renames the value stored in Postgres — the Prisma client, and so the JSON
 * this app receives, still uses the enum's TS member name, 'Cidadao' (no
 * cedilla). Confirmed against a live POST /auth/login response. Fields match
 * what that endpoint actually returns
 * (backend/src/controllers/authController.ts) — it does not send `status` or
 * `criadoem`, so this type doesn't claim them.
 */

export type Perfil = 'Cidadao' | 'Gestor' | 'Admin';

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
};
