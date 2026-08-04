import { type Transaction } from '@/utils/transaction';
import { sumByType } from '@/utils/analytics';
import { type AppState, type ExportedTable, type ExportSelection } from './types';
import { fmtMoney, filterByPeriod } from './shared';

export function buildBalancesTable(
  accounts: AppState['accounts'],
  txs: Transaction[],
  period: ExportSelection['period'],
  symbol?: string
): ExportedTable {
  const periodTxs = filterByPeriod(txs, period);
  const hasFilter = period.mode !== 'all';

  const columns = hasFilter
    ? ['Wallet', 'Balance', 'Income', 'Expense', 'Net']
    : ['Wallet', 'Balance'];

  const rows = accounts.map((a) => {
    const walletTxs = periodTxs.filter((t) => t.walletId === a.id);
    const { income, expense } = sumByType(walletTxs);
    const net = income - expense;

    const base: Record<string, string | number> = {
      Wallet: a.name,
      Balance: a.balance,
    };

    if (hasFilter) {
      base.Income = fmtMoney(income, symbol);
      base.Expense = fmtMoney(expense, symbol);
      base.Net = fmtMoney(net, symbol);
    }

    return base;
  });

  return { title: 'Balances', columns, rows };
}
