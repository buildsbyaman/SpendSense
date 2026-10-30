import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import type { AppContextType } from './types';
import { actions, getState, initialize, subscribe } from './store';

/**
 * Initialization boundary only. State lives in the external store, so the
 * provider never re-renders its children when app data changes.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initialize();
  }, []);

  return <>{children}</>;
}

/**
 * Facade over the external store. Kept for consumers that have not been
 * migrated to `useAppSelector` / `useAppActions` yet; it subscribes to the
 * whole state, so those consumers still re-render on every slice change.
 */
export function useApp(): AppContextType {
  const state = useSyncExternalStore(subscribe, getState, getState);
  return { ...state, ...actions };
}
