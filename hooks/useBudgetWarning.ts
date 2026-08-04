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
  const budget = budgets.find((b) => b.category === category);

  if (type !== 'expense' || !budget) {
    return { isOverBudget: false, totalSpent: 0, budget };
  }

  const txDate = new Date(date);
  const txYear = txDate.getFullYear();
  const txMonth = txDate.getMonth();

  const currentMonthTxs = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === txYear && d.getMonth() === txMonth;
  });

  const spent = currentMonthTxs
    .filter((t) => t.type === 'expense' && t.category === category && t.id !== editId)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = spent + parsedAmount;
  const isOverBudget = totalSpent > budget.amount;

  return { isOverBudget, totalSpent, budget };
}
