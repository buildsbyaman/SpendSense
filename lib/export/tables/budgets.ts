import { type Transaction } from '@/utils/transaction';
import { type AppState, type ExportedTable, type ExportSelection } from './types';
import { fmtMoney, filterByPeriod, filterBudgetsByPeriod } from './shared';

function formatBudgetDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function buildBudgetsTable(
  budgets: AppState['budgets'],
  txs: Transaction[],
  period: ExportSelection['period'],
  symbol?: string
): ExportedTable {
  const periodTxs = filterByPeriod(txs, period);
  const filteredBudgets = filterBudgetsByPeriod(budgets, period);

  return {
    title: 'Budgets',
    columns: [
      'Category',
      'Budget',
      'Spent',
      'Remaining',
      '% Used',
      'Start Date',
      'Start Date ISO',
      'End Date',
      'End Date ISO',
    ],
    rows: filteredBudgets.map((b) => {
      const bStart = b.start_date ? new Date(b.start_date + 'T00:00:00') : null;
      const bEnd = b.end_date ? new Date(b.end_date + 'T23:59:59.999') : null;

      const spent = periodTxs
        .filter((t) => {
          if (t.category !== b.category || t.type !== 'expense') return false;
          const tDate = new Date(t.date);
          if (bStart && tDate < bStart) return false;
          if (bEnd && tDate > bEnd) return false;
          return true;
        })
        .reduce((sum, t) => sum + t.amount, 0);
      const remaining = b.amount - spent;
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

      return {
        Category: b.category,
        Budget: fmtMoney(b.amount, symbol),
        Spent: fmtMoney(spent, symbol),
        Remaining: fmtMoney(remaining, symbol),
        '% Used': `${pct}%`,
        'Start Date': b.start_date ? formatBudgetDate(b.start_date) : '—',
        'Start Date ISO': b.start_date ?? '',
        'End Date': b.end_date ? formatBudgetDate(b.end_date) : 'Infinity',
        'End Date ISO': b.end_date ?? '',
      };
    }),
  };
}
