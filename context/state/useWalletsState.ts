import { useCallback } from 'react';
import type { Account } from '@/utils/wallet';
import { parseBalance } from '@/utils/wallet';
import { adjustAccountBalance } from '@/lib/balance';
import { newId } from '@/lib/id';
import { getDatabase } from '@/lib/database';
import {
  insertAccount,
  updateAccount,
  deleteAccount,
  setDefaultWallet as repoSetDefaultWallet,
  reassignTransactionsWallet,
  reassignSubscriptionsWallet,
  saveWalletOrder,
} from '@/lib/repository';
import type { AppCore } from './core';

export function useWalletsState(core: AppCore) {
  const {
    accounts,
    setAccounts,
    accountsRef,
    walletOrder,
    setWalletOrder,
    setTransactions,
    setSubscriptions,
    userProfile,
  } = core;

  const updateWalletOrder = useCallback(
    (order: string[]) => {
      setWalletOrder(order);
      saveWalletOrder(order);
    },
    [setWalletOrder]
  );

  const getSortedAccounts = useCallback(() => {
    const orderList = walletOrder;
    if (orderList && orderList.length > 0) {
      return [...accounts].sort((a, b) => {
        const idxA = orderList.indexOf(a.id);
        const idxB = orderList.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    }
    return [...accounts].sort((a, b) => parseBalance(b.balance) - parseBalance(a.balance));
  }, [accounts, walletOrder]);

  const addWallet = useCallback(
    (walletData: Omit<Account, 'id' | 'isDefault'>) => {
      const isFirst = accountsRef.current.length === 0;
      const newWallet: Account = {
        ...walletData,
        id: newId(),
        isDefault: isFirst,
      };
      setAccounts((prev) => [...prev, newWallet]);
      insertAccount(newWallet);
    },
    [accountsRef, setAccounts]
  );

  const updateWallet = useCallback(
    (updated: Account) => {
      setAccounts((prev) => prev.map((acc) => (acc.id === updated.id ? updated : acc)));
      updateAccount(updated);
    },
    [setAccounts]
  );

  const deleteWallet = useCallback(
    async (id: string): Promise<{ blocked: boolean; newDefaultName?: string }> => {
      const current = accountsRef.current;
      const wallet = current.find((a) => a.id === id);
      if (!wallet) return { blocked: false };

      if (current.length === 1) {
        return { blocked: true };
      }

      const others = current.filter((a) => a.id !== id);
      const isDefault = wallet.isDefault;
      const targetWallet = others.find((a) => a.isDefault) ?? others[0];

      // Reassign transactions + subscriptions in state and DB
      setTransactions((prev) =>
        prev.map((tx) => (tx.walletId === id ? { ...tx, walletId: targetWallet.id } : tx))
      );
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.wallet_id === id ? { ...sub, wallet_id: targetWallet.id } : sub
        )
      );
      await reassignTransactionsWallet(id, targetWallet.id);
      await reassignSubscriptionsWallet(id, targetWallet.id);

      // Compute new accounts state (pure — no side effects)
      // walletBalance already includes net flow of its transactions, so use it directly
      const walletBalance = parseBalance(wallet.balance);

      let updatedTarget: Account | undefined;
      const newAccounts = current
        .filter((a) => a.id !== id)
        .map((a) => {
          if (a.id === targetWallet.id) {
            updatedTarget = adjustAccountBalance(a, walletBalance, userProfile.currencySymbol);
            return updatedTarget;
          }
          return a;
        });

      // If target not found in filtered (shouldn't happen), just filter
      if (!updatedTarget && newAccounts.length > 0 && isDefault) {
        newAccounts[0] = { ...newAccounts[0], isDefault: true };
      } else if (isDefault && updatedTarget && !updatedTarget.isDefault) {
        updatedTarget.isDefault = true;
      }

      setAccounts(newAccounts);

      // DB side effects in a transaction for atomicity
      const db = await getDatabase();
      await db.withTransactionAsync(async () => {
        if (updatedTarget) {
          await updateAccount(updatedTarget);
        } else if (isDefault && newAccounts.length > 0) {
          await updateAccount(newAccounts[0]);
        }
        await deleteAccount(id);
      });

      setWalletOrder((prev) => {
        const filtered = prev.filter((wid) => wid !== id);
        saveWalletOrder(filtered);
        return filtered;
      });

      return { blocked: false, newDefaultName: isDefault ? targetWallet.name : undefined };
    },
    [accountsRef, setAccounts, setTransactions, setSubscriptions, setWalletOrder, userProfile.currencySymbol]
  );

  const setDefaultWallet = useCallback(
    (id: string) => {
      setAccounts((prev) => prev.map((acc) => ({ ...acc, isDefault: acc.id === id })));
      repoSetDefaultWallet(id);
    },
    [setAccounts]
  );

  return {
    accounts,
    walletOrder,
    getSortedAccounts,
    updateWalletOrder,
    addWallet,
    updateWallet,
    deleteWallet,
    setDefaultWallet,
  };
}
