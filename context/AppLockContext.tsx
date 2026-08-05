import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authenticate } from '@/lib/biometric';
import { useAppState } from '@/hooks/useAppState';

const LOCK_STORAGE_KEY = 'spendsense:appLock';

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
        const stored = await SecureStore.getItemAsync(LOCK_STORAGE_KEY);
        if (cancelled) return;
        if (stored === 'true') {
          setEnabled(true);
          setLocked(true);
          setTimeout(() => {
            if (!cancelled) void startAuth();
          }, 500);
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
        !suppressRef.current
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
        try {
          await SecureStore.setItemAsync(LOCK_STORAGE_KEY, 'true');
        } catch {
          // non-fatal — lock applies for this session only
        }
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
        try {
          await SecureStore.deleteItemAsync(LOCK_STORAGE_KEY);
        } catch {
          // non-fatal
        }
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
    <AppLockContext.Provider
      value={{ enabled, locked, isAuthenticating, enable, disable, unlock }}>
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