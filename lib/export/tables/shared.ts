import { type Transaction } from '@/utils/transaction';
import { type Subscription } from '@/utils/subscription';
import { filterByMonth, filterByYear } from '@/utils/analytics';
import { type ExportSelection } from './types';

export function fmtMoney(v: number, symbol: string = '$'): string {
  const neg = v < 0;
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return neg ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function filterByPeriod(txs: Transaction[], period: ExportSelection['period']): Transaction[] {
  if (period.mode === 'all') return txs;
  if (period.mode === 'month' && period.year != null && period.month != null) {
    return filterByMonth(txs, period.year, period.month);
  }
  if (period.mode === 'year' && period.year != null) {
    return filterByYear(txs, period.year);
  }
  if (period.mode === 'custom' && (period.from || period.to)) {
    return txs.filter((tx) => {
      const d = new Date(tx.date);
      d.setHours(0, 0, 0, 0);
      let isAfter = true;
      if (period.from) {
        const from = new Date(period.from);
        from.setHours(0, 0, 0, 0);
        isAfter = d >= from;
      }
      let isBefore = true;
      if (period.to) {
        const to = new Date(period.to);
        to.setHours(23, 59, 59, 999);
        isBefore = d <= to;
      }
      return isAfter && isBefore;
    });
  }
  return txs;
}

export function filterSubsByPeriod(
  subs: Subscription[],
  period: ExportSelection['period']
): Subscription[] {
  if (period.mode === 'all') return subs;
  if (period.mode === 'month' && period.year != null && period.month != null) {
    return subs.filter((s) => {
      const d = new Date(s.next_billing_date);
      return d.getFullYear() === period.year && d.getMonth() === period.month;
    });
  }
  if (period.mode === 'year' && period.year != null) {
    return subs.filter((s) => new Date(s.next_billing_date).getFullYear() === period.year);
  }
  if (period.mode === 'custom' && (period.from || period.to)) {
    return subs.filter((s) => {
      const nextBilling = new Date(s.next_billing_date);
      nextBilling.setHours(0, 0, 0, 0);

      // Check if the subscription's next billing date falls within the period
      let nextBillingAfterFrom = true;
      if (period.from) {
        const from = new Date(period.from);
        from.setHours(0, 0, 0, 0);
        nextBillingAfterFrom = nextBilling >= from;
      }
      let nextBillingBeforeTo = true;
      if (period.to) {
        const to = new Date(period.to);
        to.setHours(23, 59, 59, 999);
        nextBillingBeforeTo = nextBilling <= to;
      }
      if (nextBillingAfterFrom && nextBillingBeforeTo) return true;

      // Also include active subscriptions that should have been charged during
      // the period (next_billing_date is after the period but would have been
      // charged earlier if the period covers a billing cycle).
      if (s.end_date) {
        const endDate = new Date(s.end_date);
        endDate.setHours(0, 0, 0, 0);
        if (period.from) {
          const from = new Date(period.from);
          from.setHours(0, 0, 0, 0);
          // Subscription was still active at the start of the period
          if (endDate >= from) return true;
        }
      }

      return false;
    });
  }
  return subs;
}
