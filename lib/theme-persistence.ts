import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'spendsense:colorScheme';

export type ThemePreference = 'light' | 'dark';

export async function loadThemePreference(): Promise<ThemePreference | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // non-fatal — fall back to system default
  }
  return null;
}

export async function saveThemePreference(scheme: ThemePreference): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, scheme);
  } catch {
    // non-fatal — theme still applies for this session
  }
}
