import { loadInitialData } from '../initSnapshot';
import { setState } from './state';

let initializePromise: Promise<void> | null = null;

/**
 * Hydrates the store from the database once. Repeated calls share the same
 * promise, so a remount or double-invoked effect cannot run auto-billing twice.
 * On failure the app is still marked ready (matching the old provider) and a
 * later call may retry.
 */
export function initialize(): Promise<void> {
  if (initializePromise) return initializePromise;

  initializePromise = loadInitialData()
    .then((snapshot) => {
      setState({
        accounts: snapshot.accounts,
        transactions: snapshot.transactions,
        customCategories: snapshot.customCategories,
        deletedDefaultCategories: snapshot.deletedDefaultCategories,
        categoryOrder: {
          expense: snapshot.expenseOrder,
          income: snapshot.incomeOrder,
        },
        walletOrder: snapshot.walletOrder,
        userProfile: snapshot.profile,
        budgets: snapshot.budgets,
        subscriptions: snapshot.subscriptions,
        ready: true,
      });
    })
    .catch((err) => {
      console.error('App init failed:', err);
      setState({ ready: true });
      initializePromise = null;
    });

  return initializePromise;
}
