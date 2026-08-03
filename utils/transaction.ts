import { 
  Utensils, 
  ShoppingBag, 
  Car, 
  FileText, 
  Film, 
  DollarSign, 
  HelpCircle,
  Tag,
  Heart,
  Layers,
  Briefcase,
  TrendingUp,
  Gift,
  // New icons for comprehensive mapping
  Percent,
  Home,
  Zap,
  Droplets,
  ShoppingCart,
  Coffee,
  PlaySquare,
  Repeat,
  Plane,
  MapPin,
  Book,
  GraduationCap,
  Activity,
  Pill,
  Smartphone,
  Wifi,
  Tv,
  Music,
  Dumbbell,
  Scissors,
  Baby,
  Dog,
  Shield,
  Landmark,
  CreditCard,
  Coins,
  PiggyBank,
  Wrench,
  Bus,
  Train,
  Fuel,
  Ticket,
  Camera,
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

export interface CustomCategory {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
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

const KEYWORD_ICONS: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ['interest', 'dividend', 'yield', 'return', 'profit'], icon: TrendingUp },
  { keywords: ['percent', 'tax', 'fee'], icon: Percent },
  { keywords: ['home', 'rent', 'mortgage', 'housing', 'apartment'], icon: Home },
  { keywords: ['utility', 'electric', 'power'], icon: Zap },
  { keywords: ['water', 'liquid'], icon: Droplets },
  { keywords: ['grocery', 'groceries', 'market', 'supermarket'], icon: ShoppingCart },
  { keywords: ['dining', 'restaurant', 'food', 'meal'], icon: Utensils },
  { keywords: ['coffee', 'cafe', 'drink', 'beverage'], icon: Coffee },
  { keywords: ['subscription', 'netflix', 'hulu', 'streaming', 'video'], icon: PlaySquare },
  { keywords: ['recurring', 'repeat', 'regular'], icon: Repeat },
  { keywords: ['flight', 'plane', 'airplane', 'travel', 'vacation', 'air'], icon: Plane },
  { keywords: ['hotel', 'airbnb', 'lodging', 'stay'], icon: MapPin },
  { keywords: ['education', 'school', 'tuition', 'course'], icon: GraduationCap },
  { keywords: ['book', 'stationery', 'magazine'], icon: Book },
  { keywords: ['health', 'medical', 'doctor', 'hospital', 'clinic'], icon: Activity },
  { keywords: ['pharmacy', 'medicine', 'drug', 'pill'], icon: Pill },
  { keywords: ['phone', 'mobile', 'cell', 'telephone'], icon: Smartphone },
  { keywords: ['internet', 'wifi', 'broadband'], icon: Wifi },
  { keywords: ['tv', 'television', 'cable'], icon: Tv },
  { keywords: ['music', 'spotify', 'apple music', 'concert'], icon: Music },
  { keywords: ['gym', 'fitness', 'workout', 'sports'], icon: Dumbbell },
  { keywords: ['salon', 'hair', 'beauty', 'spa', 'barber'], icon: Scissors },
  { keywords: ['baby', 'child', 'kids', 'diaper', 'toy'], icon: Baby },
  { keywords: ['pet', 'dog', 'cat', 'vet'], icon: Dog },
  { keywords: ['insurance', 'protection', 'policy'], icon: Shield },
  { keywords: ['bank', 'loan', 'mortgage'], icon: Landmark },
  { keywords: ['card', 'credit'], icon: CreditCard },
  { keywords: ['cash', 'atm', 'withdrawal'], icon: Coins },
  { keywords: ['savings', 'deposit', 'stash'], icon: PiggyBank },
  { keywords: ['repair', 'maintenance', 'fix', 'hardware'], icon: Wrench },
  { keywords: ['bus', 'transit'], icon: Bus },
  { keywords: ['train', 'subway', 'metro'], icon: Train },
  { keywords: ['gas', 'fuel', 'petrol', 'diesel'], icon: Fuel },
  { keywords: ['movie', 'cinema', 'ticket', 'event'], icon: Ticket },
  { keywords: ['photo', 'camera', 'hobby'], icon: Camera },
];

// Provide a list of icons that users can select manually in the UI
export const AVAILABLE_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: 'Utensils', icon: Utensils },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Car', icon: Car },
  { name: 'FileText', icon: FileText },
  { name: 'Film', icon: Film },
  { name: 'Heart', icon: Heart },
  { name: 'Home', icon: Home },
  { name: 'Zap', icon: Zap },
  { name: 'Droplets', icon: Droplets },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Coffee', icon: Coffee },
  { name: 'Plane', icon: Plane },
  { name: 'MapPin', icon: MapPin },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Activity', icon: Activity },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Baby', icon: Baby },
  { name: 'Dog', icon: Dog },
  { name: 'Shield', icon: Shield },
  { name: 'Book', icon: Book },
];

export const AVAILABLE_PALETTE = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#64748b', // Slate
  '#9ca3af', // Gray
  '#ffffff', // White
];

export const getCategoryIcon = (categoryName: string, title?: string, customIconName?: string): LucideIcon => {
  if (customIconName) {
    const customIcon = AVAILABLE_ICONS.find(i => i.name === customIconName);
    if (customIcon) return customIcon.icon;
  }

  const lowerName = categoryName.toLowerCase();
  
  // 1. Exact match in predefined categories
  const category = COMBINED_CATEGORIES.find(
    (c) => c.name.toLowerCase() === lowerName
  );
  if (category) return category.icon;

  // 2. Keyword match in Category Name
  for (const mapping of KEYWORD_ICONS) {
    for (const keyword of mapping.keywords) {
      if (lowerName.includes(keyword)) {
        return mapping.icon;
      }
    }
  }

  // 3. Keyword match in Title
  if (title) {
    const lowerTitle = title.toLowerCase();
    for (const mapping of KEYWORD_ICONS) {
      for (const keyword of mapping.keywords) {
        if (lowerTitle.includes(keyword)) {
          return mapping.icon;
        }
      }
    }
  }

  // 4. Fallback
  return Tag;
};

// Golden ratio conjugate for generating distinct random hues
const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;
let currentHue = Math.random();
const customCategoryColors = new Map<string, string>();

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export const getCategoryColor = (categoryName: string, customColor?: string): string => {
  if (customColor) return customColor;

  const lowerName = categoryName.toLowerCase();
  const category = COMBINED_CATEGORIES.find(
    (c) => c.name.toLowerCase() === lowerName
  );
  if (category) return category.color;

  if (customCategoryColors.has(lowerName)) {
    return customCategoryColors.get(lowerName)!;
  }

  // Generate a distinct random color
  currentHue += GOLDEN_RATIO_CONJUGATE;
  currentHue %= 1;
  const hueDegrees = Math.floor(currentHue * 360);
  
  // Use 75% saturation and 55% lightness for vibrant, visible colors
  const color = hslToHex(hueDegrees, 75, 55);
  customCategoryColors.set(lowerName, color);
  
  return color;
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
    txDate.setHours(0, 0, 0, 0);

    const normalizedFrom = fromDate ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()) : null;
    const normalizedTo = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999) : null;

    const isAfterFrom = normalizedFrom ? txDate >= normalizedFrom : true;
    const isBeforeTo = normalizedTo ? txDate <= normalizedTo : true;

    return isAfterFrom && isBeforeTo;
  });
};
