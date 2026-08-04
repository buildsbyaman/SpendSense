import { useCallback } from 'react';
import { fetchAccounts, fetchTransactions, fetchCustomCategories, fetchDeletedDefaultCategories, fetchCategoryOrder, fetchWalletOrder, fetchBudgets, fetchSubscriptions, fetchProfile, clearAllData as repoClearAllData, seedDemoData as repoSeedDemoData, saveProfile, convertCurrencyInDB } from '@/lib/repository';
import { deserializeAccount } from '@/utils/wallet';

interface ProfileData {
  name: string;
  currencySymbol: string;
  currencyCode: string;
  avatar: string | null;
  hasOnboarded: boolean;
}

interface UseDataManagementProps {
  setAccounts: React.Dispatch<React.SetStateAction<any[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  setCustomCategories: React.Dispatch<React.SetStateAction<any[]>>;
  setDeletedDefaultCategories: React.Dispatch<React.SetStateAction<any[]>>;
  setCategoryOrder: React.Dispatch<React.SetStateAction<{ expense: string[]; income: string[] }>>;
  setWalletOrder: React.Dispatch<React.SetStateAction<string[]>>;
  setBudgets: React.Dispatch<React.SetStateAction<any[]>>;
  setSubscriptions: React.Dispatch<React.SetStateAction<any[]>>;
  setUserProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  userProfile: ProfileData;
}

export function useDataManagement({
  setAccounts,
  setTransactions,
  setCustomCategories,
  setDeletedDefaultCategories,
  setCategoryOrder,
  setWalletOrder,
  setBudgets,
  setSubscriptions,
  setUserProfile,
  userProfile,
}: UseDataManagementProps) {
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
      throw err;
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

  return { refreshAllData, clearAllData, seedDemoData };
}
