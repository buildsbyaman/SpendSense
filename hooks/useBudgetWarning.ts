import type { Transaction } from '@/utils/transaction';
import type { Budget } from '@/lib/db/budget';

interface BudgetWarningResult {
  isOverBudget: boolean;
  totalSpent: number;
  budget: Budget | undefined;
}

export function checkBudgetWarning(
  budgets: Budget[],
  transactions: Transaction[],
  category: string,
  type: string,
  date: Date,
  parsedAmount: number,
  editId?: string
): BudgetWarningResult {
  const txDate = new Date(date);
  const txYear = txDate.getFullYear();
  const txMonth = txDate.getMonth();

  const budget = budgets.find((b) => {
    if (b.category !== category) return false;
    const bStart = b.start_date ? new Date(b.start_date + 'T00:00:00') : null;
    const bEnd = b.end_date ? new Date(b.end_date + 'T23:59:59.999') : null;
    if (bStart && txDate < bStart) return false;
    if (bEnd && txDate > bEnd) return false;
    return true;
  });

  if (type !== 'expense' || !budget) {
    return { isOverBudget: false, totalSpent: 0, budget };
  }

  const bStart = budget.start_date ? new Date(budget.start_date + 'T00:00:00') : null;
  const bEnd = budget.end_date ? new Date(budget.end_date + 'T23:59:59.999') : null;

  const currentMonthTxs = transactions.filter((t) => {
    const d = new Date(t.date);
    if (d.getFullYear() !== txYear || d.getMonth() !== txMonth) return false;
    if (bStart && d < bStart) return false;
    if (bEnd && d > bEnd) return false;
    return true;
  });

  const spent = currentMonthTxs
    .filter((t) => t.type === 'expense' && t.category === category && t.id !== editId)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = spent + parsedAmount;
  const isOverBudget = totalSpent > budget.amount;

  return { isOverBudget, totalSpent, budget };
}
