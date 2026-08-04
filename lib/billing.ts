import type { Account } from '@/utils/wallet';
import type { Transaction } from '@/utils/transaction';
import type { Subscription } from '@/utils/subscription';
import { getNextBillingDate } from '@/utils/subscription';
import { adjustAccountBalance, computeTransactionDelta } from '@/lib/balance';
import { newId } from '@/lib/id';

export interface BillingResult {
  txs: Transaction[];
  updatedAccount?: Account;
  nextDate: string;
}

export function processSubscriptionBilling(
  sub: Subscription,
  accounts: Account[],
  currencySymbol: string
): BillingResult {
  if (sub.is_active !== 1 || !sub.wallet_id) {
    return { txs: [], nextDate: sub.next_billing_date };
  }

  const now = new Date();
  let nextDate = new Date(sub.next_billing_date);
  const txs: Transaction[] = [];
  let acc = accounts.find((a) => a.id === sub.wallet_id) ?? undefined;
  let iterations = 0;

  while (nextDate <= now && iterations < 24) {
    if (sub.end_date && nextDate > new Date(sub.end_date)) break;

    txs.push({
      id: newId(),
      title: sub.name,
      amount: sub.amount,
      type: 'expense',
      category: sub.category,
      date: nextDate.toISOString(),
      walletId: sub.wallet_id,
    });

    if (acc) {
      acc = adjustAccountBalance(acc, computeTransactionDelta('expense', sub.amount, 'apply'), currencySymbol);
    }

    nextDate = getNextBillingDate(nextDate, sub.cycle);
    iterations++;
  }

  // Fast-forward past now if still overdue after capped loop
  let ffIterations = 0;
  while (nextDate <= now && ffIterations < 24) {
    const advanced = getNextBillingDate(nextDate, sub.cycle);
    if (advanced.getTime() === nextDate.getTime()) break;
    nextDate = advanced;
    ffIterations++;
  }

  return { txs, updatedAccount: acc, nextDate: nextDate.toISOString() };
}
