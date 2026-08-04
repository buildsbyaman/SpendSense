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
  saveWalletOrder,
  fetchAccounts,
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
        // Replacing wallets also clears dependent tables: any surviving
        // transaction/subscription would otherwise reference deleted wallets.
        wallets: ['accounts', 'wallet_order', 'transactions', 'subscriptions'],
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
      // Defense-in-depth: never interpolate an unverified table name into SQL,
      // even though every entry above comes from this hardcoded map.
      const ALLOWED_TABLES = new Set<string>(Object.values(typeToTables).flat());
      // Delete in dependency order
      for (const table of [
        'subscriptions',
        'transactions',
        'budgets',
        'deleted_default_categories',
        'category_order',
        'custom_categories',
        'accounts',
        'wallet_order',
      ]) {
        if (tablesToDelete.has(table) && ALLOWED_TABLES.has(table)) {
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

    // Wallet order (map file names -> ids; append any accounts not listed)
    if (plan.walletOrder) {
      const allAccounts = await fetchAccounts();
      const orderedIds: string[] = [];
      for (const name of plan.walletOrder) {
        const match = allAccounts.find(
          (a) => a.name.toLowerCase() === String(name).trim().toLowerCase()
        );
        if (match && !orderedIds.includes(match.id)) orderedIds.push(match.id);
      }
      for (const acc of allAccounts) {
        if (!orderedIds.includes(acc.id)) orderedIds.push(acc.id);
      }
      if (orderedIds.length > 0) {
        await saveWalletOrder(orderedIds);
      }
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

    // Hidden default categories. Inlined instead of
    // replaceDeletedDefaultCategories(): that helper opens its own transaction
    // and expo-sqlite throws on nested transactions, which would roll back the
    // entire import whenever any default category was hidden.
    if (plan.hiddenCategories && plan.hiddenCategories.length > 0) {
      await db.runAsync('DELETE FROM deleted_default_categories');
      for (const name of plan.hiddenCategories) {
        await db.runAsync(
          'INSERT OR IGNORE INTO deleted_default_categories (name) VALUES (?)',
          name
        );
      }
    }
  });

  return result;
}
