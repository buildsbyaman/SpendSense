import { type Transaction } from '@/utils/transaction';
import { type AppState, type ExportedTable, type ExportSelection } from './types';
import { fmtMoney, filterByPeriod } from './shared';

export function buildBudgetsTable(
  budgets: AppState['budgets'],
  txs: Transaction[],
  period: ExportSelection['period'],
  symbol?: string
): ExportedTable {
  const periodTxs = filterByPeriod(txs, period);

  return {
    title: 'Budgets',
    columns: ['Category', 'Budget', 'Spent', 'Remaining', '% Used'],
    rows: budgets.map((b) => {
      const spent = periodTxs
        .filter((t) => t.category === b.category && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const remaining = b.amount - spent;
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

      return {
        Category: b.category,
        Budget: fmtMoney(b.amount, symbol),
        Spent: fmtMoney(spent, symbol),
        Remaining: fmtMoney(remaining, symbol),
        '% Used': `${pct}%`,
      };
    }),
  };
}
