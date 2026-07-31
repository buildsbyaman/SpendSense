import { type Account, parseBalance } from '@/utils/wallet';
import { type Transaction } from '@/utils/transaction';
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
