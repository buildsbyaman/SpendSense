import { getDatabase } from '../database';

// ── Budgets ──────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  category: string;
  amount: number;
  start_date?: string | null;
  end_date?: string | null;
}

export async function fetchBudgets(): Promise<Budget[]> {
  const db = await getDatabase();
  return db.getAllAsync<Budget>('SELECT * FROM budgets');
}

export async function insertBudget(budget: Budget): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO budgets (id, category, amount, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
    budget.id,
    budget.category,
    budget.amount,
    budget.start_date ?? null,
    budget.end_date ?? null
  );
}

export async function updateBudget(budget: Budget): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE budgets SET category = ?, amount = ?, start_date = ?, end_date = ? WHERE id = ?',
    budget.category,
    budget.amount,
    budget.start_date ?? null,
    budget.end_date ?? null,
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
