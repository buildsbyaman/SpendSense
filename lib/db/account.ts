import { type Account } from '@/utils/wallet';
import { getDatabase } from '../database';

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
