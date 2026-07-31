import {
  type Transaction,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCategoryColor,
} from './transaction';

export type TypeFilter = 'all' | 'income' | 'expense';

interface MonthBounds {
  from: Date;
  to: Date;
}

export function getMonthBounds(year: number, month: number): MonthBounds {
  const from = new Date(year, month, 1);
  from.setHours(0, 0, 0, 0);
  const to = new Date(year, month + 1, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

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

export function filterByYear(
  transactions: Transaction[],
  year: number
): Transaction[] {
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
    else expense += tx.amount;
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

export function buildDailySeries(
  transactions: Transaction[],
  year: number,
  month: number
): { day: number; income: number; expense: number }[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const series: { day: number; income: number; expense: number }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    series.push({ day: d, income: 0, expense: 0 });
  }
  const { from, to } = getMonthBounds(year, month);
  for (const tx of transactions) {
    const d = new Date(tx.date);
    if (d >= from && d <= to) {
      const idx = d.getDate() - 1;
      if (tx.type === 'income') series[idx].income += tx.amount;
      else series[idx].expense += tx.amount;
    }
  }
  return series;
}

export function buildWeeklySeries(
  transactions: Transaction[],
  year: number,
  month: number
): { day: number; label: string; income: number; expense: number }[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const series: { day: number; label: string; income: number; expense: number }[] = [];
  
  for (let w = 0; w < 5; w++) {
    const start = w * 7 + 1;
    if (start > daysInMonth) break;
    series.push({ day: start, label: `W${w + 1}`, income: 0, expense: 0 });
  }

  const { from, to } = getMonthBounds(year, month);
  for (const tx of transactions) {
    const d = new Date(tx.date);
    if (d >= from && d <= to) {
      const day = d.getDate();
      const weekIdx = Math.min(Math.floor((day - 1) / 7), 4);
      if (tx.type === 'income') series[weekIdx].income += tx.amount;
      else series[weekIdx].expense += tx.amount;
    }
  }
  return series;
}

export function buildMonthlySeries(
  transactions: Transaction[],
  year: number
): { day: number; label: string; income: number; expense: number }[] {
  const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const series: { day: number; label: string; income: number; expense: number }[] = [];
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const maxMonth = year === currentYear ? now.getMonth() : 11;
  
  for (let m = 0; m <= maxMonth; m++) {
    series.push({ day: m, label: SHORT_MONTHS[m], income: 0, expense: 0 });
  }

  const from = new Date(year, 0, 1);
  from.setHours(0, 0, 0, 0);
  const to = new Date(year, 11, 31);
  to.setHours(23, 59, 59, 999);

  for (const tx of transactions) {
    const d = new Date(tx.date);
    if (d >= from && d <= to) {
      const monthIdx = d.getMonth();
      if (monthIdx <= maxMonth) {
        if (tx.type === 'income') series[monthIdx].income += tx.amount;
        else series[monthIdx].expense += tx.amount;
      }
    }
  }
  return series;
}

export function getPreviousStats(
  transactions: Transaction[],
  year: number,
  month: number | null
): {
  prevIncome: number;
  prevExpense: number;
  incomeDelta: number | null;
  expenseDelta: number | null;
} {
  let prevTxs: Transaction[];
  let currentTxs: Transaction[];

  if (month !== null) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    prevTxs = filterByMonth(transactions, prevYear, prevMonth);
    currentTxs = filterByMonth(transactions, year, month);
  } else {
    prevTxs = filterByYear(transactions, year - 1);
    currentTxs = filterByYear(transactions, year);
  }
  const { income: prevIncome, expense: prevExpense } = sumByType(prevTxs);
  const { income: curIncome, expense: curExpense } = sumByType(currentTxs);

  const incomeDelta =
    prevIncome > 0 ? ((curIncome - prevIncome) / prevIncome) * 100 : curIncome > 0 ? 100 : null;
  const expenseDelta =
    prevExpense > 0
      ? ((curExpense - prevExpense) / prevExpense) * 100
      : curExpense > 0
        ? 100
        : null;

  return { prevIncome, prevExpense, incomeDelta, expenseDelta };
}

export function getLast6Months(transactions: Transaction[], year: number, month: number) {
  const result: { label: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = month - i;
    const yr = m < 0 ? year - 1 : year;
    const mo = ((m % 12) + 12) % 12;
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const txs = filterByMonth(transactions, yr, mo);
    const { income, expense } = sumByType(txs);
    result.push({ label: months[mo], income, expense });
  }
  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────

/** Rounds a value up to a clean chart ceiling. */
export function niceCeil(value: number): number {
  if (value <= 0) return 100;
  let step: number;
  if (value < 50) step = 10;
  else if (value < 200) step = 50;
  else if (value < 1000) step = 100;
  else if (value < 5000) step = 500;
  else step = 1000;
  return Math.ceil(value / step) * step;
}

/** Compact axis label: $1.2k, $850, $12.5k */
export function formatCompactCurrency(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) {
    const k = abs / 1000;
    const s = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1);
    return v < 0 ? `-$${s}k` : `$${s}k`;
  }
  return v < 0 ? `-$${Math.round(abs)}` : `$${Math.round(abs)}`;
}

export function savingsRate(income: number, expense: number): number | null {
  if (income <= 0) return null;
  return Math.round(((income - expense) / income) * 100);
}
