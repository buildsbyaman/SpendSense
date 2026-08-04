import { useCallback } from 'react';
import type { Subscription } from '@/utils/subscription';
import { newId } from '@/lib/id';
import { processSubscriptionBilling } from '@/lib/billing';
import {
  insertSubscription,
  updateSubscription as repoUpdateSubscription,
  deleteSubscription as repoDeleteSubscription,
  insertTransaction,
  updateAccount,
} from '@/lib/repository';
import type { AppCore } from './core';

export function useSubscriptionsState(core: AppCore) {
  const { accounts, setAccounts, setTransactions, subscriptions, setSubscriptions, userProfile } =
    core;

  const addSubscription = useCallback(
    async (subData: Omit<Subscription, 'id'>) => {
      const newSub: Subscription = {
        ...subData,
        id: newId(),
      };

      const { txs, updatedAccount, nextDate } = processSubscriptionBilling(
        newSub,
        accounts,
        userProfile.currencySymbol
      );

      for (const tx of txs) {
        setTransactions((prev) => [tx, ...prev]);
        await insertTransaction(tx);
      }

      if (updatedAccount) {
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === updatedAccount.id ? updatedAccount : acc))
        );
        await updateAccount(updatedAccount);
      }

      if (txs.length > 0) {
        newSub.next_billing_date = nextDate;
      }

      setSubscriptions((prev) => [...prev, newSub]);
      await insertSubscription(newSub);
    },
    [accounts, setAccounts, setTransactions, setSubscriptions, userProfile.currencySymbol]
  );

  const updateSubscription = useCallback(
    async (updated: Subscription) => {
      const subToSave = { ...updated };

      const { txs, updatedAccount, nextDate } = processSubscriptionBilling(
        subToSave,
        accounts,
        userProfile.currencySymbol
      );

      for (const tx of txs) {
        setTransactions((prev) => [tx, ...prev]);
        await insertTransaction(tx);
      }

      if (updatedAccount) {
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === updatedAccount.id ? updatedAccount : acc))
        );
        await updateAccount(updatedAccount);
      }

      if (txs.length > 0) {
        subToSave.next_billing_date = nextDate;
      }

      setSubscriptions((prev) => prev.map((s) => (s.id === subToSave.id ? subToSave : s)));
      await repoUpdateSubscription(subToSave);
    },
    [accounts, setAccounts, setTransactions, setSubscriptions, userProfile.currencySymbol]
  );

  const deleteSubscription = useCallback(
    (id: string) => {
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      repoDeleteSubscription(id);
    },
    [setSubscriptions]
  );

  return {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  };
}
