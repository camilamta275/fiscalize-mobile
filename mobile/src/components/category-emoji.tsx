import { Text } from 'react-native';

/**
 * The reference's categories carry an emoji each. The backend sends the
 * category by name (`Infraestrutura`, `Água e Esgoto`, …), so this maps the
 * normalised name — accents and casing stripped — to the same emoji.
 */
// Created by AI.
const CATEGORY_EMOJI: Record<string, string> = {
  infraestrutura: '🛣️',
  'agua e esgoto': '💧',
  'iluminacao publica': '💡',
  'saneamento basico': '🗑️',
  sinalizacao: '🚦',
  'outros problemas': '📋',
};

// Created by AI.
export function categoryEmoji(name: string): string {
  const key = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  return CATEGORY_EMOJI[key] ?? '📋';
}

// Created by AI.
export function CategoryEmoji({ name, size = 22 }: { name: string; size?: number }) {
  return <Text style={{ fontSize: size, lineHeight: size + 4 }}>{categoryEmoji(name)}</Text>;
}
