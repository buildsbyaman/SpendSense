import { formatWalletBalance } from '@/utils/wallet';
import { type Transaction } from '@/utils/transaction';

interface SeedWallet {
  id: string;
  name: string;
  number: string;
  balance: string;
  type: string;
  isDefault: boolean;
}

const WALLET_DEFS = [
  {
    id: 'wallet-bank',
    name: 'Main Account',
    number: '4532 **** 7891',
    initial: 2000,
    type: 'Bank',
    isDefault: true,
  },
  {
    id: 'wallet-card',
    name: 'Credit Card',
    number: '5412 **** 3456',
    initial: 500,
    type: 'Card',
    isDefault: false,
  },
  {
    id: 'wallet-digital',
    name: 'Digital Wallet',
    number: '9876 **** 1234',
    initial: 0,
    type: 'Digital',
    isDefault: false,
  },
];

const EXPENSE_TITLES: Record<string, string[]> = {
  Food: [
    'Starbucks Coffee',
    'Grocery Run',
    'Lunch - Chipotle',
    'Dinner - Olive Garden',
    'Breakfast - Dunkin',
    'Pizza Night',
    'Thai Takeout',
    'Sushi Dinner',
    'Whole Foods',
    'Trader Joes',
  ],
  Transport: [
    'Uber Ride',
    'Gas Station',
    'Metro Card Reload',
    'Parking Fee',
    'Car Wash',
    'Lyft Ride',
  ],
  Shopping: [
    'Amazon Order',
    'New Sneakers',
    'Clothing Store',
    'Home Depot',
    'Target Run',
    'Best Buy',
  ],
  Entertainment: [
    'Netflix Subscription',
    'Movie Tickets',
    'Concert Tickets',
    'Spotify Premium',
    'Bowling Night',
    'Disney Plus',
  ],
  Bills: [
    'Electricity Bill',
    'Internet Bill',
    'Phone Bill',
    'Water Bill',
    'Insurance Payment',
    'Rent',
  ],
  Medical: ['Pharmacy', 'Gym Membership', 'Doctor Visit', 'Dental Cleaning', 'Vitamins'],
  Miscellaneous: ['Udemy Course', 'Book Purchase', 'Online Workshop', 'Skillshare'],
  Others: ['Gift for Friend', 'Charity Donation', 'Pet Supplies', 'Dry Cleaning', 'ATM Fee'],
};

const INCOME_TITLES: Record<string, string[]> = {
  Salary: ['Monthly Salary'],
  Business: ['Freelance Project', 'Consulting Fee', 'Side Gig', 'Client Payment'],
  Investment: ['Interest Income', 'Dividend Payment'],
};

const EXPENSE_CATEGORIES = Object.keys(EXPENSE_TITLES);

const AMOUNT_RANGES: Record<string, [number, number]> = {
  Food: [8, 85],
  Transport: [12, 60],
  Shopping: [25, 200],
  Entertainment: [10, 60],
  Bills: [40, 200],
  Medical: [15, 120],
  Miscellaneous: [15, 80],
  Others: [5, 100],
};

const INCOME_AMOUNTS: Record<string, [number, number]> = {
  Salary: [3800, 5200],
  Business: [200, 1500],
  Investment: [15, 80],
};

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randAmount(min: number, max: number, rand: () => number): number {
  return Math.round((min + rand() * (max - min)) * 100) / 100;
}

function randDay(year: number, month: number, rand: () => number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return 1 + Math.floor(rand() * daysInMonth);
}

const WALLET_IDS = ['wallet-bank', 'wallet-card', 'wallet-digital'] as const;

export function generateSeedData(symbol?: string) {
  const rand = mulberry32(42);
  const now = new Date();

  const transactions: Transaction[] = [];
  let txCounter = 0;

  const walletTotals: Record<string, { income: number; expense: number }> = {
    'wallet-bank': { income: 0, expense: 0 },
    'wallet-card': { income: 0, expense: 0 },
    'wallet-digital': { income: 0, expense: 0 },
  };

  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - 11 + m, 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const salaryAmount = randAmount(...INCOME_AMOUNTS.Salary, rand);
    transactions.push({
      id: `tx-${String(++txCounter).padStart(3, '0')}`,
      title: 'Monthly Salary',
      amount: salaryAmount,
      type: 'income',
      category: 'Salary',
      date: new Date(year, month, 1).toISOString(),
      walletId: 'wallet-bank',
    });
    walletTotals['wallet-bank'].income += salaryAmount;

    const extraIncomeCount = 1 + (rand() > 0.5 ? 1 : 0);
    for (let i = 0; i < extraIncomeCount; i++) {
      const cat = pick(['Business', 'Investment'] as const, rand);
      const title = pick(INCOME_TITLES[cat], rand);
      const amount = randAmount(...INCOME_AMOUNTS[cat], rand);
      const walletId = pick([...WALLET_IDS], rand);
      const day = randDay(year, month, rand);
      transactions.push({
        id: `tx-${String(++txCounter).padStart(3, '0')}`,
        title,
        amount,
        type: 'income',
        category: cat,
        date: new Date(year, month, day).toISOString(),
        walletId,
      });
      walletTotals[walletId].income += amount;
    }

    const expenseCount = 10 + Math.floor(rand() * 5);
    for (let i = 0; i < expenseCount; i++) {
      const cat = pick(EXPENSE_CATEGORIES, rand);
      const title = pick(EXPENSE_TITLES[cat], rand);
      const [min, max] = AMOUNT_RANGES[cat];
      const amount = randAmount(min, max, rand);
      const walletId = pick([...WALLET_IDS], rand);
      const day = randDay(year, month, rand);
      transactions.push({
        id: `tx-${String(++txCounter).padStart(3, '0')}`,
        title,
        amount,
        type: 'expense',
        category: cat,
        date: new Date(year, month, day).toISOString(),
        walletId,
      });
      walletTotals[walletId].expense += amount;
    }
  }

  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const wallets: SeedWallet[] = WALLET_DEFS.map((w) => {
    const totals = walletTotals[w.id];
    const reconciled = w.initial + totals.income - totals.expense;
    return {
      id: w.id,
      name: w.name,
      number: w.number,
      balance: formatWalletBalance(reconciled.toString(), symbol),
      type: w.type,
      isDefault: w.isDefault,
    };
  });

  return { wallets, transactions };
}
