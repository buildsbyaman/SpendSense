import { type Account, parseBalance, formatWalletBalance } from '@/utils/wallet';

export function adjustAccountBalance(account: Account, delta: number): Account {
  const currentVal = parseBalance(account.balance);
  return {
    ...account,
    balance: formatWalletBalance((currentVal + delta).toString()),
  };
}

export function computeTransactionDelta(
  type: 'income' | 'expense',
  amount: number,
  direction: 'apply' | 'reverse'
): number {
  if (direction === 'apply') {
    return type === 'income' ? amount : -amount;
  }
  return type === 'income' ? -amount : amount;
}
