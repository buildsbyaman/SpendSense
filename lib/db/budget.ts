import { getDatabase } from '../database';

// ── Budgets ──────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  category: string;
  amount: number;
}

export async function fetchBudgets(): Promise<Budget[]> {
  const db = await getDatabase();
  return db.getAllAsync<Budget>('SELECT * FROM budgets');
}

export async function insertBudget(budget: Budget): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO budgets (id, category, amount) VALUES (?, ?, ?)',
    budget.id,
    budget.category,
    budget.amount
  );
}

export async function updateBudget(budget: Budget): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE budgets SET category = ?, amount = ? WHERE id = ?',
    budget.category,
    budget.amount,
    budget.id
  );
}

export async function deleteBudget(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM budgets WHERE id = ?', id);
}

// Update budgets for a specific category to a new category (e.g., 'Uncategorized')
export async function updateBudgetsCategory(
  oldCategory: string,
  newCategory: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE budgets SET category = ? WHERE category = ?', newCategory, oldCategory);
}
