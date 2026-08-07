import { type Transaction } from '../transaction';
import { getMonthBounds, SHORT_MONTHS } from '../date';
import { filterByMonth, filterByYear, sumByType } from './filters';

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
      else if (tx.type === 'expense') series[weekIdx].expense += tx.amount;
    }
  }
  return series;
}

const LABEL_DAYS = new Set([1, 5, 10, 15, 20, 25, 30]);

export function buildDailySeries(
  transactions: Transaction[],
  year: number,
  month: number
): { day: number; label: string; income: number; expense: number }[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const series: { day: number; label: string; income: number; expense: number }[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    series.push({ day, label: LABEL_DAYS.has(day) ? String(day) : '', income: 0, expense: 0 });
  }

  const { from, to } = getMonthBounds(year, month);
  for (const tx of transactions) {
    const d = new Date(tx.date);
    if (d >= from && d <= to) {
      const idx = d.getDate() - 1;
      if (tx.type === 'income') series[idx].income += tx.amount;
      else if (tx.type === 'expense') series[idx].expense += tx.amount;
    }
  }
  return series;
}

export function buildYearlyWeekSeries(
  transactions: Transaction[],
  year: number
): { day: number; label: string; income: number; expense: number }[] {
  const series: { day: number; label: string; income: number; expense: number }[] = [];
  for (let w = 0; w < 52; w++) {
    series.push({
      day: w,
      label: w % 4 === 0 ? `W${w + 1}` : '',
      income: 0,
      expense: 0,
    });
  }

  const from = new Date(year, 0, 1);
  from.setHours(0, 0, 0, 0);
  const to = new Date(year, 11, 31);
  to.setHours(23, 59, 59, 999);
  const yearStart = from.getTime();

  for (const tx of transactions) {
    const d = new Date(tx.date);
    if (d >= from && d <= to) {
      const weekIdx = Math.min(Math.floor((d.getTime() - yearStart) / (7 * 86400000)), 51);
      if (tx.type === 'income') series[weekIdx].income += tx.amount;
      else if (tx.type === 'expense') series[weekIdx].expense += tx.amount;
    }
  }
  return series;
}

export function buildMonthlySeries(
  transactions: Transaction[],
  year: number
): { day: number; label: string; income: number; expense: number }[] {
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
        else if (tx.type === 'expense') series[monthIdx].expense += tx.amount;
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
    const txs = filterByMonth(transactions, yr, mo);
    const { income, expense } = sumByType(txs);
    result.push({ label: SHORT_MONTHS[mo], income, expense });
  }
  return result;
}
