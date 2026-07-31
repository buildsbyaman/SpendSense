import { THEME } from './theme';

export type ColorScheme = 'light' | 'dark';

const light = {
  income: '#16a34a',
  expense: '#f87171',
  accent: '#f6c98a',
  axisLabel: '#9b9b9b',
  grid: '#e8e8e8',
  surface: THEME.light.surface,
  foreground: THEME.light.foreground,
  muted: THEME.light.muted,
};

const dark = {
  income: '#4ade80',
  expense: '#fb7185',
  accent: '#f6c98a',
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
