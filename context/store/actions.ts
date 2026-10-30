import type { Account } from '@/utils/wallet';
import { deserializeAccount, parseBalance } from '@/utils/wallet';
import type { Transaction, CustomCategory } from '@/utils/transaction';
import {
  DEFAULT_CATEGORY_NAMES,
  insertTransactionByDate,
  replaceTransactionByDate,
} from '@/utils/transaction';
import type { Subscription } from '@/utils/subscription';
import type { Budget } from '@/lib/repository';
import {
  clearAllData as repoClearAllData,
  convertCurrencyInDB,
  deleteAccount,
  deleteBudget as repoDeleteBudget,
  deleteCustomCategory as repoDeleteCustomCategory,
  deleteSubscription as repoDeleteSubscription,
  deleteTransaction as repoDeleteTransaction,
  fetchAccounts,
  fetchBudgets,
  fetchCategoryOrder,
  fetchCustomCategories,
  fetchDeletedDefaultCategories,
  fetchProfile,
  fetchSubscriptions,
  fetchTransactions,
  fetchWalletOrder,
  insertAccount,
  insertBudget,
  insertCustomCategory,
  insertDeletedDefaultCategory,
  insertSubscription,
  insertTransaction,
  reassignSubscriptionsCategory,
  reassignSubscriptionsWallet,
  reassignTransactionsCategory,
  reassignTransactionsWallet,
  saveCategoryOrder,
  saveProfile,
  saveWalletOrder,
  seedDemoData as repoSeedDemoData,
  setDefaultWallet as repoSetDefaultWallet,
  updateAccount,
  updateBudget as repoUpdateBudget,
  updateBudgetsCategory,
  updateSubscription as repoUpdateSubscription,
  updateTransaction as repoUpdateTransaction,
} from '@/lib/repository';
import { getDatabase } from '@/lib/database';
import { adjustAccountBalance, computeTransactionDelta, computeTransferDelta } from '@/lib/balance';
import { processSubscriptionBilling } from '@/lib/billing';
import { newId } from '@/lib/id';
import type { UserProfile } from '../types';
import { createInitialAppData, getState, setState } from './state';
import { selectSortedCategories, sortAccounts, type SortedCategoryItem } from './selectors';

export interface AppActions {
  addWallet: (wallet: Omit<Account, 'id' | 'isDefault'>) => void;
  updateWallet: (updated: Account) => void;
  deleteWallet: (id: string) => Promise<{ blocked: boolean; newDefaultName?: string }>;
  setDefaultWallet: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (updated: Transaction) => Promise<void>;
  clearAllData: () => void;
  seedDemoData: () => Promise<void>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
  completeOnboarding: (data: { name: string; avatar: string | null }) => Promise<void>;
  updateCurrencyAndConvert: (
    rate: number,
    symbol: string,
    code: string,
    shouldConvert: boolean
  ) => Promise<void>;
  refreshAllData: () => Promise<void>;
  addCustomCategory: (category: Omit<CustomCategory, 'id'>) => void;
  updateCustomCategory: (category: CustomCategory, oldName?: string) => Promise<void>;
  deleteCustomCategory: (id: string) => Promise<void>;
  deleteDefaultCategory: (name: string) => Promise<void>;
  getSortedCategories: (type: 'expense' | 'income') => SortedCategoryItem[];
  updateCategoryOrder: (type: 'expense' | 'income', order: string[]) => void;
  getSortedAccounts: () => Account[];
  updateWalletOrder: (order: string[]) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  addSubscription: (sub: Omit<Subscription, 'id'>) => Promise<void>;
  updateSubscription: (sub: Subscription) => Promise<void>;
  deleteSubscription: (id: string) => void;
}

/**
 * Per-wallet balance deltas for a transaction. Transfers hit two wallets
 * (source -amount, destination +amount); income/expense hit one.
 */
