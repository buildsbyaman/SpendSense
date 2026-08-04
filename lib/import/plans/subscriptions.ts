import { type ExportedTable } from '@/lib/export/buildExportData';
import { type Subscription } from '@/utils/subscription';
import { newId } from '@/lib/id';
import { parseDisplayAmount, parseDisplayDate, parseCycle, parseStatus } from '../parsers';
import { resolveWallet, resolveWalletDefault } from './wallets';
import { type PlanContext } from './types';

export function processSubscriptionsTable(table: ExportedTable, ctx: PlanContext): void {
  const { plan, conflict, existingSubs } = ctx;
  for (const row of table.rows) {
    const name = String(row['Name'] ?? '').trim();
    const amountStr = String(row['Amount'] ?? '0');
    const cycleStr = String(row['Cycle'] ?? 'monthly');
    const category = String(row['Category'] ?? '').trim();
    const nextBillingISO = String(row['Next Billing ISO'] ?? '');
    const nextBillingStr = String(row['Next Billing'] ?? '');
    const statusStr = String(row['Status'] ?? 'Active');
    const endDateISO = String(row['End Date ISO'] ?? '');
    const endDateStr = String(row['End Date'] ?? '');
    const walletName = String(row['Wallet'] ?? '').trim();
    if (!name) {
      plan.subscriptions.dropped++;
      continue;
    }

    const amount = parseDisplayAmount(amountStr);
    if (amount === null) {
      plan.subscriptions.dropped++;
      continue;
    }

    // Prefer ISO columns for lossless round-trip
    let next_billing_date: string | null = null;
    if (nextBillingISO && !isNaN(new Date(nextBillingISO).getTime())) {
      next_billing_date = new Date(nextBillingISO).toISOString();
    } else if (nextBillingStr) {
      next_billing_date = parseDisplayDate(nextBillingStr);
    }
    if (!next_billing_date) {
      plan.subscriptions.dropped++;
      continue;
    }

    let end_date: string | null = null;
    if (endDateISO && endDateISO !== 'null' && !isNaN(new Date(endDateISO).getTime())) {
      end_date = new Date(endDateISO).toISOString();
    } else if (endDateStr && endDateStr !== '—') {
      end_date = parseDisplayDate(endDateStr);
    }

    // Wallet: resolve by name (new Column), fallback to default
    const walletId = walletName
      ? resolveWallet(walletName, ctx.existingAccounts, plan, ctx.balanceLookup)
      : resolveWalletDefault(ctx.existingAccounts, plan, ctx.balanceLookup);
    if (!walletId) {
      plan.subscriptions.dropped++;
      continue;
    }

    const sub: Subscription = {
      id: newId(),
      name,
      amount,
      cycle: parseCycle(cycleStr),
      category,
      wallet_id: walletId,
      next_billing_date,
      is_active: parseStatus(statusStr),
      end_date,
    };

    const existing = existingSubs.find(
      (e) =>
        e.name.toLowerCase() === sub.name.toLowerCase() &&
        Math.abs(e.amount - sub.amount) < 0.01 &&
        e.cycle === sub.cycle &&
        e.wallet_id === sub.wallet_id &&
        e.next_billing_date.slice(0, 10) === sub.next_billing_date.slice(0, 10) &&
        // Status and end date are part of the identity: a cancelled
        // subscription is NOT the same record as an active one.
        e.is_active === sub.is_active &&
        (e.end_date ?? null) === (sub.end_date ?? null)
    );
    if (existing) {
      if (conflict === 'overwrite') {
        const updated = { ...sub, id: existing.id };
        plan.subscriptions.update.push(updated);
        existingSubs.splice(existingSubs.indexOf(existing), 1, updated);
      } else {
        plan.subscriptions.skip++;
      }
    } else {
      plan.subscriptions.insert.push(sub);
      existingSubs.push(sub);
    }
  }
}
