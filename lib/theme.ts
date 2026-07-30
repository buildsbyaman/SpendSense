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
    background: '#0a0a0a',
    foreground: '#f2f2f2',
    surface: '#161616',
    card: '#161616',
    cardForeground: '#f2f2f2',
    primary: '#f2f2f2',
    primaryForeground: '#0a0a0a',
    secondary: '#2a2a2a',
    secondaryForeground: '#f2f2f2',
    muted: '#707070',
    mutedForeground: '#f2f2f2',
    accent: '#f6c98a',
    accentForeground: '#0a0a0a',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#2a2a2a',
    input: '#1a1a1a',
    ring: '#f6c98a',
  },
};

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
