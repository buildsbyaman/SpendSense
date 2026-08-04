import { formatWalletBalance } from '@/utils/wallet';
import { getDatabase } from '../database';
import { type DB } from './types';

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
  await saveProfileRow(db, profile);
}

async function saveProfileRow(db: DB, profile: UserProfile): Promise<void> {
  await db.runAsync(
    "INSERT OR REPLACE INTO profile (id, name, currency_symbol, currency_code, avatar, has_onboarded) VALUES ('default', ?, ?, ?, ?, ?)",
    profile.name,
    profile.currencySymbol,
    profile.currencyCode,
    profile.avatar || null,
    profile.hasOnboarded ? 1 : 0
  );
}

const MAX_AMOUNT_AFTER_CONVERSION = 1e15;
const MIN_ROUNDABLE_CENTS = 0.005;

/**
 * Applies a currency conversion rate to every monetary value. Must be called
 * inside a transaction (see convertCurrencyInDB / convertCurrencyAndUpdateProfile).
 *
 * Guarded against the two data-loss modes of the old single-statement ROUND():
 *  - underflow: a row whose product rounds to $0.00 under a small rate is left
 *    untouched instead of silently erased (e.g. $0.01 * 0.001 -> $0.00);
 *  - overflow: a product that is not finite (or exceeds MAX_AMOUNT_AFTER_CONVERSION)
 *    is left untouched instead of being stored as `Infinity` / zeroed.
 * Corrupt account balances that cannot be parsed are likewise left untouched.
 */
export async function applyCurrencyConversion(
  db: DB,
  rate: number,
  symbol?: string
): Promise<void> {
  if (!isFinite(rate) || rate <= 0) return;

  for (const table of ['transactions', 'budgets', 'subscriptions']) {
    const rows = await db.getAllAsync<{ id: string; amount: number }>(
      `SELECT id, amount FROM ${table}`
    );
    for (const row of rows) {
      const product = row.amount * rate;
      if (!isFinite(product) || Math.abs(product) > MAX_AMOUNT_AFTER_CONVERSION) continue;
      if (Math.abs(product) < MIN_ROUNDABLE_CENTS) continue;
      const rounded = Math.round(product * 100) / 100;
      await db.runAsync(`UPDATE ${table} SET amount = ? WHERE id = ?`, rounded, row.id);
    }
  }

  const accounts = await db.getAllAsync<{ id: string; balance: string }>(
    'SELECT id, balance FROM accounts'
  );
  for (const acc of accounts) {
    const cleaned = acc.balance.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    if (!isFinite(parsed)) continue;
    const product = parsed * rate;
    if (!isFinite(product) || Math.abs(product) > MAX_AMOUNT_AFTER_CONVERSION) continue;
    const newBalanceStr = formatWalletBalance(product.toString(), symbol);
    await db.runAsync('UPDATE accounts SET balance = ? WHERE id = ?', newBalanceStr, acc.id);
  }
}

export async function convertCurrencyInDB(rate: number, symbol?: string): Promise<void> {
  if (!isFinite(rate) || rate <= 0) return;
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await applyCurrencyConversion(db, rate, symbol);
  });
}

/**
 * Converts all amounts AND persists the new currency profile in a single
 * transaction, so a crash cannot leave amounts converted while the profile (and
 * the UI) still reports the old currency — which would otherwise double-convert
 * on the user's retry.
 */
export async function convertCurrencyAndUpdateProfile(
  rate: number,
  symbol: string,
  profile: UserProfile
): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await applyCurrencyConversion(db, rate, symbol);
    await saveProfileRow(db, profile);
  });
}
