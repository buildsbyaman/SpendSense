import { THEME } from './theme';

export type ColorScheme = 'light' | 'dark';

const light = {
  income: '#16a34a',
  expense: '#f87171',
  accent: '#2563eb',
  axisLabel: '#94a3b8',
  grid: '#e8edf6',
  surface: THEME.light.surface,
  foreground: THEME.light.foreground,
  muted: THEME.light.muted,
};

const dark = {
  income: '#4ade80',
  expense: '#fb7185',
  accent: '#3b82f6',
  axisLabel: '#8a8a94',
  grid: '#2e2e32',
  surface: THEME.dark.surface,
  foreground: THEME.dark.foreground,
  muted: THEME.dark.muted,
};

export const CHART_COLORS: Record<ColorScheme, typeof light> = {
  light,
  dark,
};
