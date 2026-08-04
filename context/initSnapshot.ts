import type { Account } from '@/utils/wallet';
import type { Transaction, CustomCategory } from '@/utils/transaction';
import type { Subscription } from '@/utils/subscription';
import { getDatabase } from '@/lib/database';
import { processSubscriptionBilling } from '@/lib/billing';
import { deserializeAccount } from '@/utils/wallet';
import {
  fetchAccounts,
  insertTransaction,
  updateAccount,
  updateSubscription as repoUpdateSubscription,
  fetchTransactions,
  fetchCustomCategories,
  fetchDeletedDefaultCategories,
  fetchCategoryOrder,
  fetchWalletOrder,
  fetchProfile,
  fetchBudgets,
  fetchSubscriptions,
  type Budget,
} from '@/lib/repository';

export interface InitSnapshot {
  accounts: Account[];
  transactions: Transaction[];
  customCategories: CustomCategory[];
  deletedDefaultCategories: string[];
  expenseOrder: string[];
  incomeOrder: string[];
  walletOrder: string[];
  profile: {
    name: string;
    currencySymbol: string;
    currencyCode: string;
    avatar: string | null;
    hasOnboarded: boolean;
  };
  budgets: Budget[];
  subscriptions: Subscription[];
}

/**
 * Reads every collection from the database and runs auto-billing for active
 * subscriptions (capped at 24 back-dated charges). Returns the post-billing
 * snapshot so the caller can hydrate its state in one pass.
 */
export async function loadInitialData(): Promise<InitSnapshot> {
  await getDatabase();
  const accounts = (await fetchAccounts()).map(deserializeAccount);
  const transactions = await fetchTransactions();
  const customCategories = await fetchCustomCategories();
  const deletedDefaultCategories = await fetchDeletedDefaultCategories();
  const expenseOrder = (await fetchCategoryOrder('expense')) || [];
  const incomeOrder = (await fetchCategoryOrder('income')) || [];
  const walletOrder = (await fetchWalletOrder()) || [];
  const profile = (await fetchProfile()) || {
    name: 'User',
    currencySymbol: '$',
    currencyCode: 'USD',
    avatar: null,
    hasOnboarded: false,
  };
  const budgets = await fetchBudgets();
  const subscriptions = await fetchSubscriptions();

  // Handle auto-billing for active subscriptions (cap at 24 iterations)
  for (const sub of subscriptions) {
    const { txs, updatedAccount, nextDate } = processSubscriptionBilling(
      sub,
      accounts,
      profile.currencySymbol
    );

    for (const tx of txs) {
      await insertTransaction(tx);
      transactions.push(tx);
    }

    if (updatedAccount) {
      const existing = accounts.find((a) => a.id === updatedAccount.id);
      if (existing) Object.assign(existing, updatedAccount);
      await updateAccount(updatedAccount);
    }

    if (txs.length > 0) {
      sub.next_billing_date = nextDate;
      await repoUpdateSubscription(sub);
    }
  }

  return {
    accounts,
    transactions,
    customCategories,
    deletedDefaultCategories,
    expenseOrder,
    incomeOrder,
    walletOrder,
    profile,
    budgets,
    subscriptions,
  };
}
