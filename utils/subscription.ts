export type SubscriptionCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

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

export function getNextBillingDate(date: Date, cycle: SubscriptionCycle): Date {
  const next = new Date(date);
  if (cycle === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (cycle === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else if (cycle === 'quarterly') {
    next.setMonth(next.getMonth() + 3);
  } else if (cycle === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}
