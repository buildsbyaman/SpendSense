import { useCallback } from 'react';
import type { Budget } from '@/lib/repository';
import { newId } from '@/lib/id';
import {
  insertBudget,
  updateBudget as repoUpdateBudget,
  deleteBudget as repoDeleteBudget,
} from '@/lib/repository';
import type { AppCore } from './core';

export function useBudgetsState(core: AppCore) {
  const { budgets, setBudgets } = core;

  const addBudget = useCallback(
    (budget: Omit<Budget, 'id'>) => {
      const newBudget = { ...budget, id: newId() };
      setBudgets((prev) => [...prev, newBudget]);
      insertBudget(newBudget);
    },
    [setBudgets]
  );

  const updateBudget = useCallback(
    (updatedBudget: Budget) => {
      setBudgets((prev) => prev.map((b) => (b.id === updatedBudget.id ? updatedBudget : b)));
      repoUpdateBudget(updatedBudget);
    },
    [setBudgets]
  );

  const deleteBudget = useCallback(
    (id: string) => {
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      repoDeleteBudget(id);
    },
    [setBudgets]
  );

  return {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
  };
}
