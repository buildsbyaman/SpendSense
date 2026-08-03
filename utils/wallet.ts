import { Smartphone, Landmark, CreditCard, type LucideIcon } from 'lucide-react-native';

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
  return absValue.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

/**
 * Safely parses and formats a wallet balance for storage.
 * Ensures the balance is within safe bounds (-999,999,999 to 999,999,999).
 * Returns a full-precision formatted string (e.g. -$50.00, $6,000,000.00).
 */
export const formatWalletBalance = (balanceInput: string | number, symbol: string = '$'): string => {
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
  } else if (parsedBalance > 999999999) {
    parsedBalance = 999999999;
  } else if (parsedBalance < -999999999) {
    parsedBalance = -999999999;
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