function transactionDeltas(tx: Transaction, direction: 'apply' | 'reverse'): Map<string, number> {
  const deltas = new Map<string, number>();
  const add = (walletId: string | undefined, delta: number) => {
    if (!walletId) return;
    deltas.set(walletId, (deltas.get(walletId) ?? 0) + delta);
  };

  if (tx.type === 'transfer') {
    add(tx.walletId, computeTransferDelta('from', tx.amount, direction));
    add(tx.toWalletId, computeTransferDelta('to', tx.amount, direction));
  } else {
    add(tx.walletId, computeTransactionDelta(tx.type, tx.amount, direction));
  }
  return deltas;
}

function applyDeltas(
  accounts: Account[],
  deltas: Map<string, number>,
  currencySymbol: string
): { accounts: Account[]; updatedAccounts: Account[] } {
  const updatedAccounts: Account[] = [];
  const nextAccounts = accounts.map((account) => {
    const delta = deltas.get(account.id);
    if (delta === undefined || delta === 0) return account;
    const updated = adjustAccountBalance(account, delta, currencySymbol);
    updatedAccounts.push(updated);
    return updated;
  });
  return { accounts: nextAccounts, updatedAccounts };
}

const addCustomCategory: AppActions['addCustomCategory'] = (catData) => {
  const { customCategories } = getState();
  const existing = customCategories.some(
    (c) => c.name.toLowerCase() === catData.name.toLowerCase() && c.type === catData.type
  );
  if (existing) return;

  const newCategory: CustomCategory = { ...catData, id: newId() };
  setState((state) => ({ customCategories: [...state.customCategories, newCategory] }));
  insertCustomCategory(newCategory);
};

const updateCustomCategory: AppActions['updateCustomCategory'] = async (updatedCat, oldName) => {
  if (oldName && oldName !== updatedCat.name) {
    const wasDefault = DEFAULT_CATEGORY_NAMES.has(oldName.toLowerCase());
    await reassignTransactionsCategory(oldName, updatedCat.name);
    await reassignSubscriptionsCategory(oldName, updatedCat.name);
    await updateBudgetsCategory(oldName, updatedCat.name);
    setState((state) => ({
      transactions: state.transactions.map((t) =>
        t.category === oldName ? { ...t, category: updatedCat.name } : t
      ),
      budgets: state.budgets.map((b) =>
        b.category === oldName ? { ...b, category: updatedCat.name } : b
      ),
      subscriptions: state.subscriptions.map((s) =>
        s.category === oldName ? { ...s, category: updatedCat.name } : s
      ),
    }));

    // Keep the reorder data in sync so a renamed category keeps its place.
    if (updatedCat.type === 'expense' || updatedCat.type === 'income') {
      const orderList = getState().categoryOrder[updatedCat.type];
      if (orderList && orderList.length > 0) {
        const nextOrder = orderList.map((n) => (n === oldName ? updatedCat.name : n));
        if (nextOrder.join('\u0000') !== orderList.join('\u0000')) {
          saveCategoryOrder(updatedCat.type, nextOrder);
          setState((state) => ({
            categoryOrder: { ...state.categoryOrder, [updatedCat.type]: nextOrder },
          }));
        }
      }
    }

    // A rename that started from a default category retires the old default
    // so its name disappears everywhere (it becomes a custom category now).
    if (wasDefault) {
      await insertDeletedDefaultCategory(oldName);
      setState((state) => ({
        deletedDefaultCategories: state.deletedDefaultCategories.includes(oldName)
          ? state.deletedDefaultCategories
          : [...state.deletedDefaultCategories, oldName],
      }));
    }
  }
  setState((state) => ({
    customCategories: state.customCategories.map((c) => (c.id === updatedCat.id ? updatedCat : c)),
  }));
  await insertCustomCategory(updatedCat);
};

const deleteCustomCategory: AppActions['deleteCustomCategory'] = async (id) => {
  // Extract data before any async work.
  const category = getState().customCategories.find((c) => c.id === id);

  // DB writes first (before state updates, to avoid UI flashing inconsistent data).
  if (category) {
    await reassignTransactionsCategory(category.name, 'Others');
    await updateBudgetsCategory(category.name, 'Others');
  }
  await repoDeleteCustomCategory(id);

  // State updates after DB is committed.
  setState((state) => ({
    transactions: category
      ? state.transactions.map((t) =>
          t.category === category.name ? { ...t, category: 'Others' } : t
        )
      : state.transactions,
    budgets: category
      ? state.budgets.map((b) => (b.category === category.name ? { ...b, category: 'Others' } : b))
      : state.budgets,
    customCategories: state.customCategories.filter((c) => c.id !== id),
  }));
};

