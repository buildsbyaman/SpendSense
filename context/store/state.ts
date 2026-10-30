import type { Account } from '@/utils/wallet';
import type { Transaction, CustomCategory } from '@/utils/transaction';
import type { Subscription } from '@/utils/subscription';
import type { Budget } from '@/lib/repository';
import type { UserProfile } from '../types';

export type CategoryOrder = { expense: string[]; income: string[] };

/**
 * Every piece of state the app owns. Consumers subscribe to individual slices
 * with `useAppSelector`, so unrelated screens do not re-render when one slice
 * changes.
 */
export interface AppData {
  accounts: Account[];
  transactions: Transaction[];
  customCategories: CustomCategory[];
  deletedDefaultCategories: string[];
  categoryOrder: CategoryOrder;
  walletOrder: string[];
  userProfile: UserProfile;
  budgets: Budget[];
  subscriptions: Subscription[];
  ready: boolean;
}

export type AppStatePatch = Partial<AppData>;
export type AppStateUpdater = (state: AppData) => AppStatePatch;

/**
 * Builds a fresh initial state. A function (instead of a shared constant) keeps
 * `clearAllData` from handing out references that an earlier session could
 * still mutate.
 */
export function createInitialAppData(): AppData {
  return {
    accounts: [],
    transactions: [],
    customCategories: [],
    deletedDefaultCategories: [],
    categoryOrder: { expense: [], income: [] },
    walletOrder: [],
    userProfile: {
      name: 'User',
      currencySymbol: '$',
      currencyCode: 'USD',
      avatar: null,
      hasOnboarded: false,
    },
    budgets: [],
    subscriptions: [],
    ready: false,
  };
}

let state: AppData = createInitialAppData();
const listeners = new Set<() => void>();

export function getState(): AppData {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function hasPatchValues(patch: AppStatePatch): boolean {
  for (const value of Object.values(patch)) {
    if (value !== undefined) return true;
  }
  return false;
}

function notify(): void {
  for (const listener of listeners) listener();
}

/**
 * Applies a partial update to the store and notifies subscribers. The updater
 * form always receives the state at call time, which keeps async actions from
 * applying a snapshot captured before an `await`.
 */
export function setState(patch: AppStatePatch | AppStateUpdater): void {
  const nextPatch = typeof patch === 'function' ? patch(state) : patch;
  if (!hasPatchValues(nextPatch)) return;

  let changed = false;
  for (const [key, value] of Object.entries(nextPatch)) {
    if (!Object.is(state[key as keyof AppData], value)) {
      changed = true;
      break;
    }
  }
  if (!changed) return;

  state = { ...state, ...nextPatch };
  notify();
}

/** Resets the store to its initial state (used by `clearAllData`). */
export function resetState(): void {
  state = createInitialAppData();
  notify();
}
