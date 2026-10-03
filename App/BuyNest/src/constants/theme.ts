/**
 * BuyNest design tokens. Components should read colors through `useTheme()` and use the
 * spacing / radius / typography scales below instead of hardcoding values.
 */

import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

export const Colors = {
  light: {
    text: '#14201D',
    textSecondary: '#5B6B66',
    textOnPrimary: '#FFFFFF',
    background: '#F6F8F7',
    surface: '#FFFFFF',
    border: '#E1E7E4',
    primary: '#0F766E',
    primarySoft: '#D9F0EC',
    accent: '#D97706',
    accentSoft: '#FEF3C7',
    success: '#15803D',
    danger: '#B91C1C',
  },
  dark: {
    text: '#F1F5F4',
    textSecondary: '#A3B3AE',
    textOnPrimary: '#06201D',
    background: '#0C1413',
    surface: '#16211F',
    border: '#26332F',
    primary: '#2DD4BF',
    primarySoft: '#123B36',
    accent: '#FBBF24',
    accentSoft: '#3B2F0B',
    success: '#4ADE80',
    danger: '#F87171',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    mono: 'var(--font-mono)',
  },
});

export const Typography = {
  title: { fontFamily: Fonts.sans, fontSize: 28, lineHeight: 34, fontWeight: 700 },
  heading: { fontFamily: Fonts.sans, fontSize: 20, lineHeight: 26, fontWeight: 600 },
  body: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 24, fontWeight: 400 },
  bodyStrong: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 24, fontWeight: 600 },
  caption: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18, fontWeight: 400 },
  captionStrong: { fontFamily: Fonts.sans, fontSize: 13, lineHeight: 18, fontWeight: 600 },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof Typography;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 16,
  pill: 999,
} as const;

export const Shadows = {
  card: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' },
} as const;

/** Smallest comfortable touch target, in density-independent pixels. */
export const MinTouchTarget = 48;
export const MaxContentWidth = 800;