const deleteDefaultCategory: AppActions['deleteDefaultCategory'] = async (name) => {
  await reassignTransactionsCategory(name, 'Others');
  await updateBudgetsCategory(name, 'Others');
  setState((state) => ({
    transactions: state.transactions.map((t) =>
      t.category === name ? { ...t, category: 'Others' } : t
    ),
    budgets: state.budgets.map((b) => (b.category === name ? { ...b, category: 'Others' } : b)),
  }));
  await insertDeletedDefaultCategory(name);
  setState((state) => ({
    deletedDefaultCategories: [...state.deletedDefaultCategories, name],
  }));
};

const updateCategoryOrder: AppActions['updateCategoryOrder'] = (type, order) => {
  setState((state) => ({ categoryOrder: { ...state.categoryOrder, [type]: order } }));
  saveCategoryOrder(type, order);
};

const getSortedCategories: AppActions['getSortedCategories'] = (type) => {
  const state = getState();
  return selectSortedCategories(
    type,
    state.customCategories,
    state.deletedDefaultCategories,
    state.categoryOrder
  );
};

const updateWalletOrder: AppActions['updateWalletOrder'] = (order) => {
  setState({ walletOrder: order });
  saveWalletOrder(order);
};

const getSortedAccounts: AppActions['getSortedAccounts'] = () => {
  const state = getState();
  return sortAccounts(state.accounts, state.walletOrder);
};

const addWallet: AppActions['addWallet'] = (walletData) => {
  const newWallet: Account = {
    ...walletData,
    id: newId(),
    isDefault: getState().accounts.length === 0,
  };
  setState((state) => ({ accounts: [...state.accounts, newWallet] }));
  insertAccount(newWallet);
};

const updateWallet: AppActions['updateWallet'] = (updated) => {
  setState((state) => ({
    accounts: state.accounts.map((acc) => (acc.id === updated.id ? updated : acc)),
  }));
  updateAccount(updated);
};

const deleteWallet: AppActions['deleteWallet'] = async (id) => {
  const wallet = getState().accounts.find((a) => a.id === id);
  if (!wallet) return { blocked: false };

  const current = getState().accounts;
  if (current.length === 1) {
    return { blocked: true };
  }

  const others = current.filter((a) => a.id !== id);
  const targetWallet = others.find((a) => a.isDefault) ?? others[0];

  // Reassign transactions + subscriptions in state and DB.
  setState((state) => ({
    transactions: state.transactions.map((tx) => ({
      ...tx,
      walletId: tx.walletId === id ? targetWallet.id : tx.walletId,
      toWalletId: tx.toWalletId === id ? targetWallet.id : tx.toWalletId,
    })),
    subscriptions: state.subscriptions.map((sub) =>
      sub.wallet_id === id ? { ...sub, wallet_id: targetWallet.id } : sub
    ),
  }));
  await reassignTransactionsWallet(id, targetWallet.id);
  await reassignSubscriptionsWallet(id, targetWallet.id);

  // Re-read after the awaits so a concurrent wallet change is not clobbered.
  const latestAccounts = getState().accounts;
  const latestWallet = latestAccounts.find((a) => a.id === id) ?? wallet;
  const latestOthers = latestAccounts.filter((a) => a.id !== id);
  const latestTarget =
    latestOthers.find((a) => a.id === targetWallet.id) ??
    latestOthers.find((a) => a.isDefault) ??
    latestOthers[0];

  const walletBalance = parseBalance(latestWallet.balance);
  const isDefault = latestWallet.isDefault;

  // walletBalance already includes net flow of its transactions, so use it directly.
  let updatedTarget: Account | undefined;
  const newAccounts = latestOthers.map((a) => {
    if (a.id === latestTarget.id) {
      updatedTarget = adjustAccountBalance(a, walletBalance, getState().userProfile.currencySymbol);
      return updatedTarget;
    }
    return a;
  });

  // If target not found in filtered (shouldn't happen), just filter.
  if (!updatedTarget && newAccounts.length > 0 && isDefault) {
    newAccounts[0] = { ...newAccounts[0], isDefault: true };
  } else if (isDefault && updatedTarget && !updatedTarget.isDefault) {
    updatedTarget.isDefault = true;
  }

  setState({ accounts: newAccounts });

  // DB side effects in a transaction for atomicity.
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    if (updatedTarget) {
      await updateAccount(updatedTarget);
    } else if (isDefault && newAccounts.length > 0) {
      await updateAccount(newAccounts[0]);
    }
    await deleteAccount(id);
  });

  setState((state) => {
    const filtered = state.walletOrder.filter((wid) => wid !== id);
    saveWalletOrder(filtered);
    return { walletOrder: filtered };
  });

  return {
    blocked: false,
    newDefaultName: isDefault ? latestTarget.name : undefined,
  };
};

