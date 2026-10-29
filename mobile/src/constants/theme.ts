/**
 * Design tokens for the app.
 *
 * Ported from the `citycare-routing-hub-main` reference (`src/index.css` and
 * `tailwind.config.ts`), which defines its palette in HSL. Keeping the same
 * HSL numbers here — instead of copying hex codes — means the mobile app and
 * the reference stay visually aligned if a token is ever tweaked upstream.
 */

import { Platform } from 'react-native';

// Created by AI.
function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - chroma / 2;

  const [r, g, b] =
    hue < 60
      ? [chroma, x, 0]
      : hue < 120
        ? [x, chroma, 0]
        : hue < 180
          ? [0, chroma, x]
          : hue < 240
            ? [0, x, chroma]
            : hue < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];

  const toHex = (value: number) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Light palette — mirrors `:root` in the reference's `index.css`.
 */
// Created by AI.
const light = {
  // Core surfaces
  text: hslToHex(215, 25, 15),
  textSecondary: hslToHex(215, 10, 50),
  background: hslToHex(210, 20, 98),
  card: hslToHex(0, 0, 100),
  backgroundElement: hslToHex(210, 20, 95),
  backgroundSelected: hslToHex(210, 15, 93),
  border: hslToHex(214, 20, 88),
  borderStrong: hslToHex(214, 20, 78),
  muted: hslToHex(210, 15, 93),
  mutedForeground: hslToHex(215, 10, 50),
  input: hslToHex(214, 20, 88),
  ring: hslToHex(213, 70, 40),

  // Brand
  primary: hslToHex(213, 70, 40),
  primaryForeground: hslToHex(0, 0, 100),
  primarySoft: hslToHex(213, 70, 95),
  accent: hslToHex(160, 55, 40),
  accentForeground: hslToHex(0, 0, 100),
  accentSoft: hslToHex(160, 55, 95),
  gold: hslToHex(38, 92, 50),
  goldSoft: hslToHex(38, 92, 95),
  destructive: hslToHex(0, 72, 51),
  destructiveSoft: hslToHex(0, 72, 95),

  // Status semantics
  statusOpen: hslToHex(213, 70, 50),
  statusOpenBg: hslToHex(213, 70, 95),
  statusAnalysis: hslToHex(30, 85, 50),
  statusAnalysisBg: hslToHex(30, 85, 95),
  statusProgress: hslToHex(152, 55, 42),
  statusProgressBg: hslToHex(152, 55, 95),
  statusWaiting: hslToHex(38, 92, 50),
  statusWaitingBg: hslToHex(38, 92, 95),
  statusDone: hslToHex(210, 10, 55),
  statusDoneBg: hslToHex(210, 10, 95),
  statusClosed: hslToHex(210, 10, 70),
  statusClosedBg: hslToHex(210, 10, 96),
  statusCritical: hslToHex(0, 72, 51),
  statusCriticalBg: hslToHex(0, 72, 95),

  // Utility
  overlay: 'rgba(15, 23, 42, 0.45)',
  shadow: hslToHex(215, 25, 15),
};

/**
 * Dark palette — the reference has no dark mode, so these are derived from the
 * same hues: the surfaces invert, the brand and status colors get lighter so
 * they keep their contrast against the dark background.
 */
// Created by AI.
const dark = {
  text: hslToHex(210, 20, 96),
  textSecondary: hslToHex(215, 12, 66),
  background: hslToHex(215, 25, 10),
  card: hslToHex(215, 22, 14),
  backgroundElement: hslToHex(215, 20, 18),
  backgroundSelected: hslToHex(215, 20, 24),
  border: hslToHex(215, 18, 24),
  borderStrong: hslToHex(215, 16, 34),
  muted: hslToHex(215, 20, 18),
  mutedForeground: hslToHex(215, 12, 66),
  input: hslToHex(215, 18, 26),
  ring: hslToHex(213, 70, 60),

  primary: hslToHex(213, 70, 60),
  primaryForeground: hslToHex(215, 25, 10),
  primarySoft: hslToHex(213, 45, 22),
  accent: hslToHex(160, 45, 50),
  accentForeground: hslToHex(215, 25, 10),
  accentSoft: hslToHex(160, 40, 20),
  gold: hslToHex(38, 85, 58),
  goldSoft: hslToHex(38, 45, 20),
  destructive: hslToHex(0, 65, 62),
  destructiveSoft: hslToHex(0, 40, 22),

  statusOpen: hslToHex(213, 70, 65),
  statusOpenBg: hslToHex(213, 45, 22),
  statusAnalysis: hslToHex(30, 85, 62),
  statusAnalysisBg: hslToHex(30, 45, 20),
  statusProgress: hslToHex(152, 50, 58),
  statusProgressBg: hslToHex(152, 40, 18),
  statusWaiting: hslToHex(38, 88, 62),
  statusWaitingBg: hslToHex(38, 45, 20),
  statusDone: hslToHex(210, 10, 68),
  statusDoneBg: hslToHex(210, 12, 24),
  statusClosed: hslToHex(210, 10, 55),
  statusClosedBg: hslToHex(210, 12, 20),
  statusCritical: hslToHex(0, 70, 65),
  statusCriticalBg: hslToHex(0, 40, 22),

  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: hslToHex(0, 0, 0),
};

// Created by AI.
export const Colors = { light, dark };

// Created by AI.
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Created by AI.
export type Theme = typeof Colors.light;

// Created by AI.
export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

// Created by AI.
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// Created by AI.
export const Radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

// Created by AI.
export const Gradients = {
  /** `gov-gradient` from the reference: blue → green. */
  gov: [light.primary, light.accent] as const,
  /** Slightly deeper variant used behind the dashboard header. */
  hero: [hslToHex(213, 70, 34), hslToHex(160, 55, 36)] as const,
};

// Created by AI.
export const Shadows = {
  card: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Created by AI.
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
// Created by AI.
export const MaxContentWidth = 800;
