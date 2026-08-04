import { type Transaction } from '@/utils/transaction';
import { getDatabase } from '../database';

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
  const rows = await db.getAllAsync<TransactionRow>(
    'SELECT * FROM transactions ORDER BY date DESC'
  );
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

export async function reassignSubscriptionsWallet(
  fromWalletId: string,
  toWalletId: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE subscriptions SET wallet_id = ? WHERE wallet_id = ?',
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

export async function reassignSubscriptionsCategory(
  oldCategory: string,
  newCategory: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE subscriptions SET category = ? WHERE category = ?',
    newCategory,
    oldCategory
  );
}