const setDefaultWallet: AppActions['setDefaultWallet'] = (id) => {
  setState((state) => ({
    accounts: state.accounts.map((acc) => ({ ...acc, isDefault: acc.id === id })),
  }));
  repoSetDefaultWallet(id);
};

const addTransaction: AppActions['addTransaction'] = async (txData) => {
  const newTx: Transaction = { ...txData, id: newId() };
  const snapshot = getState();
  const deltas = transactionDeltas(newTx, 'apply');
  const { accounts: nextAccounts, updatedAccounts } = applyDeltas(
    snapshot.accounts,
    deltas,
    snapshot.userProfile.currencySymbol
  );

  setState({
    transactions: insertTransactionByDate(snapshot.transactions, newTx),
    accounts: nextAccounts,
  });

  // DB writes after state is committed (not inside an updater).
  await insertTransaction(newTx);
  for (const updated of updatedAccounts) {
    await updateAccount(updated);
  }
};

const deleteTransaction: AppActions['deleteTransaction'] = async (id) => {
  const snapshot = getState();
  const tx = snapshot.transactions.find((t) => t.id === id);
  let nextAccounts = snapshot.accounts;
  let updatedAccounts: Account[] = [];

  if (tx) {
    const deltas = transactionDeltas(tx, 'reverse');
    const applied = applyDeltas(snapshot.accounts, deltas, snapshot.userProfile.currencySymbol);
    nextAccounts = applied.accounts;
    updatedAccounts = applied.updatedAccounts;
  }

  setState({
    accounts: nextAccounts,
    transactions: snapshot.transactions.filter((t) => t.id !== id),
  });

  // DB write after state is committed.
  await repoDeleteTransaction(id);
  for (const updated of updatedAccounts) {
    await updateAccount(updated);
  }
};

const updateTransaction: AppActions['updateTransaction'] = async (updatedTx) => {
  const snapshot = getState();
  const oldTx = snapshot.transactions.find((t) => t.id === updatedTx.id);
  let nextAccounts = snapshot.accounts;
  let updatedAccounts: Account[] = [];

  if (oldTx) {
    // Net the reversed old effect against the applied new effect so the same
    // wallet (e.g. in-place edits) settles to a single write.
    const netDeltas = new Map<string, number>();
    for (const [id, delta] of transactionDeltas(oldTx, 'reverse')) {
      netDeltas.set(id, (netDeltas.get(id) ?? 0) + delta);
    }
    for (const [id, delta] of transactionDeltas(updatedTx, 'apply')) {
      netDeltas.set(id, (netDeltas.get(id) ?? 0) + delta);
    }
    const applied = applyDeltas(snapshot.accounts, netDeltas, snapshot.userProfile.currencySymbol);
    nextAccounts = applied.accounts;
    updatedAccounts = applied.updatedAccounts;
  }

  // Keep date order (the date may have changed) without re-sorting.
  setState({
    accounts: nextAccounts,
    transactions: replaceTransactionByDate(snapshot.transactions, updatedTx),
  });

  // DB writes after state is committed.
  await repoUpdateTransaction(updatedTx);
  for (const updated of updatedAccounts) {
    await updateAccount(updated);
  }
};

