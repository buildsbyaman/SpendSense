import { useCallback } from 'react';
import type { Transaction } from '@/utils/transaction';
import { adjustAccountBalance, computeTransactionDelta } from '@/lib/balance';
import { newId } from '@/lib/id';
import type { Account } from '@/utils/wallet';
import {
  insertTransaction,
  updateTransaction,
  updateAccount,
  deleteTransaction as repoDeleteTransaction,
} from '@/lib/repository';
import type { AppCore } from './core';

export function useTransactionsState(core: AppCore) {
  const {
    accounts,
    setAccounts,
    accountsRef,
    transactions,
    setTransactions,
    transactionsRef,
    userProfile,
  } = core;

  const addTransaction = useCallback(
    (txData: Omit<Transaction, 'id'>) => {
      const newTx: Transaction = { ...txData, id: newId() };
      setTransactions((prev) => [newTx, ...prev]);

      // Compute account update outside state updater (pure computation)
      const delta = computeTransactionDelta(txData.type, txData.amount, 'apply');
      let updatedAccount: Account | undefined;
      const currentAccounts = accountsRef.current;
      const newAccounts = currentAccounts.map((acc) => {
        if (acc.id === txData.walletId) {
          updatedAccount = adjustAccountBalance(acc, delta, userProfile.currencySymbol);
          return updatedAccount;
        }
        return acc;
      });
      setAccounts(newAccounts);

      // DB writes after state is committed (not inside updater)
      insertTransaction(newTx);
      if (updatedAccount) {
        updateAccount(updatedAccount);
      }
    },
    [accountsRef, setAccounts, setTransactions, userProfile.currencySymbol]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      const currentAccounts = accountsRef.current;
      const currentTransactions = transactionsRef.current;
      const tx = currentTransactions.find((t) => t.id === id);
      let updatedAccount: Account | undefined;
      if (tx) {
        const delta = computeTransactionDelta(tx.type, tx.amount, 'reverse');
        const newAccounts = currentAccounts.map((acc) => {
          if (acc.id === tx.walletId) {
            updatedAccount = adjustAccountBalance(acc, delta, userProfile.currencySymbol);
            return updatedAccount;
          }
          return acc;
        });
        setAccounts(newAccounts);
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      // DB write after state is committed
      repoDeleteTransaction(id);
      if (updatedAccount) {
        updateAccount(updatedAccount);
      }
    },
    [accountsRef, transactionsRef, setAccounts, setTransactions, userProfile.currencySymbol]
  );

  const updateTransactionFn = useCallback(
    (updatedTx: Transaction) => {
      const currentAccounts = accountsRef.current;
      const currentTransactions = transactionsRef.current;
      const oldTx = currentTransactions.find((t) => t.id === updatedTx.id);
      const accountUpdates = new Map<string, Account>();
      if (oldTx) {
        const newAccounts = currentAccounts.map((acc) => {
          let delta = 0;
          if (acc.id === oldTx.walletId) {
            delta += computeTransactionDelta(oldTx.type, oldTx.amount, 'reverse');
          }
          if (acc.id === updatedTx.walletId) {
            delta += computeTransactionDelta(updatedTx.type, updatedTx.amount, 'apply');
          }
          if (delta === 0) return acc;
          const updated = adjustAccountBalance(acc, delta, userProfile.currencySymbol);
          accountUpdates.set(acc.id, updated);
          return updated;
        });
        setAccounts(newAccounts);
      }
      // Re-sort by date (date may have changed)
      setTransactions((prev) =>
        [...prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );

      // DB writes after state is committed
      updateTransaction(updatedTx);
      for (const updated of accountUpdates.values()) {
        updateAccount(updated);
      }
    },
    [accountsRef, transactionsRef, setAccounts, setTransactions, userProfile.currencySymbol]
  );

  return {
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction: updateTransactionFn,
  };
}
