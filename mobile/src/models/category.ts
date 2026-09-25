/**
 * Model — a demand category.
 *
 * Mirrored from GET /categories (backend/src/services/categoryService.ts),
 * which only ever returns active categories.
 */
export type Category = {
  id: number;
  nome: string;
  descricao: string;
};
