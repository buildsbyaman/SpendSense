import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

let db: SQLiteDatabase | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  number TEXT NOT NULL,
  balance TEXT NOT NULL,
  type TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  wallet_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL
);
`;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (db) return db;
  db = await openDatabaseAsync('spendsense.db');
  await db.withTransactionAsync(async () => {
    await db!.execAsync('PRAGMA journal_mode = WAL');
    const version = await db!.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    if (!version || version.user_version === 0) {
      await db!.execAsync(SCHEMA);
      await db!.execAsync('PRAGMA user_version = 1');
    }
  });
  return db;
}
