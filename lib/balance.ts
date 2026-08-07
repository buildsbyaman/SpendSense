import { type Account, parseBalance, formatWalletBalance } from '@/utils/wallet';
import { type TransactionType } from '@/utils/categories';

export function adjustAccountBalance(account: Account, delta: number, symbol?: string): Account {
  const currentVal = parseBalance(account.balance);
  return {
    ...account,
    balance: formatWalletBalance((currentVal + delta).toString(), symbol),
  };
}

export function computeTransactionDelta(
  type: TransactionType,
  amount: number,
  direction: 'apply' | 'reverse'
): number {
  // Transfers adjust two wallets (see computeTransferDelta); the single-wallet
  // delta only applies to income/expense.
  if (type === 'transfer') return 0;
  if (direction === 'apply') {
    return type === 'income' ? amount : -amount;
  }
  return type === 'income' ? -amount : amount;
}

/**
 * Delta for one side of a transfer. The source wallet loses money on apply,
 * the destination gains; both are reversed on reverse.
 */
export function computeTransferDelta(
  side: 'from' | 'to',
  amount: number,
  direction: 'apply' | 'reverse'
): number {
  const sign = side === 'from' ? -1 : 1;
  return direction === 'apply' ? sign * amount : -sign * amount;
}
