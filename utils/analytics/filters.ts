import { type Transaction } from '../transaction';
import { getCategoryColor } from '../categories';
import { getMonthBounds } from '../date';

export type TypeFilter = 'all' | 'income' | 'expense';

export function filterByMonth(
  transactions: Transaction[],
  year: number,
  month: number
): Transaction[] {
  const { from, to } = getMonthBounds(year, month);
  return transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d >= from && d <= to;
  });
}

export function filterByYear(transactions: Transaction[], year: number): Transaction[] {
  const from = new Date(year, 0, 1);
  from.setHours(0, 0, 0, 0);
  const to = new Date(year, 11, 31);
  to.setHours(23, 59, 59, 999);

  return transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d >= from && d <= to;
  });
}

export function filterByType(transactions: Transaction[], type: TypeFilter): Transaction[] {
  if (type === 'all') return transactions;
  return transactions.filter((tx) => tx.type === type);
}

export function sumByType(transactions: Transaction[]): {
  income: number;
  expense: number;
} {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (tx.type === 'income') income += tx.amount;
    else if (tx.type === 'expense') expense += tx.amount;
  }
  return { income, expense };
}

export function groupByCategory(transactions: Transaction[]): {
  name: string;
  amount: number;
  color: string;
  count: number;
}[] {
  const map = new Map<string, { amount: number; count: number }>();
  for (const tx of transactions) {
    const key = tx.category;
    const prev = map.get(key);
    if (prev) {
      prev.amount += tx.amount;
      prev.count += 1;
    } else {
      map.set(key, { amount: tx.amount, count: 1 });
    }
  }
  return Array.from(map.entries())
    .map(([name, { amount, count }]) => ({
      name,
      amount,
      color: getCategoryColor(name),
      count,
    }))
    .sort((a, b) => b.amount - a.amount);
}
