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
  name TEXT NOT NULL,
  currency_symbol TEXT NOT NULL DEFAULT '$',
  currency_code TEXT NOT NULL DEFAULT 'USD'
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

    const versionAfter6 = await db!.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersionAfter6 = versionAfter6?.user_version || 6;
    if (currentVersionAfter6 < 7) {
      await db!.execAsync(`
        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY NOT NULL,
          category TEXT NOT NULL,
          amount REAL NOT NULL
        );
      `);
      await db!.execAsync('PRAGMA user_version = 7');
    }

    const versionAfter7 = await db!.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVersionAfter7 = versionAfter7?.user_version || 7;
    if (currentVersionAfter7 < 8) {
      await db!.execAsync(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          cycle TEXT NOT NULL,
          category TEXT NOT NULL,
          wallet_id TEXT NOT NULL,
          next_billing_date TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1
        );
      `);
      await db!.execAsync('PRAGMA user_version = 8');
    }

    const { user_version: currentVersionAfter8 } = (await db!.getFirstAsync<{
      user_version: number;
    }>('PRAGMA user_version')) ?? { user_version: 0 };

    if (currentVersionAfter8 < 9) {
      await db!.execAsync(`
        ALTER TABLE subscriptions ADD COLUMN end_date TEXT;
      `);
      await db!.execAsync('PRAGMA user_version = 9');
    }

    const { user_version: currentVersionAfter9 } = (await db!.getFirstAsync<{
      user_version: number;
    }>('PRAGMA user_version')) ?? { user_version: 0 };

    if (currentVersionAfter9 < 10) {
      const cols9 = await db!.getAllAsync<{ name: string }>('PRAGMA table_info(profile)');
      const colNames9 = cols9.map((c) => c.name);
      if (!colNames9.includes('currency_symbol')) {
        await db!.runAsync("ALTER TABLE profile ADD COLUMN currency_symbol TEXT DEFAULT '$'");
      }
      if (!colNames9.includes('currency_code')) {
        await db!.runAsync("ALTER TABLE profile ADD COLUMN currency_code TEXT DEFAULT 'USD'");
      }
      await db!.execAsync('PRAGMA user_version = 10');
    }

    const { user_version: currentVersionAfter10 } = (await db!.getFirstAsync<{
      user_version: number;
    }>('PRAGMA user_version')) ?? { user_version: 0 };

    if (currentVersionAfter10 < 11) {
      const cols10 = await db!.getAllAsync<{ name: string }>('PRAGMA table_info(profile)');
      const colNames10 = cols10.map((c) => c.name);
      if (!colNames10.includes('avatar')) {
        await db!.runAsync('ALTER TABLE profile ADD COLUMN avatar TEXT');
      }
      if (!colNames10.includes('has_onboarded')) {
        await db!.runAsync(
          'ALTER TABLE profile ADD COLUMN has_onboarded INTEGER NOT NULL DEFAULT 0'
        );
      }
      await db!.execAsync('PRAGMA user_version = 11');
    }
  });
  return db;
}
