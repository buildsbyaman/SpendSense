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

/**
 * Safely parses and formats a wallet balance.
 * Ensures the balance is within safe bounds (-999,999,999 to 999,999,999).
 * Returns a formatted US currency string (e.g. -$50.00).
 */
export const formatWalletBalance = (balanceStr: string): string => {
  // Allow numbers, decimal points, and negative signs
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
  const absValue = Math.abs(parsedBalance);
  
  const formattedNumber = absValue.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  return isNegative ? `-$${formattedNumber}` : `$${formattedNumber}`;
};
