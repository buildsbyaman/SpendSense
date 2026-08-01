import { type Account, parseBalance } from '@/utils/wallet';
import { type Transaction, type CustomCategory } from '@/utils/transaction';
import { type Subscription } from '@/utils/subscription';
import { getDatabase } from './database';
import { generateSeedData } from './seed-data';

// ── Accounts ─────────────────────────────────────────────────────────

interface AccountRow {
  id: string;
  name: string;
  number: string;
  balance: string;
  type: string;
  is_default: number;
}

function rowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    number: row.number,
    balance: row.balance,
    type: row.type,
    isDefault: row.is_default === 1,
    icon: undefined as any,
  };
}

export async function fetchAccounts(): Promise<Account[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AccountRow>('SELECT * FROM accounts');
  return rows.map(rowToAccount);
}

export async function insertAccount(acc: Account): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO accounts (id, name, number, balance, type, is_default) VALUES (?, ?, ?, ?, ?, ?)',
    acc.id,
    acc.name,
    acc.number,
    acc.balance,
    acc.type,
    acc.isDefault ? 1 : 0
  );
}

export async function updateAccount(acc: Account): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE accounts SET name = ?, number = ?, balance = ?, type = ?, is_default = ? WHERE id = ?',
    acc.name,
    acc.number,
    acc.balance,
    acc.type,
    acc.isDefault ? 1 : 0,
    acc.id
  );
}

export async function deleteAccount(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM accounts WHERE id = ?', id);
}

export async function setDefaultWallet(id: string): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE accounts SET is_default = 0');
    await db.runAsync('UPDATE accounts SET is_default = 1 WHERE id = ?', id);
  });
}

// ── Transactions ─────────────────────────────────────────────────────

interface TransactionRow {
  id: string;
  title: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  wallet_id: string;
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    type: row.type as Transaction['type'],
    category: row.category,
    date: row.date,
    walletId: row.wallet_id,
  };
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TransactionRow>('SELECT * FROM transactions');
  return rows.map(rowToTransaction);
}

export async function insertTransaction(tx: Transaction): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO transactions (id, title, amount, type, category, date, wallet_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    tx.id,
    tx.title,
    tx.amount,
    tx.type,
    tx.category,
    tx.date,
    tx.walletId
  );
}

export async function updateTransaction(tx: Transaction): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE transactions SET title = ?, amount = ?, type = ?, category = ?, date = ?, wallet_id = ? WHERE id = ?',
    tx.title,
    tx.amount,
    tx.type,
    tx.category,
    tx.date,
    tx.walletId,
    tx.id
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export async function deleteTransactionsForWallet(walletId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE wallet_id = ?', walletId);
}

export async function reassignTransactionsWallet(
  fromWalletId: string,
  toWalletId: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE transactions SET wallet_id = ? WHERE wallet_id = ?',
    toWalletId,
    fromWalletId
  );
}

export async function reassignTransactionsCategory(
  oldCategory: string,
  newCategory: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE transactions SET category = ? WHERE category = ?',
    newCategory,
    oldCategory
  );
}

// ── Custom Categories ─────────────────────────────────────────────────────────

export async function fetchCustomCategories(): Promise<CustomCategory[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CustomCategory>('SELECT * FROM custom_categories');
  return rows;
}

export async function insertCustomCategory(cat: CustomCategory): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO custom_categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
    cat.id,
    cat.name,
    cat.type,
    cat.icon || null,
    cat.color || null
  );
}

export async function deleteCustomCategory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM custom_categories WHERE id = ?', id);
}

export async function fetchDeletedDefaultCategories(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ name: string }>(
    'SELECT name FROM deleted_default_categories'
  );
  return rows.map((r) => r.name);
}

export async function insertDeletedDefaultCategory(name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO deleted_default_categories (name) VALUES (?)', name);
}

export async function fetchCategoryOrder(type: string): Promise<string[] | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ sort_order: string }>(
    'SELECT sort_order FROM category_order WHERE type = ?',
    type
  );
  if (row && row.sort_order) {
    try {
      return JSON.parse(row.sort_order);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function saveCategoryOrder(type: string, sortOrder: string[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO category_order (type, sort_order) VALUES (?, ?)',
    type,
    JSON.stringify(sortOrder)
  );
}

// ── Profile ──────────────────────────────────────────────────────────

interface ProfileRow {
  id: string;
  name: string;
  currency_symbol?: string;
  currency_code?: string;
  avatar?: string | null;
  has_onboarded?: number;
}

export interface UserProfile {
  name: string;
  currencySymbol: string;
  currencyCode: string;
  avatar: string | null;
  hasOnboarded: boolean;
}

export async function fetchProfile(): Promise<UserProfile | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ProfileRow>("SELECT * FROM profile WHERE id = 'default'");
  return row
    ? {
        name: row.name,
        currencySymbol: row.currency_symbol || '$',
        currencyCode: row.currency_code || 'USD',
        avatar: row.avatar || null,
        hasOnboarded: row.has_onboarded === 1,
      }
    : null;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT OR REPLACE INTO profile (id, name, currency_symbol, currency_code, avatar, has_onboarded) VALUES ('default', ?, ?, ?, ?, ?)",
    profile.name,
    profile.currencySymbol,
    profile.currencyCode,
    profile.avatar || null,
    profile.hasOnboarded ? 1 : 0
  );
}

