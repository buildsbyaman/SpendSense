import { 
  Utensils, 
  ShoppingBag, 
  Car, 
  FileText, 
  Film, 
  DollarSign, 
  HelpCircle,
  Heart,
  Layers,
  Briefcase,
  TrendingUp,
  Gift,
  type LucideIcon 
} from 'lucide-react-native';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO string format
  walletId: string; // References Account.id
}

export interface TransactionCategory {
  name: string;
  icon: LucideIcon;
  color: string;
}

export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  { name: 'Food', icon: Utensils, color: '#f59e0b' }, // amber
  { name: 'Shopping', icon: ShoppingBag, color: '#ec4899' }, // pink
  { name: 'Transport', icon: Car, color: '#3b82f6' }, // blue
  { name: 'Bills', icon: FileText, color: '#6366f1' }, // indigo
  { name: 'Entertainment', icon: Film, color: '#8b5cf6' }, // violet
  { name: 'Medical', icon: Heart, color: '#ef4444' }, // red
  { name: 'Miscellaneous', icon: Layers, color: '#06b6d4' }, // cyan
  { name: 'Others', icon: HelpCircle, color: '#6b7280' }, // gray
];

export const INCOME_CATEGORIES: TransactionCategory[] = [
  { name: 'Salary', icon: DollarSign, color: '#10b981' }, // emerald
  { name: 'Business', icon: Briefcase, color: '#3b82f6' }, // blue
  { name: 'Investment', icon: TrendingUp, color: '#8b5cf6' }, // violet
  { name: 'Gift', icon: Gift, color: '#ec4899' }, // pink
  { name: 'Others', icon: HelpCircle, color: '#6b7280' }, // gray
];

const COMBINED_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const getCategoryIcon = (categoryName: string): LucideIcon => {
  const category = COMBINED_CATEGORIES.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  return category ? category.icon : HelpCircle;
};

export const getCategoryColor = (categoryName: string): string => {
  const category = COMBINED_CATEGORIES.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );
  return category ? category.color : '#6b7280';
};

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
  walletId: string
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

  return { isValid: true, parsedAmount };
};

/**
 * Formats a Date object cleanly (e.g. "30 Jul").
 */
export const formatDatePickerDate = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
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
    txDate.setHours(0, 0, 0, 0); // Normalize time for comparison

    const isAfterFrom = fromDate ? txDate >= fromDate : true;
    const isBeforeTo = toDate ? txDate <= toDate : true;

    return isAfterFrom && isBeforeTo;
  });
};
