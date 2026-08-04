import { getDatabase } from '../database';
import { generateSeedData } from '../seed-data';
import { insertAccount } from './account';
import { insertTransaction } from './transaction';

// ── Reset ────────────────────────────────────────────────────────────

// Single reset entry point. `preserveProfile` defaults to false (full wipe
// including the profile row). This used to be two near-identical functions
// (one wiping profile, one not) that were easy to call interchangeably.
export async function clearAllData(options: { preserveProfile?: boolean } = {}): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM accounts;
    DELETE FROM transactions;
    ${options.preserveProfile ? '' : 'DELETE FROM profile;'}
    DELETE FROM custom_categories;
    DELETE FROM deleted_default_categories;
    DELETE FROM category_order;
    DELETE FROM wallet_order;
    DELETE FROM budgets;
    DELETE FROM subscriptions;
  `);
}

export async function replaceDeletedDefaultCategories(names: string[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM deleted_default_categories');
    for (const name of names) {
      await db.runAsync('INSERT OR IGNORE INTO deleted_default_categories (name) VALUES (?)', name);
    }
  });
}

export async function seedDemoData(symbol?: string): Promise<void> {
  const db = await getDatabase();
  const { wallets, transactions } = generateSeedData(symbol);
  // Full reset + inserts in ONE transaction so a crash mid-seed cannot leave a
  // half-written dataset, and so stale custom/deleted categories or orders do
  // not leak into the demo data. Profile is preserved (name/avatar/currency).
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM transactions;
      DELETE FROM accounts;
      DELETE FROM budgets;
      DELETE FROM subscriptions;
      DELETE FROM custom_categories;
      DELETE FROM deleted_default_categories;
      DELETE FROM category_order;
      DELETE FROM wallet_order;
    `);
    for (const w of wallets) {
      await insertAccount(w as any);
    }
    for (const tx of transactions) {
      await insertTransaction(tx);
    }
  });
}
