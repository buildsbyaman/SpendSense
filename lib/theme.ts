import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';

export const THEME = {
  light: {
    background: '#f7f7f7',
    foreground: '#111111',
    surface: '#ffffff',
    card: '#ffffff',
    cardForeground: '#111111',
    primary: '#111111',
    primaryForeground: '#ffffff',
    secondary: '#f4f4f4',
    secondaryForeground: '#111111',
    muted: '#777777',
    mutedForeground: '#a0a0a0',
    accent: '#111111',
    accentForeground: '#ffffff',
    destructive: '#f04444',
    destructiveForeground: '#ffffff',
    border: '#eaeaea',
    input: '#f7f7f7',
    ring: '#111111',
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
  light: '#a0a0a0',
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
