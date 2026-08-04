import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { deserializeAccount } from '@/utils/wallet';
import {
  fetchAccounts,
  fetchTransactions,
  fetchBudgets,
  fetchSubscriptions,
  fetchCustomCategories,
  fetchDeletedDefaultCategories,
  fetchCategoryOrder,
  fetchWalletOrder,
  fetchProfile,
  saveProfile,
  clearAllData as repoClearAllData,
  seedDemoData as repoSeedDemoData,
  convertCurrencyInDB,
} from '@/lib/repository';
import { loadInitialData } from './initSnapshot';
import type { AppContextType } from './types';
import { useAppCore } from './state/core';
import { useCategoriesState } from './state/useCategoriesState';
import { useWalletsState } from './state/useWalletsState';
import { useTransactionsState } from './state/useTransactionsState';
import { useSubscriptionsState } from './state/useSubscriptionsState';
import { useBudgetsState } from './state/useBudgetsState';

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const core = useAppCore();
  const {
    accounts,
    setAccounts,
    transactions,
    setTransactions,
    customCategories,
    setCustomCategories,
    deletedDefaultCategories,
    setDeletedDefaultCategories,
    categoryOrder,
    setCategoryOrder,
    walletOrder,
    setWalletOrder,
    userProfile,
    setUserProfile,
    budgets,
    setBudgets,
    subscriptions,
    setSubscriptions,
    ready,
    setReady,
  } = core;

  const {
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    deleteDefaultCategory,
    updateCategoryOrder,
    getSortedCategories,
  } = useCategoriesState(core);
  const {
    addWallet,
    updateWallet,
    deleteWallet,
    setDefaultWallet,
    updateWalletOrder,
    getSortedAccounts,
  } = useWalletsState(core);
  const { addTransaction, deleteTransaction, updateTransaction } = useTransactionsState(core);
  const { addSubscription, updateSubscription, deleteSubscription } = useSubscriptionsState(core);
  const { addBudget, updateBudget, deleteBudget } = useBudgetsState(core);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snapshot = await loadInitialData();
        if (cancelled) return;
        setAccounts(snapshot.accounts);
        setTransactions(snapshot.transactions);
        setCustomCategories(snapshot.customCategories);
        setDeletedDefaultCategories(snapshot.deletedDefaultCategories);
        setCategoryOrder({ expense: snapshot.expenseOrder, income: snapshot.incomeOrder });
        setWalletOrder(snapshot.walletOrder);
        setUserProfile(snapshot.profile);
        setBudgets(snapshot.budgets);
        setSubscriptions(snapshot.subscriptions);
        setReady(true);
      } catch (err) {
        console.error('App init failed:', err);
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Setters are stable; the effect must run once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setAccounts(storedAccounts);
    setTransactions(storedTransactions);
    setCustomCategories(storedCategories);
    setDeletedDefaultCategories(storedDeletedDefaults);
    setCategoryOrder({ expense: expenseOrder, income: incomeOrder });
    setWalletOrder(storedWalletOrder);
    setBudgets(storedBudgets);
    setSubscriptions(storedSubscriptions);
    setUserProfile(storedProfile);
  }, [
    setAccounts,
    setTransactions,
    setCustomCategories,
    setDeletedDefaultCategories,
    setCategoryOrder,
    setWalletOrder,
    setBudgets,
    setSubscriptions,
    setUserProfile,
  ]);

  const clearAllData = useCallback(() => {
    setAccounts([]);
    setTransactions([]);
    setCustomCategories([]);
    setBudgets([]);
    setSubscriptions([]);
    setDeletedDefaultCategories([]);
    setCategoryOrder({ expense: [], income: [] });
    setWalletOrder([]);
    setUserProfile({
      name: 'User',
      currencySymbol: '$',
      currencyCode: 'USD',
      avatar: null,
      hasOnboarded: false,
    });
    repoClearAllData();
  }, [
    setAccounts,
    setTransactions,
    setCustomCategories,
    setBudgets,
    setSubscriptions,
    setDeletedDefaultCategories,
    setCategoryOrder,
    setWalletOrder,
    setUserProfile,
  ]);

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
      const storedWalletOrder = (await fetchWalletOrder()) || [];
      setAccounts(storedAccounts);
      setTransactions(storedTransactions);
      setBudgets(storedBudgets);
      setSubscriptions(storedSubscriptions);
      setCustomCategories(storedCategories);
      setDeletedDefaultCategories(storedDeletedDefaults);
      setCategoryOrder({ expense: storedExpenseOrder, income: storedIncomeOrder });
      setWalletOrder(storedWalletOrder);
    } catch (err) {
      console.error('Seed demo data failed:', err);
    }
  }, [
    userProfile.currencySymbol,
    setAccounts,
    setTransactions,
    setBudgets,
    setSubscriptions,
    setCustomCategories,
    setDeletedDefaultCategories,
    setCategoryOrder,
    setWalletOrder,
  ]);

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
        updateTransaction,
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
        updateCustomCategory,
        deleteCustomCategory,
        deletedDefaultCategories,
        deleteDefaultCategory,
        categoryOrder,
        updateCategoryOrder,
        getSortedCategories,
        walletOrder,
        updateWalletOrder,
        getSortedAccounts,
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

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
