import { useCallback } from 'react';
import { newId } from '@/lib/id';
import { adjustAccountBalance, computeTransactionDelta, computeTransferDelta } from '@/lib/balance';
import { type Transaction, sortTransactionsByDate } from '@/utils/transaction';
import type { Account } from '@/utils/wallet';
import {
  insertTransaction,
  updateTransaction,
  updateAccount,
  deleteTransaction as repoDeleteTransaction,
} from '@/lib/repository';
import type { AppCore } from './core';

/**
 * Per-wallet balance deltas for a transaction. Transfers hit two wallets
 * (source -amount, destination +amount); income/expense hit one.
 */
function transactionDeltas(tx: Transaction, direction: 'apply' | 'reverse'): Map<string, number> {
  const deltas = new Map<string, number>();
  const add = (walletId: string | undefined, delta: number) => {
    if (!walletId) return;
    deltas.set(walletId, (deltas.get(walletId) ?? 0) + delta);
  };

  if (tx.type === 'transfer') {
    add(tx.walletId, computeTransferDelta('from', tx.amount, direction));
    add(tx.toWalletId, computeTransferDelta('to', tx.amount, direction));
  } else {
    add(tx.walletId, computeTransactionDelta(tx.type, tx.amount, direction));
  }
  return deltas;
}

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
    async (txData: Omit<Transaction, 'id'>) => {
      const newTx: Transaction = { ...txData, id: newId() };
      setTransactions((prev) => sortTransactionsByDate([newTx, ...prev]));

      // Compute account update outside state updater (pure computation)
      const deltas = transactionDeltas(newTx, 'apply');
      const currentAccounts = accountsRef.current;
      const updatedAccounts: Account[] = [];
      const newAccounts = currentAccounts.map((acc) => {
        const delta = deltas.get(acc.id);
        if (delta === undefined) return acc;
        const updated = adjustAccountBalance(acc, delta, userProfile.currencySymbol);
        updatedAccounts.push(updated);
        return updated;
      });
      setAccounts(newAccounts);

      // DB writes after state is committed (not inside updater)
      await insertTransaction(newTx);
      for (const updated of updatedAccounts) {
        await updateAccount(updated);
      }
    },
    [accountsRef, setAccounts, setTransactions, userProfile.currencySymbol]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const currentAccounts = accountsRef.current;
      const currentTransactions = transactionsRef.current;
      const tx = currentTransactions.find((t) => t.id === id);
      const updatedAccounts: Account[] = [];
      if (tx) {
        const deltas = transactionDeltas(tx, 'reverse');
        const newAccounts = currentAccounts.map((acc) => {
          const delta = deltas.get(acc.id);
          if (delta === undefined) return acc;
          const updated = adjustAccountBalance(acc, delta, userProfile.currencySymbol);
          updatedAccounts.push(updated);
          return updated;
        });
        setAccounts(newAccounts);
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      // DB write after state is committed
      await repoDeleteTransaction(id);
      for (const updated of updatedAccounts) {
        await updateAccount(updated);
      }
    },
    [accountsRef, transactionsRef, setAccounts, setTransactions, userProfile.currencySymbol]
  );

  const updateTransactionFn = useCallback(
    async (updatedTx: Transaction) => {
      const currentAccounts = accountsRef.current;
      const currentTransactions = transactionsRef.current;
      const oldTx = currentTransactions.find((t) => t.id === updatedTx.id);
      const updatedAccounts: Account[] = [];
      if (oldTx) {
        // Net the reversed old effect against the applied new effect so the
        // same wallet (e.g. in-place edits) settles to a single write.
        const netDeltas = new Map<string, number>();
        for (const [id, delta] of transactionDeltas(oldTx, 'reverse')) {
          netDeltas.set(id, (netDeltas.get(id) ?? 0) + delta);
        }
        for (const [id, delta] of transactionDeltas(updatedTx, 'apply')) {
          netDeltas.set(id, (netDeltas.get(id) ?? 0) + delta);
        }
        const newAccounts = currentAccounts.map((acc) => {
          const delta = netDeltas.get(acc.id);
          if (delta === undefined || delta === 0) return acc;
          const updated = adjustAccountBalance(acc, delta, userProfile.currencySymbol);
          updatedAccounts.push(updated);
          return updated;
        });
        setAccounts(newAccounts);
      }
      // Re-sort by date (date may have changed)
      setTransactions((prev) => sortTransactionsByDate(prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))));

      // DB writes after state is committed
      await updateTransaction(updatedTx);
      for (const updated of updatedAccounts) {
        await updateAccount(updated);
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
