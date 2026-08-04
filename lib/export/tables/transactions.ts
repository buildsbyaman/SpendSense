import { type Transaction } from '@/utils/transaction';
import { type Subscription } from '@/utils/subscription';
import { type AppState, type ExportedTable } from './types';
import { fmtMoney, fmtDate } from './shared';

export function buildTransactionsTable(
  txs: Transaction[],
  accounts: AppState['accounts'],
  symbol?: string
): ExportedTable {
  const walletName = (wid: string) => accounts.find((a) => a.id === wid)?.name ?? wid;

  return {
    title: 'Transactions',
    columns: ['Date', 'Title', 'Category', 'Type', 'Amount', 'Wallet', 'Date ISO'],
    rows: [...txs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((tx) => ({
        Date: fmtDate(tx.date),
        Title: tx.title,
        Category: tx.category,
        Type: tx.type,
        Amount: fmtMoney(tx.amount, symbol),
        Wallet: walletName(tx.walletId),
        'Date ISO': tx.date,
      })),
  };
}

export function buildSubscriptionsTable(
  subs: Subscription[],
  accounts: AppState['accounts'],
  symbol?: string
): ExportedTable {
  const walletName = (wid: string) => accounts.find((a) => a.id === wid)?.name ?? wid;

  return {
    title: 'Subscriptions',
    columns: [
      'Name',
      'Amount',
      'Cycle',
      'Category',
      'Next Billing',
      'Next Billing ISO',
      'Status',
      'End Date',
      'End Date ISO',
      'Wallet',
    ],
    rows: subs.map((s) => ({
      Name: s.name,
      Amount: fmtMoney(s.amount, symbol),
      Cycle: s.cycle.charAt(0).toUpperCase() + s.cycle.slice(1),
      Category: s.category,
      'Next Billing': fmtDate(s.next_billing_date),
      'Next Billing ISO': s.next_billing_date,
      Status: s.is_active === 1 ? 'Active' : 'Inactive',
      'End Date': s.end_date ? fmtDate(s.end_date) : '—',
      'End Date ISO': s.end_date ?? '',
      Wallet: walletName(s.wallet_id),
    })),
  };
}
