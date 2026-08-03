import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { type Account, formatWalletBalance, parseBalance } from '@/utils/wallet';
import { adjustAccountBalance, computeTransactionDelta } from '@/lib/balance';
import {
  type Transaction,
  type CustomCategory,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '@/utils/transaction';
import { type Subscription, getNextBillingDate } from '@/utils/subscription';
import { Landmark, Wallet, Smartphone } from 'lucide-react-native';
import { getDatabase } from '@/lib/database';
import { newId } from '@/lib/id';
import {
  fetchAccounts,
  insertAccount,
  updateAccount,
  deleteAccount,
  setDefaultWallet as repoSetDefaultWallet,
  fetchTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction as repoDeleteTransaction,
  reassignTransactionsCategory,
  reassignTransactionsWallet,
  reassignSubscriptionsWallet,
  fetchCustomCategories,
  insertCustomCategory,
  deleteCustomCategory as repoDeleteCustomCategory,
  insertDeletedDefaultCategory,
  fetchDeletedDefaultCategories,
  fetchCategoryOrder,
  saveCategoryOrder,
  fetchProfile,
  saveProfile,
  clearAll,
  seedDemoData as repoSeedDemoData,
  type Budget,
  fetchBudgets,
  insertBudget,
  updateBudget as repoUpdateBudget,
  deleteBudget as repoDeleteBudget,
  updateBudgetsCategory,
  fetchSubscriptions,
  insertSubscription,
  updateSubscription as repoUpdateSubscription,
  deleteSubscription as repoDeleteSubscription,
  convertCurrencyInDB,
} from '@/lib/repository';

interface AppContextType {
  accounts: Account[];
  transactions: Transaction[];
  addWallet: (wallet: Omit<Account, 'id' | 'isDefault'>) => void;
  updateWallet: (updated: Account) => void;
  deleteWallet: (id: string) => Promise<{ blocked: boolean; newDefaultName?: string }>;
  setDefaultWallet: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (updated: Transaction) => void;
  clearAllData: () => void;
  seedDemoData: () => Promise<void>;
  userProfile: {
    name: string;
    currencySymbol: string;
    currencyCode: string;
    avatar: string | null;
    hasOnboarded: boolean;
  };
  updateUserProfile: (profile: {
    name: string;
    currencySymbol: string;
    currencyCode: string;
    avatar: string | null;
    hasOnboarded: boolean;
  }) => void;
  completeOnboarding: (data: { name: string; avatar: string | null }) => void;
  ready: boolean;
  updateCurrencyAndConvert: (
    rate: number,
    symbol: string,
    code: string,
    shouldConvert: boolean
  ) => Promise<void>;
  refreshAllData: () => Promise<void>;
  customCategories: CustomCategory[];
  addCustomCategory: (category: Omit<CustomCategory, 'id'>) => void;
  deleteCustomCategory: (id: string) => void;
  deletedDefaultCategories: string[];
  deleteDefaultCategory: (name: string) => void;
  categoryOrder: { expense: string[]; income: string[] };
  updateCategoryOrder: (type: 'expense' | 'income', order: string[]) => void;
  getSortedCategories: (
    type: 'expense' | 'income'
  ) => (CustomCategory | { name: string; isDefault: boolean })[];
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  subscriptions: Subscription[];
  addSubscription: (sub: Omit<Subscription, 'id'>) => Promise<void>;
  updateSubscription: (sub: Subscription) => Promise<void>;
  deleteSubscription: (id: string) => void;
}

interface BillingResult {
  txs: Transaction[];
  updatedAccount?: Account;
  nextDate: string;
}

function processSubscriptionBilling(
  sub: Subscription,
  accounts: Account[],
  currencySymbol: string
): BillingResult {
  if (sub.is_active !== 1 || !sub.wallet_id) {
    return { txs: [], nextDate: sub.next_billing_date };
  }

  const now = new Date();
  let nextDate = new Date(sub.next_billing_date);
  const txs: Transaction[] = [];
  let acc = accounts.find((a) => a.id === sub.wallet_id) ?? undefined;
  let iterations = 0;

  while (nextDate <= now && iterations < 24) {
    if (sub.end_date && nextDate > new Date(sub.end_date)) break;

    txs.push({
      id: newId(),
      title: sub.name,
      amount: sub.amount,
      type: 'expense',
      category: sub.category,
      date: nextDate.toISOString(),
      walletId: sub.wallet_id,
    });

    if (acc) {
      acc = adjustAccountBalance(acc, computeTransactionDelta('expense', sub.amount, 'apply'), currencySymbol);
    }

    nextDate = getNextBillingDate(nextDate, sub.cycle);
    iterations++;
  }

  // Fast-forward past now if still overdue after capped loop
  while (nextDate <= now) {
    nextDate = getNextBillingDate(nextDate, sub.cycle);
  }

  return { txs, updatedAccount: acc, nextDate: nextDate.toISOString() };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const accountsRef = useRef(accounts);
  const transactionsRef = useRef(transactions);
  accountsRef.current = accounts;
  transactionsRef.current = transactions;
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [deletedDefaultCategories, setDeletedDefaultCategories] = useState<string[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<{ expense: string[]; income: string[] }>({
    expense: [],
    income: [],
  });
  const [userProfile, setUserProfile] = useState<{
    name: string;
    currencySymbol: string;
    currencyCode: string;
    avatar: string | null;
    hasOnboarded: boolean;
  }>({ name: 'User', currencySymbol: '$', currencyCode: 'USD', avatar: null, hasOnboarded: false });
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getDatabase();
        const storedAccounts = (await fetchAccounts()).map(deserializeAccount);
        const storedTransactions = await fetchTransactions();
        const storedCategories = await fetchCustomCategories();
        const storedDeletedDefaults = await fetchDeletedDefaultCategories();
        const expenseOrder = (await fetchCategoryOrder('expense')) || [];
        const incomeOrder = (await fetchCategoryOrder('income')) || [];
        const storedProfile = (await fetchProfile()) || {
          name: 'User',
          currencySymbol: '$',
          currencyCode: 'USD',
          avatar: null,
          hasOnboarded: false,
        };
        const storedBudgets = await fetchBudgets();
        const storedSubscriptions = await fetchSubscriptions();

        // Handle auto-billing for active subscriptions (cap at 24 iterations)
        for (const sub of storedSubscriptions) {
          const { txs, updatedAccount, nextDate } = processSubscriptionBilling(
            sub,
            storedAccounts,
            storedProfile.currencySymbol
          );

          for (const tx of txs) {
            await insertTransaction(tx);
            storedTransactions.push(tx);
          }

          if (updatedAccount) {
            const existing = storedAccounts.find((a) => a.id === updatedAccount.id);
            if (existing) Object.assign(existing, updatedAccount);
            await updateAccount(updatedAccount);
          }

          if (txs.length > 0) {
            sub.next_billing_date = nextDate;
            await repoUpdateSubscription(sub);
          }
        }

        if (cancelled) return;
        setAccounts(storedAccounts);
        setTransactions(storedTransactions);
        setCustomCategories(storedCategories);
        setDeletedDefaultCategories(storedDeletedDefaults);
        setCategoryOrder({ expense: expenseOrder, income: incomeOrder });
        setUserProfile(storedProfile);
        setBudgets(storedBudgets);
        setSubscriptions(storedSubscriptions);
        setReady(true);
      } catch (err) {
        console.error('App init failed:', err);
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateUserProfile = async (profile: {
    name: string;
    currencySymbol: string;
    currencyCode: string;
    avatar: string | null;
    hasOnboarded: boolean;
  }) => {
    setUserProfile(profile);
    await saveProfile(profile);
  };

  const completeOnboarding = async (data: { name: string; avatar: string | null }) => {
    const profile = { ...userProfile, name: data.name, avatar: data.avatar, hasOnboarded: true };
    setUserProfile(profile);
    await saveProfile(profile);
  };

  const updateCurrencyAndConvert = async (
    rate: number,
    symbol: string,
    code: string,
    shouldConvert: boolean
  ) => {
    if (shouldConvert) {
      await convertCurrencyInDB(rate, symbol);
    }

    // Always update the profile to the new currency
    const newProfile = { ...userProfile, currencySymbol: symbol, currencyCode: code };
    await saveProfile(newProfile);
    setUserProfile(newProfile);

    // Refresh all state if we converted
    if (shouldConvert) {
      const storedAccounts = (await fetchAccounts()).map(deserializeAccount);
      setAccounts(storedAccounts);
      setTransactions(await fetchTransactions());
      setBudgets(await fetchBudgets());
      setSubscriptions(await fetchSubscriptions());
    }
  };

  const refreshAllData = useCallback(async () => {
    const storedAccounts = (await fetchAccounts()).map(deserializeAccount);
    const storedTransactions = await fetchTransactions();
    const storedCategories = await fetchCustomCategories();
    const storedDeletedDefaults = await fetchDeletedDefaultCategories();
    const expenseOrder = (await fetchCategoryOrder('expense')) || [];
    const incomeOrder = (await fetchCategoryOrder('income')) || [];
    const storedBudgets = await fetchBudgets();
    const storedSubscriptions = await fetchSubscriptions();
    const storedProfile = (await fetchProfile()) || {
      name: 'User',
      currencySymbol: '$',
      currencyCode: 'USD',
      avatar: null,
      hasOnboarded: false,
    };
    setAccounts(storedAccounts);
    setTransactions(storedTransactions);
    setCustomCategories(storedCategories);
    setDeletedDefaultCategories(storedDeletedDefaults);
    setCategoryOrder({ expense: expenseOrder, income: incomeOrder });
    setBudgets(storedBudgets);
    setSubscriptions(storedSubscriptions);
    setUserProfile(storedProfile);
  }, []);

  const addCustomCategory = useCallback((catData: Omit<CustomCategory, 'id'>) => {
    // Skip if a category with the same name already exists (case-insensitive)
    const existing = customCategories.some(
      (c) => c.name.toLowerCase() === catData.name.toLowerCase() && c.type === catData.type
    );
    if (existing) return;

    const newCategory: CustomCategory = {
      ...catData,
      id: newId(),
    };
    setCustomCategories((prev) => [...prev, newCategory]);
    insertCustomCategory(newCategory);
  }, [customCategories]);

  const deleteCustomCategory = useCallback(
    async (id: string) => {
      // Extract data before any async work
      const category = customCategories.find((c) => c.id === id);

      // DB writes first (before state updates, to avoid UI flashing inconsistent data)
      if (category) {
        await reassignTransactionsCategory(category.name, 'Others');
        await updateBudgetsCategory(category.name, 'Others');
      }
      await repoDeleteCustomCategory(id);

      // State updates after DB is committed
      if (category) {
        setTransactions((prev) =>
          prev.map((t) => (t.category === category.name ? { ...t, category: 'Others' } : t))
        );
        setBudgets((prev) =>
          prev.map((b) => (b.category === category.name ? { ...b, category: 'Others' } : b))
        );
      }
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
    },
    [customCategories]
  );

  const deleteDefaultCategory = useCallback(async (name: string) => {
    await reassignTransactionsCategory(name, 'Others');
    await updateBudgetsCategory(name, 'Others');
    setTransactions((prev) =>
      prev.map((t) => (t.category === name ? { ...t, category: 'Others' } : t))
    );
    setBudgets((prev) => prev.map((b) => (b.category === name ? { ...b, category: 'Others' } : b)));
    await insertDeletedDefaultCategory(name);
    setDeletedDefaultCategories((prev) => [...prev, name]);
  }, []);

  const updateCategoryOrder = useCallback((type: 'expense' | 'income', order: string[]) => {
    setCategoryOrder((prev) => ({ ...prev, [type]: order }));
    saveCategoryOrder(type, order);
  }, []);

  const getSortedCategories = useCallback(
    (type: 'expense' | 'income') => {
      const defaultCats = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
      const activeDefault = defaultCats
        .filter((c) => !deletedDefaultCategories.includes(c.name))
        .map((c) => ({ name: c.name, isDefault: true }) as any);

      const activeCustom = customCategories.filter(
        (c) =>
          c.type === type &&
          // Exclude custom categories that shadow a default name
          !defaultCats.some((d) => d.name.toLowerCase() === c.name.toLowerCase())
      );
      const combined = [...activeDefault, ...activeCustom];

      const orderList = categoryOrder[type];
      if (!orderList || orderList.length === 0) return combined;

      return combined.sort((a, b) => {
        const idxA = orderList.indexOf(a.name);
        const idxB = orderList.indexOf(b.name);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    },
    [customCategories, deletedDefaultCategories, categoryOrder]
  );

  const addWallet = useCallback(
    (walletData: Omit<Account, 'id' | 'isDefault'>) => {
      const isFirst = accountsRef.current.length === 0;
      const newWallet: Account = {
        ...walletData,
        id: newId(),
        isDefault: isFirst,
      };
      setAccounts((prev) => [...prev, newWallet]);
      insertAccount(newWallet);
    },
    []
  );

  const updateWallet = useCallback((updated: Account) => {
    setAccounts((prev) => prev.map((acc) => (acc.id === updated.id ? updated : acc)));
    updateAccount(updated);
  }, []);

  const deleteWallet = useCallback(
    async (id: string): Promise<{ blocked: boolean; newDefaultName?: string }> => {
      const current = accountsRef.current;
      const wallet = current.find((a) => a.id === id);
      if (!wallet) return { blocked: false };

      if (current.length === 1) {
        return { blocked: true };
      }

      const others = current.filter((a) => a.id !== id);
      const isDefault = wallet.isDefault;
      const targetWallet = others.find((a) => a.isDefault) ?? others[0];

      // Reassign transactions + subscriptions in state and DB
      setTransactions((prev) =>
        prev.map((tx) => (tx.walletId === id ? { ...tx, walletId: targetWallet.id } : tx))
      );
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.wallet_id === id ? { ...sub, wallet_id: targetWallet.id } : sub
        )
      );
      await reassignTransactionsWallet(id, targetWallet.id);
      await reassignSubscriptionsWallet(id, targetWallet.id);

      // Compute new accounts state (pure — no side effects)
      // walletBalance already includes net flow of its transactions, so use it directly
      const walletBalance = parseBalance(wallet.balance);

      let updatedTarget: Account | undefined;
      const newAccounts = current
        .filter((a) => a.id !== id)
        .map((a) => {
          if (a.id === targetWallet.id) {
            updatedTarget = adjustAccountBalance(a, walletBalance, userProfile.currencySymbol);
            return updatedTarget;
          }
          return a;
        });

      // If target not found in filtered (shouldn't happen), just filter
      if (!updatedTarget && newAccounts.length > 0 && isDefault) {
        newAccounts[0] = { ...newAccounts[0], isDefault: true };
      } else if (isDefault && updatedTarget && !updatedTarget.isDefault) {
        updatedTarget.isDefault = true;
      }

      setAccounts(newAccounts);

      // DB side effects in a transaction for atomicity
      const db = await getDatabase();
      await db.withTransactionAsync(async () => {
        if (updatedTarget) {
          await updateAccount(updatedTarget);
        } else if (isDefault && newAccounts.length > 0) {
          await updateAccount(newAccounts[0]);
        }
        await deleteAccount(id);
      });

      return { blocked: false, newDefaultName: isDefault ? targetWallet.name : undefined };
    },
    [userProfile.currencySymbol]
  );

  const setDefaultWallet = useCallback((id: string) => {
    setAccounts((prev) => prev.map((acc) => ({ ...acc, isDefault: acc.id === id })));
    repoSetDefaultWallet(id);
  }, []);

  const addTransaction = useCallback(
    (txData: Omit<Transaction, 'id'>) => {
      const newTx: Transaction = { ...txData, id: newId() };
      setTransactions((prev) => [newTx, ...prev]);

      // Compute account update outside state updater (pure computation)
      const delta = computeTransactionDelta(txData.type, txData.amount, 'apply');
      let updatedAccount: Account | undefined;
      const newAccounts = accounts.map((acc) => {
        if (acc.id === txData.walletId) {
          updatedAccount = adjustAccountBalance(acc, delta, userProfile.currencySymbol);
          return updatedAccount;
        }
        return acc;
      });
      setAccounts(newAccounts);

      // DB writes after state is committed (not inside updater)
      insertTransaction(newTx);
      if (updatedAccount) {
        updateAccount(updatedAccount);
      }
    },
    [accounts, userProfile.currencySymbol]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      const currentAccounts = accountsRef.current;
      const currentTransactions = transactionsRef.current;
      const tx = currentTransactions.find((t) => t.id === id);
      let updatedAccount: Account | undefined;
      if (tx) {
        const delta = computeTransactionDelta(tx.type, tx.amount, 'reverse');
        const newAccounts = currentAccounts.map((acc) => {
          if (acc.id === tx.walletId) {
            updatedAccount = adjustAccountBalance(acc, delta, userProfile.currencySymbol);
            return updatedAccount;
          }
          return acc;
        });
        setAccounts(newAccounts);
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      // DB write after state is committed
      repoDeleteTransaction(id);
      if (updatedAccount) {
        updateAccount(updatedAccount);
      }
    },
    [userProfile.currencySymbol]
  );

  const updateTransactionFn = useCallback(
    (updatedTx: Transaction) => {
      const currentAccounts = accountsRef.current;
      const currentTransactions = transactionsRef.current;
      const oldTx = currentTransactions.find((t) => t.id === updatedTx.id);
      const accountUpdates = new Map<string, Account>();
      if (oldTx) {
        const newAccounts = currentAccounts.map((acc) => {
          let delta = 0;
          if (acc.id === oldTx.walletId) {
            delta += computeTransactionDelta(oldTx.type, oldTx.amount, 'reverse');
          }
          if (acc.id === updatedTx.walletId) {
            delta += computeTransactionDelta(updatedTx.type, updatedTx.amount, 'apply');
          }
          if (delta === 0) return acc;
          const updated = adjustAccountBalance(acc, delta, userProfile.currencySymbol);
          accountUpdates.set(acc.id, updated);
          return updated;
        });
        setAccounts(newAccounts);
      }
      // Re-sort by date (date may have changed)
      setTransactions((prev) =>
        [...prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );

      // DB writes after state is committed
      updateTransaction(updatedTx);
      for (const updated of accountUpdates.values()) {
        updateAccount(updated);
      }
    },
    [userProfile.currencySymbol]
  );

  const clearAllData = useCallback(() => {
    setAccounts([]);
    setTransactions([]);
    setCustomCategories([]);
    setBudgets([]);
    setSubscriptions([]);
    setDeletedDefaultCategories([]);
    setCategoryOrder({ expense: [], income: [] });
    setUserProfile({
      name: 'User',
      currencySymbol: '$',
      currencyCode: 'USD',
      avatar: null,
      hasOnboarded: false,
    });
    clearAll();
  }, []);

  const seedDemoData = useCallback(async () => {
    try {
      await repoSeedDemoData(userProfile.currencySymbol);
      const storedAccounts = (await fetchAccounts()).map(deserializeAccount);
      const storedTransactions = await fetchTransactions();
      const storedBudgets = await fetchBudgets();
      const storedSubscriptions = await fetchSubscriptions();
      const storedCategories = await fetchCustomCategories();
      const storedDeletedDefaults = await fetchDeletedDefaultCategories();
      const storedExpenseOrder = (await fetchCategoryOrder('expense')) || [];
      const storedIncomeOrder = (await fetchCategoryOrder('income')) || [];
      setAccounts(storedAccounts);
      setTransactions(storedTransactions);
      setBudgets(storedBudgets);
      setSubscriptions(storedSubscriptions);
      setCustomCategories(storedCategories);
      setDeletedDefaultCategories(storedDeletedDefaults);
      setCategoryOrder({ expense: storedExpenseOrder, income: storedIncomeOrder });
    } catch (err) {
      console.error('Seed demo data failed:', err);
    }
  }, [userProfile.currencySymbol]);

  const addBudget = useCallback((budget: Omit<Budget, 'id'>) => {
    const newBudget = { ...budget, id: newId() };
    setBudgets((prev) => [...prev, newBudget]);
    insertBudget(newBudget);
  }, []);

  const updateBudget = useCallback((updatedBudget: Budget) => {
    setBudgets((prev) => prev.map((b) => (b.id === updatedBudget.id ? updatedBudget : b)));
    repoUpdateBudget(updatedBudget);
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    repoDeleteBudget(id);
  }, []);

  const addSubscription = useCallback(
    async (subData: Omit<Subscription, 'id'>) => {
      const newSub: Subscription = {
        ...subData,
        id: newId(),
      };

      const { txs, updatedAccount, nextDate } = processSubscriptionBilling(
        newSub,
        accounts,
        userProfile.currencySymbol
      );

      for (const tx of txs) {
        setTransactions((prev) => [tx, ...prev]);
        await insertTransaction(tx);
      }

      if (updatedAccount) {
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === updatedAccount.id ? updatedAccount : acc))
        );
        await updateAccount(updatedAccount);
      }

      if (txs.length > 0) {
        newSub.next_billing_date = nextDate;
      }

      setSubscriptions((prev) => [...prev, newSub]);
      await insertSubscription(newSub);
    },
    [accounts, userProfile.currencySymbol]
  );

  const updateSubscription = useCallback(
    async (updated: Subscription) => {
      const subToSave = { ...updated };

      const { txs, updatedAccount, nextDate } = processSubscriptionBilling(
        subToSave,
        accounts,
        userProfile.currencySymbol
      );

      for (const tx of txs) {
        setTransactions((prev) => [tx, ...prev]);
        await insertTransaction(tx);
      }

      if (updatedAccount) {
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === updatedAccount.id ? updatedAccount : acc))
        );
        await updateAccount(updatedAccount);
      }

      if (txs.length > 0) {
        subToSave.next_billing_date = nextDate;
      }

      setSubscriptions((prev) => prev.map((s) => (s.id === subToSave.id ? subToSave : s)));
      await repoUpdateSubscription(subToSave);
    },
    [accounts, userProfile.currencySymbol]
  );

  const deleteSubscription = useCallback((id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    repoDeleteSubscription(id);
  }, []);

  return (
    <AppContext.Provider
      value={{
        accounts,
        transactions,
        addWallet,
        updateWallet,
        deleteWallet,
        setDefaultWallet,
        addTransaction,
        deleteTransaction,
        updateTransaction: updateTransactionFn,
        clearAllData,
        seedDemoData,
        userProfile,
        updateUserProfile,
        completeOnboarding,
        ready,
        updateCurrencyAndConvert,
        refreshAllData,
        customCategories,
        addCustomCategory,
        deleteCustomCategory,
        deletedDefaultCategories,
        deleteDefaultCategory,
        categoryOrder,
        updateCategoryOrder,
        getSortedCategories,
        budgets,
        addBudget,
        updateBudget,
        deleteBudget,
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
      }}>
      {children}
    </AppContext.Provider>
  );
}

function deserializeAccount(data: {
  id: string;
  name: string;
  number: string;
  balance: string;
  type: string;
  isDefault?: boolean;
}): Account {
  const iconMap: Record<string, typeof Wallet> = {
    Bank: Landmark,
    Card: Wallet,
    Digital: Smartphone,
  };
  return { ...data, icon: iconMap[data.type] ?? Wallet };
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
