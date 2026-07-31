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
    
    const currentVersion = version?.user_version || (version === undefined ? 1 : 0);
    if (currentVersion < 2) {
      await db!.execAsync(`
        CREATE TABLE IF NOT EXISTS custom_categories (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL
        );
      `);
      await db!.execAsync('PRAGMA user_version = 2');
    }

    const versionAfter2 = await db!.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersionAfter2 = versionAfter2?.user_version || 2;
    if (currentVersionAfter2 < 3) {
      await db!.execAsync(`
        ALTER TABLE custom_categories ADD COLUMN icon TEXT;
      `);
      await db!.execAsync('PRAGMA user_version = 3');
    }

    const versionAfter3 = await db!.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersionAfter3 = versionAfter3?.user_version || 3;
    if (currentVersionAfter3 < 4) {
      await db!.execAsync(`
        ALTER TABLE custom_categories ADD COLUMN color TEXT;
      `);
      await db!.execAsync('PRAGMA user_version = 4');
    }

    const versionAfter4 = await db!.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersionAfter4 = versionAfter4?.user_version || 4;
    if (currentVersionAfter4 < 5) {
      await db!.execAsync(`
        CREATE TABLE IF NOT EXISTS deleted_default_categories (
          name TEXT PRIMARY KEY
        );
      `);
      await db!.execAsync('PRAGMA user_version = 5');
    }

    const versionAfter5 = await db!.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersionAfter5 = versionAfter5?.user_version || 5;
    if (currentVersionAfter5 < 6) {
      await db!.execAsync(`
        CREATE TABLE IF NOT EXISTS category_order (
          type TEXT PRIMARY KEY,
          sort_order TEXT NOT NULL
        );
      `);
      await db!.execAsync('PRAGMA user_version = 6');
    }
  });
  return db;
}
