import { saveProfile, convertCurrencyInDB, fetchAccounts, fetchTransactions, fetchBudgets, fetchSubscriptions } from '@/lib/repository';
import { deserializeAccount } from '@/utils/wallet';
import React from 'react';

interface ProfileData {
  name: string;
  currencySymbol: string;
  currencyCode: string;
  avatar: string | null;
  hasOnboarded: boolean;
}

interface UseProfileStateProps {
  userProfile: ProfileData;
  setUserProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  setAccounts: React.Dispatch<React.SetStateAction<any[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  setBudgets: React.Dispatch<React.SetStateAction<any[]>>;
  setSubscriptions: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useProfileState({
  userProfile,
  setUserProfile,
  setAccounts,
  setTransactions,
  setBudgets,
  setSubscriptions,
}: UseProfileStateProps) {
  const updateUserProfile = async (profile: ProfileData) => {
    setUserProfile(profile);
    await saveProfile(profile);
  };

  const completeOnboarding = async (data: { name: string; avatar: string | null }) => {
    const profile = { ...userProfile, name: data.name, avatar: data.avatar, hasOnboarded: true };
    setUserProfile(profile);
    await saveProfile(profile);
  };

  const updateCurrencyAndConvert = async (
    rate: number,
    symbol: string,
    code: string,
    shouldConvert: boolean
  ) => {
    if (shouldConvert) {
      await convertCurrencyInDB(rate, symbol);
    }

    const newProfile = { ...userProfile, currencySymbol: symbol, currencyCode: code };
    await saveProfile(newProfile);
    setUserProfile(newProfile);

    if (shouldConvert) {
      const storedAccounts = (await fetchAccounts()).map(deserializeAccount);
      setAccounts(storedAccounts);
      setTransactions(await fetchTransactions());
      setBudgets(await fetchBudgets());
      setSubscriptions(await fetchSubscriptions());
    }
  };

  return { updateUserProfile, completeOnboarding, updateCurrencyAndConvert };
}
