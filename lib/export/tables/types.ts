import { type Transaction } from '@/utils/transaction';
import { type Subscription } from '@/utils/subscription';
import { type UserProfile } from '@/lib/repository';

export type ExportType =
  | 'transactions'
  | 'subscriptions'
  | 'wallets'
  | 'balances'
  | 'budgets'
  | 'categories'
  | 'profile'
  | 'alldata';

export type PeriodMode = 'all' | 'month' | 'year' | 'custom';

export interface ExportSelection {
  types: ExportType[];
  period: {
    mode: PeriodMode;
    year?: number;
    month?: number;
    from?: Date;
    to?: Date;
  };
  format: 'json' | 'xlsx' | 'pdf';
}

export interface ExportedTable {
  title: string;
  columns: string[];
  rows: Record<string, string | number>[];
}

export interface AppState {
  transactions: Transaction[];
  accounts: {
    id: string;
    name: string;
    number: string;
    balance: string;
    type: string;
    isDefault?: boolean;
  }[];
  budgets: { id: string; category: string; amount: number }[];
  subscriptions: Subscription[];
  customCategories: { id: string; name: string; type: string; icon?: string; color?: string }[];
  profile: UserProfile;
  categoryOrder: { expense: string[]; income: string[] };
  deletedDefaultCategories: string[];
  walletOrder: string[];
}
