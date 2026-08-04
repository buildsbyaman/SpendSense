export interface SubscriptionFormValidation {
  text1: string;
  text2: string;
}

export interface SubscriptionFormInput {
  name: string;
  amount: string;
  selectedWalletId: string;
  hasEndDate: boolean;
  endDate: Date;
  nextDate: Date;
}

/**
 * Validates the add/edit subscription form. Returns the toast payload for the
 * first invalid field, or null when the form is valid.
 */
export function validateSubscriptionForm(
  input: SubscriptionFormInput
): SubscriptionFormValidation | null {
  const parsedAmount = parseFloat(input.amount);
  if (!input.name.trim()) {
    return { text1: 'Invalid Name', text2: 'Please enter a subscription name' };
  }
  if (isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) {
    return { text1: 'Invalid Amount', text2: 'Please enter a valid amount' };
  }
  if (!input.selectedWalletId) {
    return { text1: 'Wallet Required', text2: 'Please select a wallet' };
  }
  if (input.hasEndDate && input.endDate < input.nextDate) {
    return {
      text1: 'Invalid End Date',
      text2: 'End date must be after next billing date',
    };
  }
  return null;
}
