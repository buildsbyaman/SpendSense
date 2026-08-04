import { type ExportedTable } from '@/lib/export/buildExportData';
import { type Transaction, type TransactionType } from '@/utils/transaction';
import { newId } from '@/lib/id';
import { parseDisplayAmount, parseDisplayDate } from '../parsers';
import { resolveWallet } from './wallets';
import { type PlanContext } from './types';

export function processTransactionsTable(table: ExportedTable, ctx: PlanContext): void {
  const { plan, conflict, existingTxsMap } = ctx;
  for (const row of table.rows) {
    const title = String(row['Title'] ?? '').trim();
    const category = String(row['Category'] ?? '').trim();
    const typeStr = String(row['Type'] ?? '')
      .trim()
      .toLowerCase();
    const amountStr = String(row['Amount'] ?? '0');
    const dateStr = String(row['Date'] ?? '');
    const dateISO = String(row['Date ISO'] ?? '').trim();
    const walletName = String(row['Wallet'] ?? '').trim();
    if (!title || !typeStr || (typeStr !== 'income' && typeStr !== 'expense')) {
      plan.transactions.dropped++;
      continue;
    }

    const amount = parseDisplayAmount(amountStr);
    if (amount === null) {
      plan.transactions.dropped++;
      continue;
    }
    // Prefer raw ISO date if present, fall back to parsed display date.
    // Any valid ISO date is accepted (including pre-2000 records).
    const parsedISO = typeof row['Date ISO'] === 'string' ? dateISO : '';
    const dateISOValid = parsedISO && !isNaN(new Date(parsedISO).getTime());
    const date = dateISOValid ? parsedISO : parseDisplayDate(dateStr);
    if (!date) {
      plan.transactions.dropped++;
      continue;
    }

    const walletId = resolveWallet(walletName, ctx.existingAccounts, plan, ctx.balanceLookup);
    if (!walletId) {
      plan.transactions.dropped++;
      continue;
    }

    const tx: Transaction = {
      id: newId(),
      title,
      amount,
      type: typeStr as TransactionType,
      category,
      date,
      walletId,
    };

    const key = `${tx.title}|${tx.category}|${tx.date.slice(0, 10)}|${tx.walletId}`;
    const bucket = existingTxsMap.get(key) ?? [];
    const existing = bucket.find((e) => Math.abs(e.amount - tx.amount) < 0.01);
    if (existing) {
      if (conflict === 'overwrite') {
        const updated = { ...tx, id: existing.id };
        plan.transactions.update.push(updated);
        bucket.splice(bucket.indexOf(existing), 1, updated);
      } else {
        plan.transactions.skip++;
      }
    } else {
      plan.transactions.insert.push(tx);
      bucket.push(tx);
    }
    existingTxsMap.set(key, bucket);
  }
}
