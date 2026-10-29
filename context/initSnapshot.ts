import type { Account } from '@/utils/wallet';
import type { Transaction, CustomCategory } from '@/utils/transaction';
import type { Subscription } from '@/utils/subscription';
import { getDatabase } from '@/lib/database';
import { processSubscriptionBilling } from '@/lib/billing';
import { deserializeAccount } from '@/utils/wallet';
import { perfLog, perfNow } from '@/lib/perf';
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
  const startedAt = perfNow();
  const dbStartedAt = perfNow();
  await getDatabase();
  perfLog('startup.getDatabase', dbStartedAt);

  // The reads below are independent; dispatch them together instead of paying a
  // JS turn-around per query. expo-sqlite may serialise them internally on the
  // connection, so this is about removing await overhead, not true parallelism.
  const readStartedAt = perfNow();
  const [
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
  ] = await Promise.all([
    fetchAccounts().then((rows) => rows.map(deserializeAccount)),
    fetchTransactions(),
    fetchCustomCategories(),
    fetchDeletedDefaultCategories(),
    fetchCategoryOrder('expense').then((rows) => rows || []),
    fetchCategoryOrder('income').then((rows) => rows || []),
    fetchWalletOrder().then((rows) => rows || []),
    fetchProfile().then(
      (row) =>
        row || {
          name: 'User',
          currencySymbol: '$',
          currencyCode: 'USD',
          avatar: null,
          hasOnboarded: false,
        }
    ),
    fetchBudgets(),
    fetchSubscriptions(),
  ]);
  perfLog('startup.readAll', readStartedAt);

  // Handle auto-billing for active subscriptions (cap at 24 iterations).
  // In-memory mutations stay in the loop (later subscriptions observe earlier
  // balance changes), but the DB writes are collected and committed once so a
  // launch does not pay one autocommit per write.
  const billingStartedAt = perfNow();
  const pendingTransactions: Transaction[] = [];
  const pendingAccountUpdates = new Map<string, Account>();
  const pendingSubscriptionUpdates: Subscription[] = [];

  for (const sub of subscriptions) {
    const { txs, updatedAccount, nextDate } = processSubscriptionBilling(
      sub,
      accounts,
      profile.currencySymbol
    );

    for (const tx of txs) {
      pendingTransactions.push(tx);
      transactions.push(tx);
    }

    if (updatedAccount) {
      const existing = accounts.find((a) => a.id === updatedAccount.id);
      if (existing) Object.assign(existing, updatedAccount);
      pendingAccountUpdates.set(updatedAccount.id, updatedAccount);
    }

    if (txs.length > 0) {
      sub.next_billing_date = nextDate;
      pendingSubscriptionUpdates.push(sub);
    }
  }

  if (
    pendingTransactions.length > 0 ||
    pendingAccountUpdates.size > 0 ||
    pendingSubscriptionUpdates.length > 0
  ) {
    const db = await getDatabase();
    await db.withTransactionAsync(async () => {
      for (const tx of pendingTransactions) {
        await insertTransaction(tx);
      }
      for (const account of pendingAccountUpdates.values()) {
        await updateAccount(account);
      }
      for (const sub of pendingSubscriptionUpdates) {
        await repoUpdateSubscription(sub);
      }
    });
  }

  perfLog('startup.billing', billingStartedAt);
  perfLog(
    'startup.loadInitialData',
    startedAt,
    `wallets=${accounts.length} tx=${transactions.length} subs=${subscriptions.length}`
  );

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
