import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authenticate } from '@/lib/biometric';
import { isAppReady, waitForAppReady } from '@/lib/app-ready';
import { useAppState } from '@/hooks/useAppState';

const ASYNC_LOCK_KEY = 'spendsense_app_lock';
const SECURE_LOCK_KEY = 'spendsense_app_lock';

async function readAppLockPreference(): Promise<boolean> {
  // 1. Check AsyncStorage first (fast, reliable across Android lifecycles, no Keystore issues)
  try {
    const asyncVal = await AsyncStorage.getItem(ASYNC_LOCK_KEY);
    if (asyncVal !== null) {
      return asyncVal === 'true';
    }
  } catch {
    // fallback to SecureStore
  }

  // 2. Fallback to SecureStore
  try {
    const secureVal = await SecureStore.getItemAsync(SECURE_LOCK_KEY);
    if (secureVal !== null) {
      const isEnabled = secureVal === 'true';
      void AsyncStorage.setItem(ASYNC_LOCK_KEY, isEnabled ? 'true' : 'false').catch(() => {});
      return isEnabled;
    }
  } catch {
    // non-fatal
  }

  return false;
}

async function writeAppLockPreference(enabled: boolean): Promise<void> {
  const val = enabled ? 'true' : 'false';

  // 1. Persist to AsyncStorage
  try {
    await AsyncStorage.setItem(ASYNC_LOCK_KEY, val);
  } catch {
    // non-fatal
  }

  // 2. Persist to SecureStore with valid alphanumeric/underscore key
  try {
    if (enabled) {
      await SecureStore.setItemAsync(SECURE_LOCK_KEY, 'true');
    } else {
      await SecureStore.deleteItemAsync(SECURE_LOCK_KEY);
    }
  } catch {
    // non-fatal
  }
}

interface AppLockContextType {
  enabled: boolean;
  locked: boolean;
  isAuthenticating: boolean;
  enable: () => Promise<boolean>;
  disable: () => Promise<boolean>;
  unlock: () => Promise<void>;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const enabledRef = useRef(false);
  const lockedRef = useRef(false);
  const authInFlightRef = useRef(false);
  const suppressRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  const startAuth = useCallback(async (): Promise<boolean> => {
    if (authInFlightRef.current) return false;
    authInFlightRef.current = true;
    setIsAuthenticating(true);
    let ok = false;
    try {
      ok = await authenticate();
    } finally {
      authInFlightRef.current = false;
      setIsAuthenticating(false);
    }
    setLocked(!ok);
    return ok;
  }, []);

  // Load persisted preference on mount; lock + auto-prompt on cold start.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const isEnabled = await readAppLockPreference();
        if (cancelled) return;
        if (isEnabled) {
          setEnabled(true);
          setLocked(true);
          // Show the biometric prompt once the first real frame is on screen
          // (the splash is held until data + theme are ready).
          await waitForAppReady();
          if (!cancelled) void startAuth();
        }
      } catch {
        // non-fatal — lock stays off for this session
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [startAuth]);

  // Instant lock on background, auto-prompt on foreground.
  useAppState(
    () => {
      if (enabledRef.current && !suppressRef.current) {
        setLocked(true);
      }
    },
    () => {
      if (
        enabledRef.current &&
        lockedRef.current &&
        !authInFlightRef.current &&
        !suppressRef.current &&
        isAppReady()
      ) {
        void startAuth();
      }
    }
  );

  const enable = useCallback(async (): Promise<boolean> => {
    suppressRef.current = true;
    try {
      const ok = await startAuth();
      if (ok) {
        setEnabled(true);
        await writeAppLockPreference(true);
      }
      return ok;
    } finally {
      suppressRef.current = false;
    }
  }, [startAuth]);

  const disable = useCallback(async (): Promise<boolean> => {
    suppressRef.current = true;
    try {
      const ok = await startAuth();
      if (ok) {
        setEnabled(false);
        setLocked(false);
        await writeAppLockPreference(false);
      }
      return ok;
    } finally {
      suppressRef.current = false;
    }
  }, [startAuth]);

  const unlock = useCallback(async (): Promise<void> => {
    if (authInFlightRef.current) return;
    await startAuth();
  }, [startAuth]);

  return (
    <AppLockContext.Provider value={{ enabled, locked, isAuthenticating, enable, disable, unlock }}>
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}
