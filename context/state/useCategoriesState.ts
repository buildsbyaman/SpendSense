import { useCallback } from 'react';
import type { CustomCategory } from '@/utils/transaction';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/utils/transaction';
import { newId } from '@/lib/id';
import {
  insertCustomCategory,
  deleteCustomCategory as repoDeleteCustomCategory,
  reassignTransactionsCategory,
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
        await reassignTransactionsCategory(oldName, updatedCat.name);
        await updateBudgetsCategory(oldName, updatedCat.name);
        setTransactions((prev) =>
          prev.map((t) => (t.category === oldName ? { ...t, category: updatedCat.name } : t))
        );
        setBudgets((prev) =>
          prev.map((b) => (b.category === oldName ? { ...b, category: updatedCat.name } : b))
        );
      }
      setCustomCategories((prev) =>
        prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
      );
      await insertCustomCategory(updatedCat);
    },
    [setTransactions, setBudgets, setCustomCategories]
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
      setBudgets((prev) => prev.map((b) => (b.category === name ? { ...b, category: 'Others' } : b)));
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
        .map((c) => ({ name: c.name, isDefault: true }) as any);

      const activeCustom = customCategories.filter(
        (c) =>
          c.type === type &&
          // Exclude custom categories that shadow a default name
          !defaultCats.some((d) => d.name.toLowerCase() === c.name.toLowerCase())
      );
      const combined = [...activeDefault, ...activeCustom];

      const orderList = categoryOrder[type];
      if (!orderList || orderList.length === 0) return combined;

      return combined.sort((a, b) => {
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
