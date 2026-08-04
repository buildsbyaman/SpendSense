import { useEffect, useRef } from 'react';
import type { Subscription } from '@/utils/subscription';

export interface SubscriptionFormSetters {
  setName: (v: string) => void;
  setAmount: (v: string) => void;
  setCycle: (v: Subscription['cycle']) => void;
  setCategory: (v: string) => void;
  setSelectedWalletId: (v: string) => void;
  setNextDate: (v: Date) => void;
  setCalendarMonth: (v: Date) => void;
  setIsActive: (v: boolean) => void;
  setHasEndDate: (v: boolean) => void;
  setEndDate: (v: Date) => void;
  setEndCalendarMonth: (v: Date) => void;
}

/**
 * Populates the form once the target subscription is loaded (it may arrive a
 * beat after mount), but never re-runs afterwards — otherwise a background
 * mutation would overwrite the user's in-progress edits.
 */
export function usePrefillSubscriptionForm(
  editId: string | undefined,
  subscriptions: Subscription[],
  setters: SubscriptionFormSetters
) {
  const populatedEditRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editId) return;
    if (populatedEditRef.current === editId) return;
    const sub = subscriptions.find((s) => s.id === editId);
    if (sub) {
      populatedEditRef.current = editId;
      setters.setName(sub.name);
      setters.setAmount(sub.amount.toString());
      setters.setCycle(sub.cycle);
      setters.setCategory(sub.category);
      setters.setSelectedWalletId(sub.wallet_id);
      setters.setNextDate(new Date(sub.next_billing_date));
      setters.setCalendarMonth(new Date(sub.next_billing_date));
      setters.setIsActive(sub.is_active === 1);
      if (sub.end_date) {
        setters.setHasEndDate(true);
        setters.setEndDate(new Date(sub.end_date));
        setters.setEndCalendarMonth(new Date(sub.end_date));
      } else {
        setters.setHasEndDate(false);
      }
    }
  }, [editId, subscriptions, setters]);
}
