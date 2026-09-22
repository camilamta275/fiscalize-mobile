/**
 * Model — the authenticated user.
 *
 * Mirrored from the backend rather than invented here: `perfil` is the
 * `perfil` enum in backend/prisma/schema.prisma, sent over the wire as the
 * mapped label ('Cidadão', not 'Cidadao'). Fields match what
 * POST /auth/login actually returns (backend/src/controllers/authController.ts)
 * — it does not send `status` or `criadoem`, so this type doesn't claim them.
 */

export type Perfil = 'Cidadão' | 'Gestor' | 'Admin';

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
};
