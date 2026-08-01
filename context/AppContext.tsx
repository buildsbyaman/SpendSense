import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  deleteWallet: (id: string) => { blocked: boolean; newDefaultName?: string };
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
        const now = new Date();
        for (const sub of storedSubscriptions) {
          if (sub.is_active === 1) {
            let nextDate = new Date(sub.next_billing_date);
            let changed = false;
            let iterations = 0;
            while (nextDate <= now && iterations < 24) {
              if (sub.end_date && nextDate > new Date(sub.end_date)) break;

              const tx: Transaction = {
                id: newId(),
                title: sub.name,
                amount: sub.amount,
                type: 'expense',
                category: sub.category,
                date: nextDate.toISOString(),
                walletId: sub.wallet_id,
              };
              await insertTransaction(tx);
              storedTransactions.push(tx);

              const acc = storedAccounts.find((a) => a.id === sub.wallet_id);
              if (acc) {
                const updated = adjustAccountBalance(
                  acc,
                  -sub.amount,
                  storedProfile.currencySymbol
                );
                Object.assign(acc, updated);
                await updateAccount(acc);
              }

              nextDate = getNextBillingDate(nextDate, sub.cycle);
              sub.next_billing_date = nextDate.toISOString();
              changed = true;
              iterations++;
            }
            if (changed) {
              await repoUpdateSubscription(sub);
            }
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
    const newCategory: CustomCategory = {
      ...catData,
      id: newId(),
    };
    setCustomCategories((prev) => [...prev, newCategory]);
    insertCustomCategory(newCategory);
  }, []);

  const deleteCustomCategory = useCallback(
    async (id: string) => {
      const category = customCategories.find((c) => c.id === id);
      if (category) {
        await reassignTransactionsCategory(category.name, 'Others');
        await updateBudgetsCategory(category.name, 'Others');
        setTransactions((prev) =>
          prev.map((t) => (t.category === category.name ? { ...t, category: 'Others' } : t))
        );
        setBudgets((prev) =>
          prev.map((b) => (b.category === category.name ? { ...b, category: 'Others' } : b))
        );
      }
      await repoDeleteCustomCategory(id);
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

      const activeCustom = customCategories.filter((c) => c.type === type);
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
      const isFirst = accounts.length === 0;
      const newWallet: Account = {
        ...walletData,
        id: newId(),
        isDefault: isFirst,
      };
      setAccounts((prev) => [...prev, newWallet]);
      insertAccount(newWallet);
    },
    [accounts.length]
  );

  const updateWallet = useCallback((updated: Account) => {
    setAccounts((prev) => prev.map((acc) => (acc.id === updated.id ? updated : acc)));
    updateAccount(updated);
  }, []);

  const deleteWallet = useCallback(
    (id: string): { blocked: boolean; newDefaultName?: string } => {
      const current = accounts;
      const wallet = current.find((a) => a.id === id);
      if (!wallet) return { blocked: false };

      if (current.length === 1) {
        return { blocked: true };
      }

      const others = current.filter((a) => a.id !== id);
      const isDefault = wallet.isDefault;
      let newDefaultWallet = others.find((a) => a.isDefault) ?? others[0];

      // Reassign transactions + subscriptions in DB and in state
      reassignTransactionsWallet(id, newDefaultWallet.id);
      reassignSubscriptionsWallet(id, newDefaultWallet.id);
      setTransactions((prev) =>
        prev.map((tx) => (tx.walletId === id ? { ...tx, walletId: newDefaultWallet.id } : tx))
      );
      setSubscriptions((prev) =>
        prev.map((sub) => (sub.wallet_id === id ? { ...sub, wallet_id: newDefaultWallet.id } : sub))
      );

      // Net-transfer the balance effect of moved transactions to the target wallet
      setAccounts((prev) => {
        const filtered = prev.filter((a) => a.id !== id);
        const target = filtered.find((a) => a.id === newDefaultWallet.id);
        if (target) {
          const netDelta = transactions
            .filter((tx) => tx.walletId === id)
            .reduce((sum, tx) => sum + computeTransactionDelta(tx.type, tx.amount, 'apply'), 0);
          if (netDelta !== 0) {
            const updated = adjustAccountBalance(target, netDelta, userProfile.currencySymbol);
            updateAccount(updated);
            return filtered.map((a) => (a.id === target.id ? updated : a));
          }
        }
        if (isDefault) {
          const promoted = { ...filtered[0], isDefault: true };
          filtered[0] = promoted;
          updateAccount(promoted);
          newDefaultWallet = promoted;
        }
        return filtered;
      });

      deleteAccount(id);
      return { blocked: false, newDefaultName: isDefault ? newDefaultWallet.name : undefined };
    },
    [accounts, transactions, userProfile.currencySymbol]
  );

  const setDefaultWallet = useCallback((id: string) => {
    setAccounts((prev) => prev.map((acc) => ({ ...acc, isDefault: acc.id === id })));
    repoSetDefaultWallet(id);
  }, []);

  const addTransaction = useCallback(
    (txData: Omit<Transaction, 'id'>) => {
      const newTx: Transaction = { ...txData, id: newId() };
      setTransactions((prev) => [newTx, ...prev]);
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === txData.walletId) {
            const delta = computeTransactionDelta(txData.type, txData.amount, 'apply');
            const updated = adjustAccountBalance(acc, delta, userProfile.currencySymbol);
            updateAccount(updated);
            return updated;
          }
          return acc;
        })
      );
      insertTransaction(newTx);
    },
    [userProfile.currencySymbol]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => {
        const tx = prev.find((t) => t.id === id);
        if (tx) {
          setAccounts((prevAcc) =>
            prevAcc.map((acc) => {
              if (acc.id === tx.walletId) {
                const delta = computeTransactionDelta(tx.type, tx.amount, 'reverse');
                const updated = adjustAccountBalance(acc, delta, userProfile.currencySymbol);
                updateAccount(updated);
                return updated;
              }
              return acc;
            })
          );
        }
        return prev.filter((t) => t.id !== id);
      });
      repoDeleteTransaction(id);
    },
    [userProfile.currencySymbol]
  );

  const updateTransactionFn = useCallback(
    (updatedTx: Transaction) => {
      setTransactions((prev) => {
        const oldTx = prev.find((t) => t.id === updatedTx.id);
        if (oldTx) {
          setAccounts((prevAcc) =>
            prevAcc.map((acc) => {
              let delta = 0;
              if (acc.id === oldTx.walletId) {
                delta += computeTransactionDelta(oldTx.type, oldTx.amount, 'reverse');
              }
              if (acc.id === updatedTx.walletId) {
                delta += computeTransactionDelta(updatedTx.type, updatedTx.amount, 'apply');
              }
              if (delta === 0) return acc;
              const updated = adjustAccountBalance(acc, delta, userProfile.currencySymbol);
              updateAccount(updated);
              return updated;
            })
          );
        }
        return prev.map((t) => (t.id === updatedTx.id ? updatedTx : t));
      });
      updateTransaction(updatedTx);
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

      if (newSub.is_active === 1) {
        const now = new Date();
        let nextDate = new Date(newSub.next_billing_date);
        let iterations = 0;
        while (nextDate <= now && iterations < 24) {
          if (newSub.end_date && nextDate > new Date(newSub.end_date)) break;

          addTransaction({
            title: newSub.name,
            amount: newSub.amount,
            type: 'expense',
            category: newSub.category,
            date: nextDate.toISOString(),
            walletId: newSub.wallet_id,
          });
          nextDate = getNextBillingDate(nextDate, newSub.cycle);
          iterations++;
        }
        newSub.next_billing_date = nextDate.toISOString();
      }

      setSubscriptions((prev) => [...prev, newSub]);
      await insertSubscription(newSub);
    },
    [addTransaction]
  );

  const updateSubscription = useCallback(
    async (updated: Subscription) => {
      const subToSave = { ...updated };
      if (subToSave.is_active === 1) {
        const now = new Date();
        let nextDate = new Date(subToSave.next_billing_date);
        let iterations = 0;
        while (nextDate <= now && iterations < 24) {
          if (subToSave.end_date && nextDate > new Date(subToSave.end_date)) break;

          addTransaction({
            title: subToSave.name,
            amount: subToSave.amount,
            type: 'expense',
            category: subToSave.category,
            date: nextDate.toISOString(),
            walletId: subToSave.wallet_id,
          });
          nextDate = getNextBillingDate(nextDate, subToSave.cycle);
          iterations++;
        }
        subToSave.next_billing_date = nextDate.toISOString();
      }

      setSubscriptions((prev) => prev.map((s) => (s.id === subToSave.id ? subToSave : s)));
      await repoUpdateSubscription(subToSave);
    },
    [addTransaction]
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
