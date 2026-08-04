import { type CustomCategory } from '@/utils/transaction';
import { getDatabase } from '../database';

// ── Custom Categories ─────────────────────────────────────────────────────────

export async function fetchCustomCategories(): Promise<CustomCategory[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CustomCategory>('SELECT * FROM custom_categories');
  return rows;
}

export async function insertCustomCategory(cat: CustomCategory): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO custom_categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
    cat.id,
    cat.name,
    cat.type,
    cat.icon || null,
    cat.color || null
  );
}

export async function deleteCustomCategory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM custom_categories WHERE id = ?', id);
}

export async function fetchDeletedDefaultCategories(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ name: string }>(
    'SELECT name FROM deleted_default_categories'
  );
  return rows.map((r) => r.name);
}

export async function insertDeletedDefaultCategory(name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO deleted_default_categories (name) VALUES (?)', name);
}

export async function fetchCategoryOrder(type: string): Promise<string[] | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ sort_order: string }>(
    'SELECT sort_order FROM category_order WHERE type = ?',
    type
  );
  if (row && row.sort_order) {
    try {
      const parsed = JSON.parse(row.sort_order);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // fall through to null
    }
  }
  return null;
}

export async function saveCategoryOrder(type: string, sortOrder: string[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO category_order (type, sort_order) VALUES (?, ?)',
    type,
    JSON.stringify(sortOrder)
  );
}

export async function fetchWalletOrder(): Promise<string[] | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ sort_order: string }>(
    "SELECT sort_order FROM wallet_order WHERE id = 'default'"
  );
  if (row && row.sort_order) {
    try {
      const parsed = JSON.parse(row.sort_order);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // fall through to null
    }
  }
  return null;
}

export async function saveWalletOrder(sortOrder: string[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT OR REPLACE INTO wallet_order (id, sort_order) VALUES ('default', ?)",
    JSON.stringify(sortOrder)
  );
}
