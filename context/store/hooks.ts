import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { Account } from '@/utils/wallet';
import { actions, type AppActions } from './actions';
import { getState, subscribe, type AppData } from './state';
import { selectSortedCategories, sortAccounts, type SortedCategoryItem } from './selectors';

/**
 * Subscribes to a slice of app state.
 *
 * Selectors MUST return a primitive or a reference that already lives in the
 * store (e.g. `(state) => state.accounts`). Never return a new object or array
 * from a selector: `useSyncExternalStore` compares snapshots with `Object.is`,
 * so a freshly created value on every call causes an infinite render loop.
 * Put derived arrays in `useMemo` at the call site or use `useSortedAccounts`
 * / `useSortedCategories` below.
 */
export function useAppSelector<T>(selector: (state: AppData) => T): T {
  const getSnapshot = useCallback(() => selector(getState()), [selector]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Returns the frozen action object; safe to use in dependency arrays. */
export function useAppActions(): AppActions {
  return actions;
}

/** Accounts in saved wallet order (or highest balance first). */
export function useSortedAccounts(): Account[] {
  const accounts = useAppSelector((state) => state.accounts);
  const walletOrder = useAppSelector((state) => state.walletOrder);

  return useMemo(() => sortAccounts(accounts, walletOrder), [accounts, walletOrder]);
}

/** Active categories for a type, deduplicated and in saved order. */
export function useSortedCategories(type: 'expense' | 'income'): SortedCategoryItem[] {
  const customCategories = useAppSelector((state) => state.customCategories);
  const deletedDefaultCategories = useAppSelector((state) => state.deletedDefaultCategories);
  const categoryOrder = useAppSelector((state) => state.categoryOrder);

  return useMemo(
    () => selectSortedCategories(type, customCategories, deletedDefaultCategories, categoryOrder),
    [type, customCategories, deletedDefaultCategories, categoryOrder]
  );
}
