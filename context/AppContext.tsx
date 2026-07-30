import React, { createContext, useContext, useState, useEffect } from 'react';
import { type Account, formatWalletBalance, parseBalance } from '@/utils/wallet';
import { type Transaction } from '@/utils/transaction';
import { Landmark, Wallet } from 'lucide-react-native';

interface AppContextType {
  accounts: Account[];
  transactions: Transaction[];
  addWallet: (wallet: Omit<Account, 'id' | 'isDefault'>) => void;
  updateWallet: (updated: Account) => void;
  deleteWallet: (id: string) => void;
  setDefaultWallet: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Seed initial accounts so the user has something to interact with right away
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      name: 'HDFC Bank',
      number: '8748 7347 8378 4344',
      balance: '$8,745.00',
      icon: Landmark,
      type: 'Bank',
      isDefault: true,
    },
    {
      id: '2',
      name: 'Cash',
      number: '',
      balance: '$350.00',
      icon: Wallet,
      type: 'Cash',
      isDefault: false,
    }
  ]);
  
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 't1',
      title: 'Salary Credit',
      amount: 5000,
      type: 'income',
      category: 'Salary',
      date: new Date(Date.now() - 3600000 * 24).toISOString(), // Yesterday
      walletId: '1',
    },
    {
      id: 't2',
      title: 'Grocery Shopping',
      amount: 45,
      type: 'expense',
      category: 'Food',
      date: new Date().toISOString(), // Today
      walletId: '2',
    }
  ]);

  const addWallet = (walletData: Omit<Account, 'id' | 'isDefault'>) => {
    const isFirst = accounts.length === 0;
    const newWallet: Account = {
      ...walletData,
      id: Date.now().toString(),
      isDefault: isFirst,
    };
    setAccounts(prev => [...prev, newWallet]);
  };

  const updateWallet = (updated: Account) => {
    setAccounts(prev => prev.map(acc => acc.id === updated.id ? updated : acc));
  };

  const deleteWallet = (id: string) => {
    setAccounts(prev => {
      const filtered = prev.filter(acc => acc.id !== id);
      // If deleted was default, make the first remaining wallet default
      if (prev.find(acc => acc.id === id)?.isDefault && filtered.length > 0) {
        filtered[0] = { ...filtered[0], isDefault: true };
      }
      return filtered;
    });
    // Remove transactions associated with this wallet
    setTransactions(prev => prev.filter(tx => tx.walletId !== id));
  };

  const setDefaultWallet = (id: string) => {
    setAccounts(prev => prev.map(acc => ({
      ...acc,
      isDefault: acc.id === id
    })));
  };

  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: Date.now().toString(),
    };
    
    // Add transaction
    setTransactions(prev => [newTx, ...prev]);

    // Adjust wallet balance
    setAccounts(prev => prev.map(acc => {
      if (acc.id === txData.walletId) {
        const currentVal = parseBalance(acc.balance);
        const diff = txData.type === 'income' ? txData.amount : -txData.amount;
        const newVal = currentVal + diff;
        return {
          ...acc,
          balance: formatWalletBalance(newVal.toString())
        };
      }
      return acc;
    }));
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Remove transaction
    setTransactions(prev => prev.filter(t => t.id !== id));

    // Revert wallet balance (inverse of transaction action)
    setAccounts(prev => prev.map(acc => {
      if (acc.id === tx.walletId) {
        const currentVal = parseBalance(acc.balance);
        const diff = tx.type === 'income' ? -tx.amount : tx.amount;
        const newVal = currentVal + diff;
        return {
          ...acc,
          balance: formatWalletBalance(newVal.toString())
        };
      }
      return acc;
    }));
  };

  return (
    <AppContext.Provider value={{
      accounts,
      transactions,
      addWallet,
      updateWallet,
      deleteWallet,
      setDefaultWallet,
      addTransaction,
      deleteTransaction
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
