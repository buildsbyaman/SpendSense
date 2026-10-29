// Dev-only stress-data generator.
//
// This module is imported lazily from the Developer section of the Profile
// screen and is additionally guarded by `DEV_MODE` (which requires both
// `__DEV__` and `EXPO_PUBLIC_DEV_MODE=1`). In a release build `__DEV__` is
// `false`, so the import site is dead code and `seedLargeDemoData` throws even
// if it were somehow reached.
//
// Purpose: the shipped demo seed only produces ~170 transactions, which is too
// small to expose the O(n) paths in History/Analytics. This produces a
// realistic 12-month history so the fixes can be measured.

import { getDatabase } from '@/lib/database';
import { DEV_MODE } from '@/lib/dev-tools';
import {
  AMOUNT_RANGES,
  EXPENSE_TITLES,
  INCOME_AMOUNTS,
  INCOME_TITLES,
  mulberry32,
} from '@/lib/seed-data';
import { formatWalletBalance } from '@/utils/wallet';
import type { Transaction } from '@/utils/transaction';

export const LARGE_SEED_TRANSACTION_COUNT = 10_000;

const DEV_WALLETS = [
  {
    id: 'dev-wallet-bank',
    name: 'Main Account',
    number: '4532 **** 7891',
    initial: 2000,
    type: 'Bank',
  },
  {
    id: 'dev-wallet-card',
    name: 'Credit Card',
    number: '5412 **** 3456',
    initial: 500,
    type: 'Card',
  },
  {
    id: 'dev-wallet-digital',
    name: 'Digital Wallet',
    number: '9876 **** 1234',
    initial: 0,
    type: 'Digital',
  },
  {
    id: 'dev-wallet-savings',
    name: 'Savings',
    number: '1111 **** 2222',
    initial: 5000,
    type: 'Bank',
  },
  { id: 'dev-wallet-cash', name: 'Cash', number: 'Cash', initial: 200, type: 'Cash' },
] as const;

function pick<T>(arr: readonly T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randAmount(min: number, max: number, rand: () => number): number {
  return Math.round((min + rand() * (max - min)) * 100) / 100;
}

export function isLargeSeedAvailable(): boolean {
  return DEV_MODE;
}

export function generateLargeSeedData(
  count: number = LARGE_SEED_TRANSACTION_COUNT,
  now: Date = new Date()
): {
  wallets: {
    id: string;
    name: string;
    number: string;
    balance: string;
    type: string;
    isDefault: boolean;
  }[];
  transactions: Transaction[];
} {
  const rand = mulberry32(1337);
  const expenseCategories = Object.keys(EXPENSE_TITLES);
  const wallets = DEV_WALLETS.map((w) => ({ ...w, income: 0, expense: 0 }));

  const transactions: Transaction[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  for (let i = 0; i < count; i++) {
    const wallet = pick(wallets, rand);
    // Spread evenly-ish across the last 365 days, with a random time of day.
    const daysAgo = Math.floor(rand() * 365);
    const at = todayStart - daysAgo * dayMs + Math.floor(rand() * dayMs);
    const isIncome = rand() < 0.12;

    let category: string;
    let title: string;
    let amount: number;

    if (isIncome) {
      category = pick(Object.keys(INCOME_TITLES), rand);
      title = pick(INCOME_TITLES[category], rand);
      amount = randAmount(...INCOME_AMOUNTS[category], rand);
      wallet.income += amount;
    } else {
      category = pick(expenseCategories, rand);
      title = pick(EXPENSE_TITLES[category], rand);
      amount = randAmount(...AMOUNT_RANGES[category], rand);
      wallet.expense += amount;
    }

    transactions.push({
      id: `dev-tx-${String(i + 1).padStart(5, '0')}`,
      title,
      amount,
      type: isIncome ? 'income' : 'expense',
      category,
      date: new Date(at).toISOString(),
      walletId: wallet.id,
    });
  }

  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    wallets: wallets.map((w, index) => ({
      id: w.id,
      name: w.name,
      number: w.number,
      balance: formatWalletBalance((w.initial + w.income - w.expense).toString()),
      type: w.type,
      isDefault: index === 0,
    })),
    transactions,
  };
}

/**
 * Replaces accounts + transactions with a large generated dataset.
 * Dev-only: throws outside a dev build.
 */
export async function seedLargeDemoData(
  count: number = LARGE_SEED_TRANSACTION_COUNT
): Promise<void> {
  if (!isLargeSeedAvailable()) {
    throw new Error('Large seed data is only available in development builds.');
  }

  const db = await getDatabase();
  const { wallets, transactions } = generateLargeSeedData(count);

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM transactions;
      DELETE FROM accounts;
      DELETE FROM wallet_order;
    `);

    const insertWallet = await db.prepareAsync(
      'INSERT INTO accounts (id, name, number, balance, type, is_default, due_day, bill_day) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    try {
      for (let i = 0; i < wallets.length; i++) {
        const w = wallets[i];
        await insertWallet.executeAsync([
          w.id,
          w.name,
          w.number,
          w.balance,
          w.type,
          w.isDefault ? 1 : 0,
          null,
          null,
        ]);
      }
    } finally {
      await insertWallet.finalizeAsync();
    }

    const insertTx = await db.prepareAsync(
      'INSERT INTO transactions (id, title, amount, type, category, date, wallet_id, to_wallet_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    try {
      for (const tx of transactions) {
        await insertTx.executeAsync([
          tx.id,
          tx.title,
          tx.amount,
          tx.type,
          tx.category,
          tx.date,
          tx.walletId,
          null,
        ]);
      }
    } finally {
      await insertTx.finalizeAsync();
    }
  });
}
