export type SubscriptionCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export const SUBSCRIPTION_CYCLES: readonly SubscriptionCycle[] = [
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
];

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: SubscriptionCycle;
  category: string;
  wallet_id: string;
  next_billing_date: string;
  is_active: number; // 0 or 1
  end_date?: string | null;
}

/**
 * Adds `months` to `date` while keeping the day-of-month anchored to `anchorDay`.
 * The day is clamped to the last day of the target month so month-end dates do
 * not permanently drift (Jan 31 -> Feb 28 -> Mar 31 -> Apr 30, not ... -> Mar 28).
 * Time-of-day is preserved.
 */
function addMonthsKeepingAnchor(date: Date, months: number, anchorDay: number): void {
  const y = date.getFullYear();
  const m = date.getMonth() + months;
  date.setFullYear(y, m, 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(anchorDay, lastDay));
}

export function getNextBillingDate(
  date: Date,
  cycle: SubscriptionCycle,
  anchorDay: number = date.getDate()
): Date {
  const next = new Date(date);
  if (cycle === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (cycle === 'monthly') {
    addMonthsKeepingAnchor(next, 1, anchorDay);
  } else if (cycle === 'quarterly') {
    addMonthsKeepingAnchor(next, 3, anchorDay);
  } else if (cycle === 'yearly') {
    addMonthsKeepingAnchor(next, 12, anchorDay);
  }
  // Unknown/invalid cycles return the input date unchanged. Callers MUST validate
  // `cycle` before looping or they risk an infinite loop.
  return next;
}
