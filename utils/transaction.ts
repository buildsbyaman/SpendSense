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
  [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

/**
 * Inserts a transaction into an already sorted (newest-first) list without
 * re-sorting the whole array. O(log n) search + O(n) copy instead of O(n log n).
 *
 * The insert point is the first entry that is not strictly newer than `tx`, so
 * a transaction with the same timestamp as existing ones lands before them —
 * matching a stable sort of `[tx, ...transactions]`.
 */
export const insertTransactionByDate = (
  transactions: Transaction[],
  tx: Transaction
): Transaction[] => {
  const time = new Date(tx.date).getTime();
  // Corrupt/imported date: fall back to a full sort so ordering matches the
  // previous behaviour exactly.
  if (!Number.isFinite(time)) return sortTransactionsByDate([tx, ...transactions]);

  let low = 0;
  let high = transactions.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    const midTime = new Date(transactions[mid].date).getTime();
    if (!Number.isFinite(midTime)) return sortTransactionsByDate([tx, ...transactions]);
    if (midTime > time) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return [...transactions.slice(0, low), tx, ...transactions.slice(low)];
};

/**
 * Replaces a transaction and keeps the list sorted by date. Used on edit, where
 * the date may have changed and the row has to move.
 */
export const replaceTransactionByDate = (
  transactions: Transaction[],
  updated: Transaction
): Transaction[] =>
  insertTransactionByDate(
    transactions.filter((t) => t.id !== updated.id),
    updated
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
  const parsedAmount = parseFloat(amountText.replace(/[^0-9.-]/g, ''));
  if (isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount === 0) {
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
 *
 * Boundaries are converted to UTC instants once. Stored dates are canonical
 * ISO-8601 UTC strings (`Date#toISOString`), so a lexicographic comparison is
 * equivalent to comparing instants and saves a `Date` allocation per row.
 */
export const filterTransactionsByDateRange = (
  transactions: Transaction[],
  fromDate: Date | null,
  toDate: Date | null
): Transaction[] => {
  if (!fromDate && !toDate) return transactions;

  const fromIso = fromDate
    ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).toISOString()
    : null;
  const toIso = toDate
    ? new Date(
        toDate.getFullYear(),
        toDate.getMonth(),
        toDate.getDate(),
        23,
        59,
        59,
        999
      ).toISOString()
    : null;
  // Used only for imported, non-canonical date strings.
  const fromTime = fromIso ? Date.parse(fromIso) : null;
  const toTime = toIso ? Date.parse(toIso) : null;

  return transactions.filter((tx) => {
    const isCanonical = tx.date.length === 24 && tx.date.charCodeAt(23) === 90; // ...Z
    if (!isCanonical) {
      const time = new Date(tx.date).getTime();
      return (fromTime === null || time >= fromTime) && (toTime === null || time <= toTime);
    }
    return (fromIso === null || tx.date >= fromIso) && (toIso === null || tx.date <= toIso);
  });
};

export interface TransactionDayGroup {
  /** Local calendar day, e.g. `2026-10-29`. */
  key: string;
  /** Display label, formatted once per unique day. */
  label: string;
  transactions: Transaction[];
}

/**
 * Groups newest-first transactions by local calendar day.
 *
 * The key is derived from the local date (not `date.slice(0, 10)`) because
 * dates are stored as UTC instants: for timezones behind/ahead of UTC the UTC
 * day is not the day the user saw when creating the transaction.
 */
export const groupTransactionsByDay = (transactions: Transaction[]): TransactionDayGroup[] => {
  const groups = new Map<string, TransactionDayGroup>();

  for (const tx of transactions) {
    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        label: date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        transactions: [],
      };
      groups.set(key, group);
    }
    group.transactions.push(tx);
  }

  return [...groups.values()];
};
