import { useEffect, useRef } from 'react';
import type { Transaction } from '@/utils/transaction';

export interface TransactionFormSetters {
  setType: (v: Transaction['type']) => void;
  setAmount: (v: string) => void;
  setTitle: (v: string) => void;
  setCategory: (v: string) => void;
  setSelectedWalletId: (v: string) => void;
  setDate: (v: Date) => void;
  setCalendarMonth: (v: Date) => void;
}

/**
 * Populates the form once the target transaction is loaded (it may arrive a
 * beat after mount), but never re-runs afterwards — otherwise a background
 * mutation would overwrite the user's in-progress edits.
 */
export function usePrefillTransactionForm(
  editId: string | undefined,
  transactions: Transaction[],
  setters: TransactionFormSetters
) {
  const populatedEditRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editId) return;
    if (populatedEditRef.current === editId) return;
    const tx = transactions.find((t) => t.id === editId);
    if (tx) {
      populatedEditRef.current = editId;
      setters.setType(tx.type);
      setters.setAmount(tx.amount.toString());
      setters.setTitle(tx.title === tx.category ? '' : tx.title);
      setters.setCategory(tx.category);
      setters.setSelectedWalletId(tx.walletId);
      setters.setDate(new Date(tx.date));
      setters.setCalendarMonth(new Date(tx.date));
    }
  }, [editId, transactions, setters]);
}
