import { type TransactionType } from './categories';

// Category domain (icons, colors, default categories, custom categories) lives
// in ./categories; date helpers live in ./date. Re-exported here so existing
// `@/utils/transaction` imports keep working unchanged.
export * from './categories';
export { formatDatePickerDate } from './date';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO string format
  walletId: string; // References Account.id
  toWalletId?: string; // Destination Account.id for transfers
}

/**
 * Sorts transactions newest-first by date. Shared by create, edit, and load so
 * a transaction always keeps its chronological place (never jumps to the top
 * on create and back down on edit).
 */
export const sortTransactionsByDate = (transactions: Transaction[]): Transaction[] =>
  [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

/**
 * Sanitizes the raw input amount to prevent negative signs and multiple decimals.
 */
export const sanitizeAmountInput = (text: string): string => {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
};

/**
 * Validates transaction inputs.
 */
export const validateTransaction = (
  amountText: string,
  walletId: string,
  type?: TransactionType,
  toWalletId?: string
): { isValid: boolean; errorTitle?: string; errorMessage?: string; parsedAmount?: number } => {
  const parsedAmount = parseFloat(amountText.replace(/[^0-9.]/g, ''));
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return {
      isValid: false,
      errorTitle: 'Invalid Amount',
      errorMessage: 'Please enter a valid transaction amount',
    };
  }

  if (!walletId) {
    return {
      isValid: false,
      errorTitle: 'Wallet Required',
      errorMessage: 'Please add a wallet first before creating a transaction',
    };
  }

  if (type === 'transfer') {
    if (!toWalletId) {
      return {
        isValid: false,
        errorTitle: 'Destination Wallet Required',
        errorMessage: 'Please choose a wallet to transfer to',
      };
    }
    if (toWalletId === walletId) {
      return {
        isValid: false,
        errorTitle: 'Same Wallet',
        errorMessage: 'From and To wallets must be different for a transfer',
      };
    }
  }

  return { isValid: true, parsedAmount };
};

/**
 * Filters transactions based on a search query.
 * Matches title, category, wallet name, and amount.
 */
export const searchTransactions = (
  transactions: Transaction[],
  query: string,
  getWalletName: (walletId: string) => string
): Transaction[] => {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return transactions;

  return transactions.filter((tx) => {
    const titleMatch = tx.title.toLowerCase().includes(lowerQuery);
    const categoryMatch = tx.category.toLowerCase().includes(lowerQuery);
    const walletMatch = getWalletName(tx.walletId).toLowerCase().includes(lowerQuery);
    const amountMatch = tx.amount.toString().includes(lowerQuery);

    return titleMatch || categoryMatch || walletMatch || amountMatch;
  });
};

/**
 * Filters transactions within a date range (inclusive).
 */
export const filterTransactionsByDateRange = (
  transactions: Transaction[],
  fromDate: Date | null,
  toDate: Date | null
): Transaction[] => {
  if (!fromDate && !toDate) return transactions;

  return transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    txDate.setHours(0, 0, 0, 0);

    const normalizedFrom = fromDate
      ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
      : null;
    const normalizedTo = toDate
      ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999)
      : null;

    const isAfterFrom = normalizedFrom ? txDate >= normalizedFrom : true;
    const isBeforeTo = normalizedTo ? txDate <= normalizedTo : true;

    return isAfterFrom && isBeforeTo;
  });
};
