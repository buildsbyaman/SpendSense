import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Account, formatWalletBalance, parseBalance } from '@/utils/wallet';
import { type Transaction, type CustomCategory, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/utils/transaction';
import { Landmark, Wallet, Smartphone } from 'lucide-react-native';
import { getDatabase } from '@/lib/database';
import {
  fetchAccounts,
  insertAccount,
  updateAccount,
  deleteAccount,
  deleteTransactionsForWallet,
  setDefaultWallet as repoSetDefaultWallet,
  fetchTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction as repoDeleteTransaction,
  reassignTransactionsCategory,
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
} from '@/lib/repository';

interface AppContextType {
  accounts: Account[];
  transactions: Transaction[];
  addWallet: (wallet: Omit<Account, 'id' | 'isDefault'>) => void;
  updateWallet: (updated: Account) => void;
  deleteWallet: (id: string) => void;
  setDefaultWallet: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (updated: Transaction) => void;
  clearAllData: () => void;
  seedDemoData: () => Promise<void>;
  userProfile: { name: string };
  updateUserProfile: (profile: { name: string }) => void;
  customCategories: CustomCategory[];
  addCustomCategory: (category: Omit<CustomCategory, 'id'>) => void;
  deleteCustomCategory: (id: string) => void;
  deletedDefaultCategories: string[];
  deleteDefaultCategory: (name: string) => void;
  categoryOrder: { expense: string[]; income: string[] };
  updateCategoryOrder: (type: 'expense' | 'income', order: string[]) => void;
  getSortedCategories: (type: 'expense' | 'income') => (CustomCategory | { name: string; isDefault: boolean })[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [deletedDefaultCategories, setDeletedDefaultCategories] = useState<string[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<{ expense: string[]; income: string[] }>({ expense: [], income: [] });
  const [userProfile, setUserProfile] = useState<{ name: string }>({ name: 'User' });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await getDatabase();
      const storedAccounts = (await fetchAccounts()).map(deserializeAccount);
      const storedTransactions = await fetchTransactions();
      const storedCategories = await fetchCustomCategories();
      const storedDeletedDefaults = await fetchDeletedDefaultCategories();
      const expenseOrder = await fetchCategoryOrder('expense') || [];
      const incomeOrder = await fetchCategoryOrder('income') || [];
      const storedProfile = await fetchProfile();
      setAccounts(storedAccounts);
      setTransactions(storedTransactions);
      setCustomCategories(storedCategories);
      setDeletedDefaultCategories(storedDeletedDefaults);
      setCategoryOrder({ expense: expenseOrder, income: incomeOrder });
      if (storedProfile) setUserProfile(storedProfile);
      setReady(true);
    })();
  }, []);

  const updateUserProfile = useCallback((profile: { name: string }) => {
    setUserProfile(profile);
    saveProfile(profile);
  }, []);

  const addCustomCategory = useCallback((catData: Omit<CustomCategory, 'id'>) => {
    const newCategory: CustomCategory = {
      ...catData,
      id: Date.now().toString(),
    };
    setCustomCategories((prev) => [...prev, newCategory]);
    insertCustomCategory(newCategory);
  }, []);

  const deleteCustomCategory = useCallback(async (id: string) => {
    const category = customCategories.find(c => c.id === id);
    if (category) {
      await reassignTransactionsCategory(category.name, 'Others');
      setTransactions((prev) => prev.map(t => t.category === category.name ? { ...t, category: 'Others' } : t));
    }
    await repoDeleteCustomCategory(id);
    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
  }, [customCategories]);

  const deleteDefaultCategory = useCallback(async (name: string) => {
    await reassignTransactionsCategory(name, 'Others');
    setTransactions((prev) => prev.map(t => t.category === name ? { ...t, category: 'Others' } : t));
    await insertDeletedDefaultCategory(name);
    setDeletedDefaultCategories((prev) => [...prev, name]);
  }, []);

  const updateCategoryOrder = useCallback((type: 'expense' | 'income', order: string[]) => {
    setCategoryOrder((prev) => ({ ...prev, [type]: order }));
    saveCategoryOrder(type, order);
  }, []);

  const getSortedCategories = useCallback((type: 'expense' | 'income') => {
    const defaultCats = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const activeDefault = defaultCats
      .filter((c) => !deletedDefaultCategories.includes(c.name))
      .map((c) => ({ name: c.name, isDefault: true } as any));
    
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
  }, [customCategories, deletedDefaultCategories, categoryOrder]);

  const addWallet = useCallback(
    (walletData: Omit<Account, 'id' | 'isDefault'>) => {
      const isFirst = accounts.length === 0;
      const newWallet: Account = {
        ...walletData,
        id: Date.now().toString(),
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

  const deleteWallet = useCallback((id: string) => {
    setAccounts((prev) => {
      const filtered = prev.filter((acc) => acc.id !== id);
      if (prev.find((acc) => acc.id === id)?.isDefault && filtered.length > 0) {
        const newDefault = { ...filtered[0], isDefault: true };
        filtered[0] = newDefault;
        updateAccount(newDefault);
      }
      return filtered;
    });
    setTransactions((prev) => prev.filter((tx) => tx.walletId !== id));
    deleteAccount(id);
    deleteTransactionsForWallet(id);
  }, []);

  const setDefaultWallet = useCallback((id: string) => {
    setAccounts((prev) => prev.map((acc) => ({ ...acc, isDefault: acc.id === id })));
    repoSetDefaultWallet(id);
  }, []);

  const addTransaction = useCallback((txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...txData, id: Date.now().toString() };
    setTransactions((prev) => [newTx, ...prev]);
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === txData.walletId) {
          const currentVal = parseBalance(acc.balance);
          const diff = txData.type === 'income' ? txData.amount : -txData.amount;
          const updated = { ...acc, balance: formatWalletBalance((currentVal + diff).toString()) };
          updateAccount(updated);
          return updated;
        }
        return acc;
      })
    );
    insertTransaction(newTx);
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const tx = prev.find((t) => t.id === id);
      if (tx) {
        setAccounts((prevAcc) =>
          prevAcc.map((acc) => {
            if (acc.id === tx.walletId) {
              const currentVal = parseBalance(acc.balance);
              const diff = tx.type === 'income' ? -tx.amount : tx.amount;
              const updated = {
                ...acc,
                balance: formatWalletBalance((currentVal + diff).toString()),
              };
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
  }, []);

  const updateTransactionFn = useCallback((updatedTx: Transaction) => {
    setTransactions((prev) => {
      const oldTx = prev.find((t) => t.id === updatedTx.id);
      if (oldTx) {
        setAccounts((prevAcc) =>
          prevAcc.map((acc) => {
            if (acc.id === oldTx.walletId) {
              const currentVal = parseBalance(acc.balance);
              const diff = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
              const updated = {
                ...acc,
                balance: formatWalletBalance((currentVal + diff).toString()),
              };
              updateAccount(updated);
              return updated;
            }
            if (acc.id === updatedTx.walletId) {
              const currentVal = parseBalance(acc.balance);
              const diff = updatedTx.type === 'income' ? updatedTx.amount : -updatedTx.amount;
              const updated = {
                ...acc,
                balance: formatWalletBalance((currentVal + diff).toString()),
              };
              updateAccount(updated);
              return updated;
            }
            return acc;
          })
        );
      }
      return prev.map((t) => (t.id === updatedTx.id ? updatedTx : t));
    });
    updateTransaction(updatedTx);
  }, []);

  const clearAllData = useCallback(() => {
    setAccounts([]);
    setTransactions([]);
    setCustomCategories([]);
    setUserProfile({ name: 'User' });
    clearAll();
  }, []);

  const seedDemoData = useCallback(async () => {
    await repoSeedDemoData();
    const storedAccounts = (await fetchAccounts()).map(deserializeAccount);
    const storedTransactions = await fetchTransactions();
    setAccounts(storedAccounts);
    setTransactions(storedTransactions);
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
        customCategories,
        addCustomCategory,
        deleteCustomCategory,
        deletedDefaultCategories,
        deleteDefaultCategory,
        categoryOrder,
        updateCategoryOrder,
        getSortedCategories,
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
