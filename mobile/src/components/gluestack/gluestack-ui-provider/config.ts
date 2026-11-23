import { vars } from 'nativewind';
import { Colors } from '@/constants/theme';

// Created by AI.
type ThemePalette = typeof Colors.light;

// Created by AI.
function toRgbChannels(color: string): string {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (!match) {
    throw new Error(`Expected a six-digit hex theme color, received "${color}".`);
  }

  return match.slice(1).map((channel) => Number.parseInt(channel, 16)).join(' ');
}

// Created by AI.
function toColorVariables(palette: ThemePalette) {
  return {
    '--primary': toRgbChannels(palette.primary),
    '--primary-foreground': toRgbChannels(palette.primaryForeground),
    '--card': toRgbChannels(palette.card),
    '--secondary': toRgbChannels(palette.muted),
    '--secondary-foreground': toRgbChannels(palette.text),
    '--background': toRgbChannels(palette.background),
    '--popover': toRgbChannels(palette.card),
    '--popover-foreground': toRgbChannels(palette.text),
    '--muted': toRgbChannels(palette.muted),
    '--muted-foreground': toRgbChannels(palette.mutedForeground),
    '--destructive': toRgbChannels(palette.destructive),
    '--foreground': toRgbChannels(palette.text),
    '--border': toRgbChannels(palette.border),
    '--input': toRgbChannels(palette.input),
    '--ring': toRgbChannels(palette.ring),
    '--accent': toRgbChannels(palette.accentSoft),
    '--accent-foreground': toRgbChannels(palette.accentForeground),
  };
}

// Created by AI.
export const colors = {
  light: toColorVariables(Colors.light),
  dark: toColorVariables(Colors.dark),
};

// Created by AI.
export const config = {
  light: vars(colors.light),
  dark: vars(colors.dark),
};
