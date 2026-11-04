import { type ExportedTable } from '@/lib/export/buildExportData';
import { type Budget } from '@/lib/repository';
import { newId } from '@/lib/id';
import { parseDisplayAmount, parseDisplayDate } from '../parsers';
import { type PlanContext } from './types';

function parseBudgetDate(val: unknown): string | null {
  if (val == null) return null;
  const str = String(val).trim();
  if (!str || str === '—' || str === 'Infinity' || str === 'null' || str === 'undefined') return null;

  // If already YYYY-MM-DD or ISO string:
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str.includes('T') ? str : `${str}T00:00:00`);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }

  // Try parseDisplayDate (e.g. "Nov 1, 2026"):
  const parsed = parseDisplayDate(str);
  if (parsed) {
    const d = new Date(parsed);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return null;
}

export function processBudgetsTable(table: ExportedTable, ctx: PlanContext): void {
  const { plan, conflict, existingBudgets } = ctx;
  for (const row of table.rows) {
    const category = String(row['Category'] ?? row['category'] ?? '').trim();
    const budgetStr = String(row['Budget'] ?? row['amount'] ?? '0');
    if (!category) {
      plan.budgets.dropped++;
      continue;
    }

    const amount = parseDisplayAmount(budgetStr);
    if (amount === null) {
      plan.budgets.dropped++;
      continue;
    }

    const startDate = parseBudgetDate(
      row['Start Date ISO'] ?? row['Start Date'] ?? row['start_date'] ?? row['startDate']
    );
    const endDate = parseBudgetDate(
      row['End Date ISO'] ?? row['End Date'] ?? row['end_date'] ?? row['endDate']
    );

    const budget: Budget = {
      id: newId(),
      category,
      amount,
      start_date: startDate,
      end_date: endDate,
    };

    const existing = existingBudgets.find(
      (e) => e.category.toLowerCase() === budget.category.toLowerCase()
    );
    if (existing) {
      if (conflict === 'overwrite') {
        const updated = { ...budget, id: existing.id };
        plan.budgets.update.push(updated);
        existingBudgets.splice(existingBudgets.indexOf(existing), 1, updated);
      } else {
        plan.budgets.skip++;
      }
    } else {
      plan.budgets.insert.push(budget);
      existingBudgets.push(budget);
    }
  }
}
