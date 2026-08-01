import { getDatabase } from '@/lib/database';
import {
  insertAccount,
  updateAccount,
  insertTransaction,
  updateTransaction,
  insertSubscription,
  updateSubscription,
  insertBudget,
  updateBudget,
  insertCustomCategory,
  saveProfile,
  saveCategoryOrder,
  replaceDeletedDefaultCategories,
} from '@/lib/repository';
import { type ImportPlan } from './merge';

export interface ApplyResult {
  walletsAdded: number;
  walletsUpdated: number;
  transactionsAdded: number;
  transactionsUpdated: number;
  subscriptionsAdded: number;
  subscriptionsUpdated: number;
  budgetsAdded: number;
  budgetsUpdated: number;
  categoriesAdded: number;
  categoriesUpdated: number;
  profileImported: boolean;
}

export async function applyImportPlan(plan: ImportPlan): Promise<ApplyResult> {
  const db = await getDatabase();
  const result: ApplyResult = {
    walletsAdded: 0,
    walletsUpdated: 0,
    transactionsAdded: 0,
    transactionsUpdated: 0,
    subscriptionsAdded: 0,
    subscriptionsUpdated: 0,
    budgetsAdded: 0,
    budgetsUpdated: 0,
    categoriesAdded: 0,
    categoriesUpdated: 0,
    profileImported: false,
  };

  await db.withTransactionAsync(async () => {
    // Replace mode: only clear tables that have data in the plan
    if (plan.replace) {
      if (plan.wallets.insert.length > 0 || plan.wallets.update.length > 0) {
        await db.runAsync('DELETE FROM accounts');
      }
      if (plan.transactions.insert.length > 0 || plan.transactions.update.length > 0) {
        await db.runAsync('DELETE FROM transactions');
      }
      if (plan.subscriptions.insert.length > 0 || plan.subscriptions.update.length > 0) {
        await db.runAsync('DELETE FROM subscriptions');
      }
      if (plan.budgets.insert.length > 0 || plan.budgets.update.length > 0) {
        await db.runAsync('DELETE FROM budgets');
      }
      if (plan.categories.insert.length > 0 || plan.categories.update.length > 0) {
        await db.runAsync('DELETE FROM custom_categories');
        await db.runAsync('DELETE FROM deleted_default_categories');
      }
    }

    // Profile (always restore when selected)
    if (plan.profile.apply && plan.profile.value) {
      await saveProfile(plan.profile.value);
      result.profileImported = true;
    }

    // Wallets
    for (const w of plan.wallets.insert) {
      await insertAccount(w);
      result.walletsAdded++;
    }
    for (const w of plan.wallets.update) {
      await updateAccount(w);
      result.walletsUpdated++;
    }

    // Transactions
    for (const tx of plan.transactions.insert) {
      await insertTransaction(tx);
      result.transactionsAdded++;
    }
    for (const tx of plan.transactions.update) {
      await updateTransaction(tx);
      result.transactionsUpdated++;
    }

    // Subscriptions
    for (const sub of plan.subscriptions.insert) {
      await insertSubscription(sub);
      result.subscriptionsAdded++;
    }
    for (const sub of plan.subscriptions.update) {
      await updateSubscription(sub);
      result.subscriptionsUpdated++;
    }

    // Budgets
    for (const b of plan.budgets.insert) {
      await insertBudget(b);
      result.budgetsAdded++;
    }
    for (const b of plan.budgets.update) {
      await updateBudget(b);
      result.budgetsUpdated++;
    }

    // Categories
    for (const c of plan.categories.insert) {
      await insertCustomCategory(c);
      result.categoriesAdded++;
    }
    for (const c of plan.categories.update) {
      await insertCustomCategory(c);
      result.categoriesUpdated++;
    }

    // Category order
    if (plan.categoryOrder) {
      if (plan.categoryOrder.expense.length > 0) {
        await saveCategoryOrder('expense', plan.categoryOrder.expense);
      }
      if (plan.categoryOrder.income.length > 0) {
        await saveCategoryOrder('income', plan.categoryOrder.income);
      }
    }

    // Hidden default categories
    if (plan.hiddenCategories && plan.hiddenCategories.length > 0) {
      await replaceDeletedDefaultCategories(plan.hiddenCategories);
    }
  });

  return result;
}
