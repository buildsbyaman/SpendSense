import React, { createContext, useContext, useEffect } from 'react';
import {
  fetchCustomCategories,
  fetchDeletedDefaultCategories,
  fetchCategoryOrder,
  fetchWalletOrder,
} from '@/lib/repository';
import { loadInitialData } from './initSnapshot';
import type { AppContextType } from './types';
import { useAppCore } from './state/core';
import { useCategoriesState } from './state/useCategoriesState';
import { useWalletsState } from './state/useWalletsState';
import { useTransactionsState } from './state/useTransactionsState';
import { useSubscriptionsState } from './state/useSubscriptionsState';
import { useBudgetsState } from './state/useBudgetsState';
import { useProfileState } from './hooks/useProfileState';
import { useDataManagement } from './hooks/useDataManagement';

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

  const { updateUserProfile, completeOnboarding, updateCurrencyAndConvert } = useProfileState({
    userProfile: core.userProfile,
    setUserProfile: core.setUserProfile,
    setAccounts: core.setAccounts,
    setTransactions: core.setTransactions,
    setBudgets: core.setBudgets,
    setSubscriptions: core.setSubscriptions,
  });

  const { refreshAllData, clearAllData, seedDemoData } = useDataManagement({
    setAccounts: core.setAccounts,
    setTransactions: core.setTransactions,
    setCustomCategories: core.setCustomCategories,
    setDeletedDefaultCategories: core.setDeletedDefaultCategories,
    setCategoryOrder: core.setCategoryOrder,
    setWalletOrder: core.setWalletOrder,
    setBudgets: core.setBudgets,
    setSubscriptions: core.setSubscriptions,
    setUserProfile: core.setUserProfile,
    userProfile: core.userProfile,
  });

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
