import { type Account, parseBalance } from '@/utils/wallet';
import { type Transaction, type CustomCategory } from '@/utils/transaction';
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

export async function reassignTransactionsCategory(oldCategory: string, newCategory: string): Promise<void> {
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
    'INSERT INTO custom_categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
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
  const rows = await db.getAllAsync<{ name: string }>('SELECT name FROM deleted_default_categories');
  return rows.map(r => r.name);
}

export async function insertDeletedDefaultCategory(name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO deleted_default_categories (name) VALUES (?)', name);
}

export async function fetchCategoryOrder(type: string): Promise<string[] | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ sort_order: string }>('SELECT sort_order FROM category_order WHERE type = ?', type);
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
  await db.runAsync('INSERT OR REPLACE INTO category_order (type, sort_order) VALUES (?, ?)', type, JSON.stringify(sortOrder));
}

// ── Profile ──────────────────────────────────────────────────────────

interface ProfileRow {
  id: string;
  name: string;
}

export async function fetchProfile(): Promise<{ name: string } | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ProfileRow>("SELECT * FROM profile WHERE id = 'default'");
  return row ? { name: row.name } : null;
}

export async function saveProfile(profile: { name: string }): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT OR REPLACE INTO profile (id, name) VALUES ('default', ?)",
    profile.name
  );
}

// ── Reset ────────────────────────────────────────────────────────────

export async function clearAll(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM accounts');
    await db.runAsync('DELETE FROM transactions');
  });
}

// ── Seed ──────────────────────────────────────────────────────────────

export async function seedDemoData(): Promise<void> {
  const { wallets, transactions } = generateSeedData();
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM transactions');
    await db.runAsync('DELETE FROM accounts');
    for (const w of wallets) {
      await db.runAsync(
        'INSERT INTO accounts (id, name, number, balance, type, is_default) VALUES (?, ?, ?, ?, ?, ?)',
        w.id,
        w.name,
        w.number,
        w.balance,
        w.type,
        w.isDefault ? 1 : 0
      );
    }
    for (const tx of transactions) {
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
  });
}
