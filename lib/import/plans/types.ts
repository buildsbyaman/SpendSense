import { type Account } from '@/utils/wallet';
import { type Transaction } from '@/utils/transaction';
import { type Subscription } from '@/utils/subscription';
import { type Budget, type UserProfile } from '@/lib/repository';
import { type CustomCategory } from '@/utils/transaction';

export type ImportMode = 'merge' | 'replace';
export type ConflictPolicy = 'skip' | 'overwrite';

export interface ImportPlan {
  wallets: { insert: Account[]; update: Account[]; skip: number; dropped: number };
  transactions: { insert: Transaction[]; update: Transaction[]; skip: number; dropped: number };
  subscriptions: { insert: Subscription[]; update: Subscription[]; skip: number; dropped: number };
  budgets: { insert: Budget[]; update: Budget[]; skip: number; dropped: number };
  categories: { insert: CustomCategory[]; update: CustomCategory[]; skip: number; dropped: number };
  profile: { value: UserProfile | null; apply: boolean };
  categoryOrder: { expense: string[]; income: string[] } | null;
  hiddenCategories: string[] | null;
  walletOrder: string[] | null;
  replace: boolean;
  replaceTypes: string[];
  currencyWarning: string | null;
}

/**
 * Mutable state threaded through the per-kind table processors. In replace mode
 * the "existing" collections are empty because apply.ts clears the DB first.
 */
export interface PlanContext {
  plan: ImportPlan;
  conflict: ConflictPolicy;
  isReplace: boolean;
  existingAccounts: Account[];
  existingSubs: Subscription[];
  existingBudgets: Budget[];
  existingCats: CustomCategory[];
  existingTxsMap: Map<string, Transaction[]>;
  balanceLookup: Map<string, string>;
}
