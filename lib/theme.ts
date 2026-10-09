import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';

export const THEME = {
  light: {
    background: '#f3f7ff',
    foreground: '#0f172a',
    surface: '#ffffff',
    card: '#ffffff',
    cardForeground: '#0f172a',
    primary: '#0f172a',
    primaryForeground: '#ffffff',
    secondary: '#e4ecfb',
    secondaryForeground: '#0f172a',
    muted: '#94a3b8',
    mutedForeground: '#64748b',
    accent: '#2563eb',
    accentForeground: '#ffffff',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#e8edf6',
    input: '#f0f4fb',
    ring: '#2563eb',
  },
  dark: {
    background: '#121214',
    foreground: '#ffffff',
    surface: '#1a1a1e',
    card: '#1a1a1e',
    cardForeground: '#ffffff',
    primary: '#ffffff',
    primaryForeground: '#1c1c1e',
    secondary: '#2c2c2e',
    secondaryForeground: '#ffffff',
    muted: '#8e8e93',
    mutedForeground: '#ffffff',
    accent: '#3b82f6',
    accentForeground: '#ffffff',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#26262b',
    input: '#202025',
    ring: '#3b82f6',
  },
};

export const PLACEHOLDER_COLORS = {
  light: '#94a3b8',
  dark: '#8e8e93',
} as const;

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
