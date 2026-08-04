import { Smartphone, Landmark, CreditCard, Wallet, type LucideIcon } from 'lucide-react-native';

export interface Account {
  id: string;
  name: string;
  number: string;
  balance: string;
  icon: LucideIcon;
  isDefault?: boolean;
  type: string;
}

export const formatAccountNumber = (text: string): string => {
  const cleaned = text.replace(/[^0-9a-zA-Z]/g, '');
  const chunks = cleaned.match(/.{1,4}/g);
  return chunks ? chunks.join(' ') : cleaned;
};

export const parseBalance = (val: string): number => {
  const cleaned = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const compactAbs = (absValue: number, decimals = 2): string => {
  const compact = (divisor: number, suffix: string) => {
    const scaled = absValue / divisor;
    const rounded = parseFloat(scaled.toFixed(2));
    return `${rounded}${suffix}`;
  };
  if (absValue >= 1_000_000_000_000) return compact(1e12, 'T');
  if (absValue >= 1_000_000_000) return compact(1e9, 'B');
  if (absValue >= 1_000_000) return compact(1e6, 'M');
  return absValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Safely parses and formats a wallet balance for storage.
 * Returns a full-precision formatted string (e.g. -$50.00, $6,000,000.00).
 * No bounds clamping: balances are stored at full precision to avoid silent data loss.
 */
export const formatWalletBalance = (
  balanceInput: string | number,
  symbol: string = '$'
): string => {
  const balanceStr = typeof balanceInput === 'number' ? balanceInput.toString() : balanceInput;
  let parsedBalance: number;
  if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(balanceStr.trim())) {
    parsedBalance = parseFloat(balanceStr);
  } else {
    const cleaned = balanceStr.replace(/[^0-9.-]/g, '');
    parsedBalance = parseFloat(cleaned);
  }

  if (isNaN(parsedBalance)) {
    parsedBalance = 0;
  }

  const isNegative = parsedBalance < 0;
  const formattedNumber = Math.abs(parsedBalance).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return isNegative ? `-${symbol}${formattedNumber}` : `${symbol}${formattedNumber}`;
};

/**
 * Formats a wallet balance for compact display (e.g. $6M, -$1.25B).
 */
export const formatWalletDisplay = (value: number, symbol: string = '$'): string => {
  const isNegative = value < 0;
  return `${isNegative ? '-' : ''}${symbol}${compactAbs(Math.abs(value), 2)}`;
};

export const formatNumber = (value: number, decimals = 2): string => {
  const isNegative = value < 0;
  const formatted = compactAbs(Math.abs(value), decimals);
  return isNegative ? `-${formatted}` : formatted;
};

const WALLET_TYPE_COLORS: Record<string, string> = {
  Bank: '#3b82f6',
  Card: '#8b5cf6',
  Digital: '#10b981',
};

export const getWalletTypeColor = (type: string): string => WALLET_TYPE_COLORS[type] ?? '#64748b';

const WALLET_TYPE_ICONS: Record<string, LucideIcon> = {
  Bank: Landmark,
  Card: CreditCard,
  Digital: Smartphone,
};

/**
 * Maps a stored wallet type to its display icon. Single source of truth so a
 * Card wallet renders the same icon everywhere (adding vs. reloading).
 */
export const getWalletTypeIcon = (type: string): LucideIcon =>
  WALLET_TYPE_ICONS[type] ?? CreditCard;

/**
 * Hydrates a stored wallet row into a full Account with its display icon.
 */
export const deserializeAccount = (data: {
  id: string;
  name: string;
  number: string;
  balance: string;
  type: string;
  isDefault?: boolean;
}): Account => {
  const iconMap: Record<string, typeof Wallet> = {
    Bank: Landmark,
    Card: Wallet,
    Digital: Smartphone,
  };
  return { ...data, icon: iconMap[data.type] ?? Wallet };
};

/**
 * Sanitizes a raw balance input: keeps only digits, minus and decimal point.
 */
export const sanitizeBalanceInput = (text: string): string => text.replace(/[^0-9.-]/g, '');

/**
 * Validates wallet form fields (name required, balance required + numeric).
 */
export const validateWallet = (
  name: string,
  balanceText: string
): { name?: string; balance?: string } => {
  const errors: { name?: string; balance?: string } = {};
  if (!name.trim()) errors.name = 'Wallet name is required';
  if (!balanceText.trim()) errors.balance = 'Current balance is required';
  else {
    const parsedBalance = parseFloat(balanceText.replace(/[^0-9.-]/g, ''));
    if (!isFinite(parsedBalance)) {
      errors.balance = 'Enter a valid amount';
    }
  }
  return errors;
};