const addSubscription: AppActions['addSubscription'] = async (subData) => {
  const snapshot = getState();
  const newSub: Subscription = { ...subData, id: newId() };
  const { txs, updatedAccount, nextDate } = processSubscriptionBilling(
    newSub,
    snapshot.accounts,
    snapshot.userProfile.currencySymbol
  );
  const billingAccount = snapshot.accounts.find((a) => a.id === updatedAccount?.id);
  const accountDelta =
    updatedAccount && billingAccount
      ? parseBalance(updatedAccount.balance) - parseBalance(billingAccount.balance)
      : 0;

  for (const tx of txs) {
    setState((state) => ({ transactions: [tx, ...state.transactions] }));
    await insertTransaction(tx);
  }

  if (updatedAccount) {
    setState((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === updatedAccount.id
          ? adjustAccountBalance(account, accountDelta, state.userProfile.currencySymbol)
          : account
      ),
    }));
    const freshAccount =
      getState().accounts.find((account) => account.id === updatedAccount.id) ?? updatedAccount;
    await updateAccount(freshAccount);
  }

  if (txs.length > 0) {
    newSub.next_billing_date = nextDate;
  }

  setState((state) => ({ subscriptions: [...state.subscriptions, newSub] }));
  await insertSubscription(newSub);
};

const updateSubscription: AppActions['updateSubscription'] = async (updated) => {
  const snapshot = getState();
  const subToSave = { ...updated };
  const { txs, updatedAccount, nextDate } = processSubscriptionBilling(
    subToSave,
    snapshot.accounts,
    snapshot.userProfile.currencySymbol
  );
  const billingAccount = snapshot.accounts.find((a) => a.id === updatedAccount?.id);
  const accountDelta =
    updatedAccount && billingAccount
      ? parseBalance(updatedAccount.balance) - parseBalance(billingAccount.balance)
      : 0;

  for (const tx of txs) {
    setState((state) => ({ transactions: [tx, ...state.transactions] }));
    await insertTransaction(tx);
  }

  if (updatedAccount) {
    setState((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === updatedAccount.id
          ? adjustAccountBalance(account, accountDelta, state.userProfile.currencySymbol)
          : account
      ),
    }));
    const freshAccount =
      getState().accounts.find((account) => account.id === updatedAccount.id) ?? updatedAccount;
    await updateAccount(freshAccount);
  }

  if (txs.length > 0) {
    subToSave.next_billing_date = nextDate;
  }

  setState((state) => ({
    subscriptions: state.subscriptions.map((s) => (s.id === subToSave.id ? subToSave : s)),
  }));
  await repoUpdateSubscription(subToSave);
};

const deleteSubscription: AppActions['deleteSubscription'] = (id) => {
  setState((state) => ({ subscriptions: state.subscriptions.filter((s) => s.id !== id) }));
  repoDeleteSubscription(id);
};

const addBudget: AppActions['addBudget'] = (budget) => {
  const newBudget = { ...budget, id: newId() };
  setState((state) => ({ budgets: [...state.budgets, newBudget] }));
  insertBudget(newBudget);
};

const updateBudget: AppActions['updateBudget'] = (updatedBudget) => {
  setState((state) => ({
    budgets: state.budgets.map((b) => (b.id === updatedBudget.id ? updatedBudget : b)),
  }));
  repoUpdateBudget(updatedBudget);
};

const deleteBudget: AppActions['deleteBudget'] = (id) => {
  setState((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) }));
  repoDeleteBudget(id);
};

const updateUserProfile: AppActions['updateUserProfile'] = async (profile) => {
  setState({ userProfile: profile });
  await saveProfile(profile);
};

const completeOnboarding: AppActions['completeOnboarding'] = async (data) => {
  const profile = {
    ...getState().userProfile,
    name: data.name,
    avatar: data.avatar,
    hasOnboarded: true,
  };
  setState({ userProfile: profile });
  await saveProfile(profile);
};

