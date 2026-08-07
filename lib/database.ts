import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

let db: SQLiteDatabase | null = null;
let migrationPromise: Promise<SQLiteDatabase> | null = null;

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

async function tableColumns(db: SQLiteDatabase, table: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.map((c) => c.name);
}

async function runMigrations(instance: SQLiteDatabase): Promise<void> {
  await instance.withTransactionAsync(async () => {
    // Read the version once and keep it updated as we step; never re-read a
    // stale value or fall back to a guess that could skip a migration.
    let currentVersion =
      (await instance.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))
        ?.user_version ?? 0;

    if (currentVersion < 1) {
      await instance.execAsync(SCHEMA);
      currentVersion = 1;
    }

    if (currentVersion < 2) {
      await instance.execAsync(`
        CREATE TABLE IF NOT EXISTS custom_categories (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL
        );
      `);
      currentVersion = 2;
    }

    if (currentVersion < 3) {
      const cols = await tableColumns(instance, 'custom_categories');
      if (!cols.includes('icon')) {
        await instance.execAsync(`ALTER TABLE custom_categories ADD COLUMN icon TEXT`);
      }
      currentVersion = 3;
    }

    if (currentVersion < 4) {
      const cols = await tableColumns(instance, 'custom_categories');
      if (!cols.includes('color')) {
        await instance.execAsync(`ALTER TABLE custom_categories ADD COLUMN color TEXT`);
      }
      currentVersion = 4;
    }

    if (currentVersion < 5) {
      await instance.execAsync(`
        CREATE TABLE IF NOT EXISTS deleted_default_categories (
          name TEXT PRIMARY KEY
        );
      `);
      currentVersion = 5;
    }

    if (currentVersion < 6) {
      await instance.execAsync(`
        CREATE TABLE IF NOT EXISTS category_order (
          type TEXT PRIMARY KEY,
          sort_order TEXT NOT NULL
        );
      `);
      currentVersion = 6;
    }

    if (currentVersion < 7) {
      await instance.execAsync(`
        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY NOT NULL,
          category TEXT NOT NULL,
          amount REAL NOT NULL
        );
      `);
      currentVersion = 7;
    }

    if (currentVersion < 8) {
      await instance.execAsync(`
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
      currentVersion = 8;
    }

    if (currentVersion < 9) {
      const cols = await tableColumns(instance, 'subscriptions');
      if (!cols.includes('end_date')) {
        await instance.execAsync(`ALTER TABLE subscriptions ADD COLUMN end_date TEXT`);
      }
      currentVersion = 9;
    }

    if (currentVersion < 10) {
      const cols = await tableColumns(instance, 'profile');
      if (!cols.includes('currency_symbol')) {
        await instance.runAsync("ALTER TABLE profile ADD COLUMN currency_symbol TEXT DEFAULT '$'");
      }
      if (!cols.includes('currency_code')) {
        await instance.runAsync("ALTER TABLE profile ADD COLUMN currency_code TEXT DEFAULT 'USD'");
      }
      currentVersion = 10;
    }

    if (currentVersion < 11) {
      const cols = await tableColumns(instance, 'profile');
      if (!cols.includes('avatar')) {
        await instance.runAsync('ALTER TABLE profile ADD COLUMN avatar TEXT');
      }
      if (!cols.includes('has_onboarded')) {
        await instance.runAsync(
          'ALTER TABLE profile ADD COLUMN has_onboarded INTEGER NOT NULL DEFAULT 0'
        );
      }
      currentVersion = 11;
    }

    if (currentVersion < 12) {
      await instance.execAsync(`
        CREATE TABLE IF NOT EXISTS wallet_order (
          id TEXT PRIMARY KEY NOT NULL,
          sort_order TEXT NOT NULL
        );
      `);
      currentVersion = 12;
    }

    if (currentVersion < 13) {
      const cols = await tableColumns(instance, 'transactions');
      if (!cols.includes('to_wallet_id')) {
        await instance.execAsync('ALTER TABLE transactions ADD COLUMN to_wallet_id TEXT');
      }
      currentVersion = 13;
    }

    if (currentVersion < 14) {
      currentVersion = 14;
    }

    // Self-healing guard: an earlier transfer build could have stamped the
    // DB at v13 (or higher) without the to_wallet_id column, which would
    // leave every transfer write failing with "no such column". This step
    // runs on every launch and only ALTERs when the column is missing, so it
    // is safe for fresh, already-migrated, and broken databases alike.
    {
      const cols = await tableColumns(instance, 'transactions');
      if (!cols.includes('to_wallet_id')) {
        await instance.execAsync('ALTER TABLE transactions ADD COLUMN to_wallet_id TEXT');
      }
    }

    if (currentVersion > 0) {
      await instance.execAsync(`PRAGMA user_version = ${currentVersion}`);
    }
  });
}

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (db) return db;

  if (!migrationPromise) {
    migrationPromise = openDatabaseAsync('spendsense.db').then(async (instance) => {
      await instance.execAsync('PRAGMA journal_mode = WAL');
      await runMigrations(instance);
      db = instance;
      return instance;
    });
    // On failure, drop the cached promise so a later call retries migrations
    // (and never returns a half-migrated handle).
    migrationPromise.catch(() => {
      migrationPromise = null;
    });
  }

  return migrationPromise;
}
