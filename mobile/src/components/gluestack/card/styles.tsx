import { isWeb, tva } from '@gluestack-ui/utils/nativewind-utils';

// Created by AI.
const baseStyle = isWeb ? 'flex flex-col relative z-0' : '';

// Created by AI.
export const cardStyle = tva({
  base: `${baseStyle} flex-col bg-card border border-border rounded-xl shadow-sm`,
  variants: {
    size: {
      default: 'p-4 gap-6',
      sm: 'p-3 gap-3',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});
