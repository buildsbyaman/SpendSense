import type { Account } from '@/utils/wallet';
import { parseBalance } from '@/utils/wallet';
import type { CustomCategory } from '@/utils/transaction';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/utils/transaction';
import type { CategoryOrder } from './state';

export type SortedCategoryItem = CustomCategory | { id: string; name: string; isDefault: true };

/** Wallet order wins when present; otherwise highest balance first. */
export function sortAccounts(accounts: Account[], walletOrder: string[]): Account[] {
  if (walletOrder && walletOrder.length > 0) {
    return [...accounts].sort((a, b) => {
      const idxA = walletOrder.indexOf(a.id);
      const idxB = walletOrder.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }
  return [...accounts].sort((a, b) => parseBalance(b.balance) - parseBalance(a.balance));
}

/**
 * Merges active defaults with custom categories, deduplicates by name, then
 * applies the saved order. Defaults come first so they win name collisions.
 */
export function selectSortedCategories(
  type: 'expense' | 'income',
  customCategories: CustomCategory[],
  deletedDefaultCategories: string[],
  categoryOrder: CategoryOrder
): SortedCategoryItem[] {
  const defaultCats = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const activeDefault = defaultCats
    .filter((c) => !deletedDefaultCategories.includes(c.name))
    .map((c) => ({ id: c.id, name: c.name, isDefault: true }) as const);

  const activeCustom = customCategories.filter(
    (c) =>
      c.type === type &&
      // Exclude custom categories that shadow an ACTIVE default name. A custom
      // whose name matches a deleted default is shown so renamed defaults
      // don't silently vanish.
      !defaultCats.some(
        (d) =>
          !deletedDefaultCategories.includes(d.name) &&
          d.name.toLowerCase() === c.name.toLowerCase()
      )
  );
  const combined: SortedCategoryItem[] = [...activeDefault, ...activeCustom];

  // Deduplicate by name (case-insensitive). Defaults come first so they win
  // over any custom entry that somehow shares the same name.
  const seen = new Set<string>();
  const deduped = combined.filter((c) => {
    const key = c.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const orderList = categoryOrder[type];
  if (!orderList || orderList.length === 0) return deduped;

  return deduped.sort((a, b) => {
    const idxA = orderList.indexOf(a.name);
    const idxB = orderList.indexOf(b.name);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });
}
