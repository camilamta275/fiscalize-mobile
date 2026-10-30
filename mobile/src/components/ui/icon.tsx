import { SymbolView } from 'expo-symbols';

import type { IconName } from '@/constants/icons';

// Created by AI.
export function Icon({
  color,
  name,
  size = 20,
}: {
  color: string;
  name: IconName;
  size?: number;
}) {
  return (
    <SymbolView
      name={name}
      size={size}
      style={{ height: size, width: size }}
      tintColor={color}
    />
  );
}
