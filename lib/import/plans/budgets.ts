import { type ExportedTable } from '@/lib/export/buildExportData';
import { type Budget } from '@/lib/repository';
import { newId } from '@/lib/id';
import { parseDisplayAmount } from '../parsers';
import { type PlanContext } from './types';

export function processBudgetsTable(table: ExportedTable, ctx: PlanContext): void {
  const { plan, conflict, existingBudgets } = ctx;
  for (const row of table.rows) {
    const category = String(row['Category'] ?? '').trim();
    const budgetStr = String(row['Budget'] ?? '0');
    if (!category) {
      plan.budgets.dropped++;
      continue;
    }

    const amount = parseDisplayAmount(budgetStr);
    if (amount === null) {
      plan.budgets.dropped++;
      continue;
    }
    const budget: Budget = { id: newId(), category, amount };

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
