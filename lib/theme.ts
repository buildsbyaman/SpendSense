import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';

export const THEME = {
  light: {
    background: '#f2f2f2',
    foreground: '#1a1c1b',
    surface: '#ffffff',
    card: '#ffffff',
    cardForeground: '#1a1c1b',
    primary: '#1a1c1b',
    primaryForeground: '#ffffff',
    secondary: '#e8e8e8',
    secondaryForeground: '#1a1c1b',
    muted: '#9b9b9b',
    mutedForeground: '#ffffff',
    accent: '#f6c98a',
    accentForeground: '#7d5b2d',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#e8e8e8',
    input: '#f6f6f6',
    ring: '#f6c98a',
  },
  dark: {
    background: '#111113',
    foreground: '#f0f0f2',
    surface: '#1c1c1f',
    card: '#1c1c1f',
    cardForeground: '#f0f0f2',
    primary: '#e8e8ec',
    primaryForeground: '#111113',
    secondary: '#2a2a2e',
    secondaryForeground: '#e8e8ec',
    muted: '#8a8a94',
    mutedForeground: '#e8e8ec',
    accent: '#f6c98a',
    accentForeground: '#111113',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#2e2e32',
    input: '#1a1a1e',
    ring: '#f6c98a',
  },
};

export const PLACEHOLDER_COLORS = {
  light: '#9ca3af',
  dark: '#8a8a94',
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
