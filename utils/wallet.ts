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

/**
 * Safely parses and formats a wallet balance.
 * Ensures the balance is within safe bounds (-999,999,999 to 999,999,999).
 * Returns a formatted US currency string (e.g. -$50.00).
 */
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

export const formatWalletBalance = (balanceInput: string | number, symbol: string = '$'): string => {
  const balanceStr = typeof balanceInput === 'number' ? balanceInput.toString() : balanceInput;
  const cleaned = balanceStr.replace(/[^0-9.-]/g, '');
  let parsedBalance = parseFloat(cleaned);

  if (isNaN(parsedBalance)) {
    parsedBalance = 0;
  } else if (parsedBalance > 999999999) {
    parsedBalance = 999999999;
  } else if (parsedBalance < -999999999) {
    parsedBalance = -999999999;
  }

  const isNegative = parsedBalance < 0;
  const formattedNumber = compactAbs(Math.abs(parsedBalance), 2);

  return isNegative ? `-${symbol}${formattedNumber}` : `${symbol}${formattedNumber}`;
};

export const formatNumber = (value: number, decimals = 2): string => {
  const isNegative = value < 0;
  const formatted = compactAbs(Math.abs(value), decimals);
  return isNegative ? `-${formatted}` : formatted;
};
