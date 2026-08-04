import { useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { Account } from '@/utils/wallet';
import type { Transaction, CustomCategory } from '@/utils/transaction';
import type { Subscription } from '@/utils/subscription';
import type { Budget } from '@/lib/repository';
import type { UserProfile } from '../types';

export interface AppCore {
  accounts: Account[];
  setAccounts: Dispatch<SetStateAction<Account[]>>;
  accountsRef: { current: Account[] };
  transactions: Transaction[];
  setTransactions: Dispatch<SetStateAction<Transaction[]>>;
  transactionsRef: { current: Transaction[] };
  customCategories: CustomCategory[];
  setCustomCategories: Dispatch<SetStateAction<CustomCategory[]>>;
  deletedDefaultCategories: string[];
  setDeletedDefaultCategories: Dispatch<SetStateAction<string[]>>;
  categoryOrder: { expense: string[]; income: string[] };
  setCategoryOrder: Dispatch<SetStateAction<{ expense: string[]; income: string[] }>>;
  walletOrder: string[];
  setWalletOrder: Dispatch<SetStateAction<string[]>>;
  userProfile: UserProfile;
  setUserProfile: Dispatch<SetStateAction<UserProfile>>;
  budgets: Budget[];
  setBudgets: Dispatch<SetStateAction<Budget[]>>;
  subscriptions: Subscription[];
  setSubscriptions: Dispatch<SetStateAction<Subscription[]>>;
  ready: boolean;
  setReady: Dispatch<SetStateAction<boolean>>;
}

/**
 * Owns every piece of app state plus the accounts/transactions refs. The refs
 * are re-synced on every render so long-lived callbacks never read a stale
 * snapshot. The domain hooks (useWalletsState, useTransactionsState, ...)
 * receive this core and only add callbacks on top.
 */
export function useAppCore(): AppCore {
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
  const [walletOrder, setWalletOrder] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'User',
    currencySymbol: '$',
    currencyCode: 'USD',
    avatar: null,
    hasOnboarded: false,
  });
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [ready, setReady] = useState(false);

  return {
    accounts,
    setAccounts,
    accountsRef,
    transactions,
    setTransactions,
    transactionsRef,
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
  };
}
