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
    // Replace mode: clear only selected tables in dependency order
    if (plan.replace && plan.replaceTypes.length > 0) {
      const typeToTables: Record<string, string[]> = {
        wallets: ['accounts'],
        transactions: ['transactions'],
        subscriptions: ['subscriptions'],
        budgets: ['budgets'],
        categories: ['custom_categories', 'deleted_default_categories', 'category_order'],
      };
      const tablesToDelete = new Set<string>();
      for (const t of plan.replaceTypes) {
        for (const table of typeToTables[t] ?? []) {
          tablesToDelete.add(table);
        }
      }
      // Delete in dependency order
      for (const table of ['subscriptions', 'transactions', 'budgets', 'deleted_default_categories', 'category_order', 'custom_categories', 'accounts']) {
        if (tablesToDelete.has(table)) {
          await db.runAsync(`DELETE FROM ${table}`);
        }
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
