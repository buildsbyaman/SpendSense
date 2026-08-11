import { useCallback } from 'react';
import type { CustomCategory } from '@/utils/transaction';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, DEFAULT_CATEGORY_NAMES } from '@/utils/transaction';
import { newId } from '@/lib/id';
import {
  insertCustomCategory,
  deleteCustomCategory as repoDeleteCustomCategory,
  reassignTransactionsCategory,
  reassignSubscriptionsCategory,
  updateBudgetsCategory,
  insertDeletedDefaultCategory,
  saveCategoryOrder,
} from '@/lib/repository';
import type { AppCore } from './core';

export function useCategoriesState(core: AppCore) {
  const {
    customCategories,
    setCustomCategories,
    deletedDefaultCategories,
    setDeletedDefaultCategories,
    categoryOrder,
    setCategoryOrder,
    setTransactions,
    setBudgets,
    setSubscriptions,
  } = core;

  const addCustomCategory = useCallback(
    (catData: Omit<CustomCategory, 'id'>) => {
      // Skip if a category with the same name already exists (case-insensitive)
      const existing = customCategories.some(
        (c) => c.name.toLowerCase() === catData.name.toLowerCase() && c.type === catData.type
      );
      if (existing) return;

      const newCategory: CustomCategory = {
        ...catData,
        id: newId(),
      };
      setCustomCategories((prev) => [...prev, newCategory]);
      insertCustomCategory(newCategory);
    },
    [customCategories, setCustomCategories]
  );

  const updateCustomCategory = useCallback(
    async (updatedCat: CustomCategory, oldName?: string) => {
      if (oldName && oldName !== updatedCat.name) {
        const wasDefault = DEFAULT_CATEGORY_NAMES.has(oldName.toLowerCase());
        await reassignTransactionsCategory(oldName, updatedCat.name);
        await reassignSubscriptionsCategory(oldName, updatedCat.name);
        await updateBudgetsCategory(oldName, updatedCat.name);
        setTransactions((prev) =>
          prev.map((t) => (t.category === oldName ? { ...t, category: updatedCat.name } : t))
        );
        setBudgets((prev) =>
          prev.map((b) => (b.category === oldName ? { ...b, category: updatedCat.name } : b))
        );
        setSubscriptions((prev) =>
          prev.map((s) => (s.category === oldName ? { ...s, category: updatedCat.name } : s))
        );

        // Keep the reorder data in sync so a renamed category keeps its place.
        if (updatedCat.type === 'expense' || updatedCat.type === 'income') {
          const orderList = categoryOrder[updatedCat.type];
          if (orderList && orderList.length > 0) {
            const nextOrder = orderList.map((n) => (n === oldName ? updatedCat.name : n));
            if (nextOrder.join('\u0000') !== orderList.join('\u0000')) {
              saveCategoryOrder(updatedCat.type, nextOrder);
              setCategoryOrder((prev) => ({ ...prev, [updatedCat.type]: nextOrder }));
            }
          }
        }

        // A rename that started from a default category retires the old default
        // so its name disappears everywhere (it becomes a custom category now).
        if (wasDefault) {
          await insertDeletedDefaultCategory(oldName);
          setDeletedDefaultCategories((prev) =>
            prev.includes(oldName) ? prev : [...prev, oldName]
          );
        }
      }
      setCustomCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
      await insertCustomCategory(updatedCat);
    },
    [
      setTransactions,
      setBudgets,
      setSubscriptions,
      setCustomCategories,
      setDeletedDefaultCategories,
      categoryOrder,
      setCategoryOrder,
    ]
  );

  const deleteCustomCategory = useCallback(
    async (id: string) => {
      // Extract data before any async work
      const category = customCategories.find((c) => c.id === id);

      // DB writes first (before state updates, to avoid UI flashing inconsistent data)
      if (category) {
        await reassignTransactionsCategory(category.name, 'Others');
        await updateBudgetsCategory(category.name, 'Others');
      }
      await repoDeleteCustomCategory(id);

      // State updates after DB is committed
      if (category) {
        setTransactions((prev) =>
          prev.map((t) => (t.category === category.name ? { ...t, category: 'Others' } : t))
        );
        setBudgets((prev) =>
          prev.map((b) => (b.category === category.name ? { ...b, category: 'Others' } : b))
        );
      }
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
    },
    [customCategories, setTransactions, setBudgets, setCustomCategories]
  );

  const deleteDefaultCategory = useCallback(
    async (name: string) => {
      await reassignTransactionsCategory(name, 'Others');
      await updateBudgetsCategory(name, 'Others');
      setTransactions((prev) =>
        prev.map((t) => (t.category === name ? { ...t, category: 'Others' } : t))
      );
      setBudgets((prev) =>
        prev.map((b) => (b.category === name ? { ...b, category: 'Others' } : b))
      );
      await insertDeletedDefaultCategory(name);
      setDeletedDefaultCategories((prev) => [...prev, name]);
    },
    [setTransactions, setBudgets, setDeletedDefaultCategories]
  );

  const updateCategoryOrder = useCallback(
    (type: 'expense' | 'income', order: string[]) => {
      setCategoryOrder((prev) => ({ ...prev, [type]: order }));
      saveCategoryOrder(type, order);
    },
    [setCategoryOrder]
  );

  const getSortedCategories = useCallback(
    (type: 'expense' | 'income') => {
      const defaultCats = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
      const activeDefault = defaultCats
        .filter((c) => !deletedDefaultCategories.includes(c.name))
        .map((c) => ({ id: c.id, name: c.name, isDefault: true }) as any);

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
      const combined = [...activeDefault, ...activeCustom];

      // Deduplicate by name (case-insensitive). Defaults come first so they
      // win over any custom entry that somehow shares the same name.
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
    },
    [customCategories, deletedDefaultCategories, categoryOrder]
  );

  return {
    customCategories,
    deletedDefaultCategories,
    categoryOrder,
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    deleteDefaultCategory,
    updateCategoryOrder,
    getSortedCategories,
  };
}
