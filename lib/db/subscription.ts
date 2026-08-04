import { type Subscription } from '@/utils/subscription';
import { getDatabase } from '../database';

// ── Subscriptions ────────────────────────────────────────────────────────
export async function fetchSubscriptions(): Promise<Subscription[]> {
  const db = await getDatabase();
  return db.getAllAsync<Subscription>('SELECT * FROM subscriptions');
}

export async function insertSubscription(sub: Subscription): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO subscriptions (id, name, amount, cycle, category, wallet_id, next_billing_date, is_active, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    sub.id,
    sub.name,
    sub.amount,
    sub.cycle,
    sub.category,
    sub.wallet_id,
    sub.next_billing_date,
    sub.is_active,
    sub.end_date || null
  );
}

export async function updateSubscription(sub: Subscription): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE subscriptions SET name = ?, amount = ?, cycle = ?, category = ?, wallet_id = ?, next_billing_date = ?, is_active = ?, end_date = ? WHERE id = ?',
    sub.name,
    sub.amount,
    sub.cycle,
    sub.category,
    sub.wallet_id,
    sub.next_billing_date,
    sub.is_active,
    sub.end_date || null,
    sub.id
  );
}

export async function deleteSubscription(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM subscriptions WHERE id = ?', id);
}