export async function convertCurrencyInDB(rate: number): Promise<void> {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    // Convert transactions
    await db.execAsync(`UPDATE transactions SET amount = amount * ${rate}`);
    // Convert budgets
    await db.execAsync(`UPDATE budgets SET amount = amount * ${rate}`);
    // Convert subscriptions
    await db.execAsync(`UPDATE subscriptions SET amount = amount * ${rate}`);

    // Accounts need to parse string balances, multiply, and save.
    const accounts = await db.getAllAsync<{ id: string; balance: string }>(
      'SELECT id, balance FROM accounts'
    );
    for (const acc of accounts) {
      const cleaned = acc.balance.replace(/[^0-9.-]/g, '');
      let parsed = parseFloat(cleaned);
      if (isNaN(parsed)) parsed = 0;

      const newBalance = parsed * rate;
      const formattedNumber = Math.abs(newBalance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const newBalanceStr = newBalance < 0 ? `-${formattedNumber}` : `${formattedNumber}`;

      await db.runAsync('UPDATE accounts SET balance = ? WHERE id = ?', newBalanceStr, acc.id);
    }
  });
}

// ── Reset ────────────────────────────────────────────────────────────

export async function clearAll(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM accounts;
    DELETE FROM transactions;
    DELETE FROM profile;
    DELETE FROM custom_categories;
    DELETE FROM deleted_default_categories;
    DELETE FROM category_order;
    DELETE FROM budgets;
    DELETE FROM subscriptions;
  `);
}

export async function clearAllData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM accounts;
    DELETE FROM transactions;
    DELETE FROM custom_categories;
    DELETE FROM deleted_default_categories;
    DELETE FROM category_order;
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

export async function seedDemoData(): Promise<void> {
  const { wallets, transactions } = generateSeedData();
  for (const w of wallets) {
    await insertAccount(w as any);
  }
  for (const tx of transactions) {
    await insertTransaction(tx);
  }
}

// ── Budgets ──────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  category: string;
  amount: number;
}

export async function fetchBudgets(): Promise<Budget[]> {
  const db = await getDatabase();
  return db.getAllAsync<Budget>('SELECT * FROM budgets');
}

export async function insertBudget(budget: Budget): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO budgets (id, category, amount) VALUES (?, ?, ?)',
    budget.id,
    budget.category,
    budget.amount
  );
}

export async function updateBudget(budget: Budget): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE budgets SET category = ?, amount = ? WHERE id = ?',
    budget.category,
    budget.amount,
    budget.id
  );
}

export async function deleteBudget(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM budgets WHERE id = ?', id);
}

// Update budgets for a specific category to a new category (e.g., 'Uncategorized')
export async function updateBudgetsCategory(
  oldCategory: string,
  newCategory: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE budgets SET category = ? WHERE category = ?', newCategory, oldCategory);
}

// ── Subscriptions ────────────────────────────────────────────────────────
export async function fetchSubscriptions(): Promise<Subscription[]> {
  const db = await getDatabase();
  return db.getAllAsync<Subscription>('SELECT * FROM subscriptions');
}

export async function insertSubscription(sub: Subscription): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO subscriptions (id, name, amount, cycle, category, wallet_id, next_billing_date, is_active, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    sub.id,
    sub.name,
    sub.amount,
    sub.cycle,
    sub.category,
    sub.wallet_id,
    sub.next_billing_date,
    sub.is_active,
    sub.end_date || null
  );
}

export async function updateSubscription(sub: Subscription): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE subscriptions SET name = ?, amount = ?, cycle = ?, category = ?, wallet_id = ?, next_billing_date = ?, is_active = ?, end_date = ? WHERE id = ?',
    sub.name,
    sub.amount,
    sub.cycle,
    sub.category,
    sub.wallet_id,
    sub.next_billing_date,
    sub.is_active,
    sub.end_date || null,
    sub.id
  );
}

export async function deleteSubscription(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM subscriptions WHERE id = ?', id);
}
