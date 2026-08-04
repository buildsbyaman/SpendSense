import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';

export const THEME = {
  light: {
    background: '#f8f9fa',
    foreground: '#000000',
    surface: '#ffffff',
    card: '#ffffff',
    cardForeground: '#000000',
    primary: '#1c1c1e',
    primaryForeground: '#ffffff',
    secondary: '#e8e8e8',
    secondaryForeground: '#1c1c1e',
    muted: '#9ca3af',
    mutedForeground: '#ffffff',
    accent: '#f6c98a',
    accentForeground: '#7d5b2d',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#f3f4f6',
    input: '#f6f6f6',
    ring: '#f6c98a',
  },
  dark: {
    background: '#000000',
    foreground: '#ffffff',
    surface: '#0a0a0a',
    card: '#0a0a0a',
    cardForeground: '#ffffff',
    primary: '#ffffff',
    primaryForeground: '#1c1c1e',
    secondary: '#2c2c2e',
    secondaryForeground: '#ffffff',
    muted: '#8e8e93',
    mutedForeground: '#ffffff',
    accent: '#f6c98a',
    accentForeground: '#111113',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#18181b',
    input: '#1a1a1e',
    ring: '#f6c98a',
  },
};

export const PLACEHOLDER_COLORS = {
  light: '#9ca3af',
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
