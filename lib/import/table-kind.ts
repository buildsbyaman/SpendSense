// ── Table-title detection ──────────────────────────────────────────────

export type TableKind =
  | 'transactions'
  | 'subscriptions'
  | 'wallets'
  | 'budgets'
  | 'categories'
  | 'balances'
  | 'profile'
  | 'categoryorder'
  | 'walletorder'
  | 'hiddencategories'
  | 'unknown';

export function detectTable(title: string, columns: string[]): TableKind {
  const t = title.toLowerCase();
  const cols = columns.map((c) => c.toLowerCase());

  if (t.includes('wallet') && t.includes('order')) return 'walletorder';

  if (
    t.includes('transaction') ||
    (cols.includes('title') &&
      cols.includes('type') &&
      cols.includes('amount') &&
      cols.includes('wallet'))
  )
    return 'transactions';

  if (t.includes('subscription') || (cols.includes('cycle') && cols.includes('next billing')))
    return 'subscriptions';

  if (t.includes('wallet') || (cols.includes('number') && cols.includes('default')))
    return 'wallets';

  if (t.includes('budget') || (cols.includes('budget') && cols.includes('category')))
    return 'budgets';

  if (t.includes('profile') || (cols.includes('field') && cols.includes('value'))) return 'profile';

  if (t.includes('order') && t.includes('categor')) return 'categoryorder';

  if (t.includes('hidden') && t.includes('categor')) return 'hiddencategories';

  if (t.includes('categor') || (cols.includes('source') && cols.includes('color')))
    return 'categories';

  if (t.includes('balance') || (cols.includes('income') && cols.includes('expense')))
    return 'balances';

  return 'unknown';
}

/** Processing order so wallets/orders are resolved before dependents. */
export const TABLE_PROCESS_ORDER: TableKind[] = [
  'wallets',
  'walletorder',
  'transactions',
  'subscriptions',
  'budgets',
  'categories',
  'categoryorder',
  'hiddencategories',
  'profile',
  'balances',
  'unknown',
];