const updateCurrencyAndConvert: AppActions['updateCurrencyAndConvert'] = async (
  rate,
  symbol,
  code,
  shouldConvert
) => {
  if (shouldConvert) {
    await convertCurrencyInDB(rate, symbol);
  }

  const newProfile = { ...getState().userProfile, currencySymbol: symbol, currencyCode: code };
  await saveProfile(newProfile);
  setState({ userProfile: newProfile });

  if (shouldConvert) {
    const storedAccounts = (await fetchAccounts()).map(deserializeAccount);
    setState({ accounts: storedAccounts });
    setState({ transactions: await fetchTransactions() });
    setState({ budgets: await fetchBudgets() });
    setState({ subscriptions: await fetchSubscriptions() });
  }
};

const refreshAllData: AppActions['refreshAllData'] = async () => {
  const storedAccounts = (await fetchAccounts()).map(deserializeAccount);
  const storedTransactions = await fetchTransactions();
  const storedCategories = await fetchCustomCategories();
  const storedDeletedDefaults = await fetchDeletedDefaultCategories();
  const expenseOrder = (await fetchCategoryOrder('expense')) || [];
  const incomeOrder = (await fetchCategoryOrder('income')) || [];
  const storedWalletOrder = (await fetchWalletOrder()) || [];
  const storedBudgets = await fetchBudgets();
  const storedSubscriptions = await fetchSubscriptions();
  const storedProfile = (await fetchProfile()) || {
    name: 'User',
    currencySymbol: '$',
    currencyCode: 'USD',
    avatar: null,
    hasOnboarded: false,
  };

  setState({
    accounts: storedAccounts,
    transactions: storedTransactions,
    customCategories: storedCategories,
    deletedDefaultCategories: storedDeletedDefaults,
    categoryOrder: { expense: expenseOrder, income: incomeOrder },
    walletOrder: storedWalletOrder,
    budgets: storedBudgets,
    subscriptions: storedSubscriptions,
    userProfile: storedProfile,
  });
};

const clearAllData: AppActions['clearAllData'] = () => {
  // `ready` describes the initialization boundary, not user data; keep it so
  // clearing data does not send the app back behind the splash gate.
  setState({ ...createInitialAppData(), ready: getState().ready });
  repoClearAllData();
};

const seedDemoData: AppActions['seedDemoData'] = async () => {
  try {
    await repoSeedDemoData(getState().userProfile.currencySymbol);
    const storedAccounts = (await fetchAccounts()).map(deserializeAccount);
    const storedTransactions = await fetchTransactions();
    const storedBudgets = await fetchBudgets();
    const storedSubscriptions = await fetchSubscriptions();
    const storedCategories = await fetchCustomCategories();
    const storedDeletedDefaults = await fetchDeletedDefaultCategories();
    const storedExpenseOrder = (await fetchCategoryOrder('expense')) || [];
    const storedIncomeOrder = (await fetchCategoryOrder('income')) || [];
    const storedWalletOrder = (await fetchWalletOrder()) || [];

    setState({
      accounts: storedAccounts,
      transactions: storedTransactions,
      budgets: storedBudgets,
      subscriptions: storedSubscriptions,
      customCategories: storedCategories,
      deletedDefaultCategories: storedDeletedDefaults,
      categoryOrder: { expense: storedExpenseOrder, income: storedIncomeOrder },
      walletOrder: storedWalletOrder,
    });
  } catch (err) {
    console.error('Seed demo data failed:', err);
    throw err;
  }
};

/** Frozen so consumers can safely use actions in dependency arrays. */
export const actions: AppActions = Object.freeze({
  addWallet,
  updateWallet,
  deleteWallet,
  setDefaultWallet,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  clearAllData,
  seedDemoData,
  updateUserProfile,
  completeOnboarding,
  updateCurrencyAndConvert,
  refreshAllData,
  addCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
  deleteDefaultCategory,
  getSortedCategories,
  updateCategoryOrder,
  getSortedAccounts,
  updateWalletOrder,
  addBudget,
  updateBudget,
  deleteBudget,
  addSubscription,
  updateSubscription,
  deleteSubscription,
});
