import AsyncStorage from '@react-native-async-storage/async-storage';

// Developer tools must never be reachable in a release build, regardless of a
// misconfigured build-time env var.
export const DEV_MODE = __DEV__ && process.env.EXPO_PUBLIC_DEV_MODE === '1';

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
