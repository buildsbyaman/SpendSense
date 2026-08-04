import type { Account } from '@/utils/wallet';
import type { Transaction, CustomCategory } from '@/utils/transaction';
import type { Budget } from '@/lib/repository';
import type { Subscription } from '@/utils/subscription';

export interface AppContextType {
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
  updateCustomCategory: (category: CustomCategory, oldName?: string) => Promise<void>;
  deleteCustomCategory: (id: string) => void;
  deletedDefaultCategories: string[];
  deleteDefaultCategory: (name: string) => void;
  categoryOrder: { expense: string[]; income: string[] };
  updateCategoryOrder: (type: 'expense' | 'income', order: string[]) => void;
  getSortedCategories: (
    type: 'expense' | 'income'
  ) => (CustomCategory | { name: string; isDefault: boolean })[];
  walletOrder: string[];
  updateWalletOrder: (order: string[]) => void;
  getSortedAccounts: () => Account[];
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  subscriptions: Subscription[];
  addSubscription: (sub: Omit<Subscription, 'id'>) => Promise<void>;
  updateSubscription: (sub: Subscription) => Promise<void>;
  deleteSubscription: (id: string) => void;
}

export type UserProfile = {
  name: string;
  currencySymbol: string;
  currencyCode: string;
  avatar: string | null;
  hasOnboarded: boolean;
};
