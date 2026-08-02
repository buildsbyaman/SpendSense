import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === '1';

const STORAGE_KEY = 'spendsense:devTools';

export async function loadDevToolsEnabled(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

export async function saveDevToolsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // non-fatal
  }
}
