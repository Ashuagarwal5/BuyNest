/**
 * DoorKart design tokens. Components should read colors through `useTheme()` and use the
 * spacing / radius / typography scales below instead of hardcoding values.
 */

import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

export const Colors = {
  light: {
    text: '#0F1B33',
    textSecondary: '#55627A',
    textOnPrimary: '#FFFFFF',
    background: '#F5F7FB',
    surface: '#FFFFFF',
    border: '#E1E6F0',
    primary: '#0B57C9',
    primarySoft: '#DCE9FB',
    accent: '#EA580C',
    accentSoft: '#FFEDD5',
    success: '#15803D',
    danger: '#B91C1C',
  },
  dark: {
    text: '#EEF3FC',
    textSecondary: '#A0AFCB',
    textOnPrimary: '#06142E',
    background: '#0A1020',
    surface: '#121A2E',
    border: '#223052',
    primary: '#6CAEFF',
    primarySoft: '#12294F',
    accent: '#FB923C',
    accentSoft: '#3A230C',
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
