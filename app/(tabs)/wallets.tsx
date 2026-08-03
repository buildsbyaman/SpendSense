import { View, ScrollView, LayoutAnimation, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Wallet, Landmark, CreditCard, Smartphone, Plus } from 'lucide-react-native';
import { type Account, parseBalance, formatNumber } from '@/utils/wallet';

import { WalletList } from '@/components/wallets/WalletList';
import { DeleteWalletModal } from '@/components/wallets/DeleteWalletModal';

import { useApp } from '@/context/AppContext';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { useRef, useEffect } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AccountsScreen({ isActive = true }: { isActive?: boolean }) {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const {
    accounts,
    transactions,
    addWallet,
    updateWallet,
    deleteWallet,
    setDefaultWallet,
    userProfile,
  } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'wallets') {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    });
  }, [addListener]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
  const [editWalletId, setEditWalletId] = useState<string | null>(null);

  // Close all open dialogs/forms when leaving this tab
  useEffect(() => {
    if (!isActive) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsMenuOpen(false);
      setExpandedWalletId(null);
      setWalletToDelete(null);
      setEditWalletId(null);
    }
  }, [isActive]);

  const toggleWalletExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedWalletId(expandedWalletId === id ? null : id);
  };

  const setAsDefault = (id: string) => {
    setDefaultWallet(id);
    Toast.show({
      type: 'success',
      text1: 'Default Set',
      text2: 'Wallet has been set as your default.',
    });
    toggleWalletExpand(id);
  };

  const executeDelete = async () => {
    if (walletToDelete) {
      const result = await deleteWallet(walletToDelete);
      setWalletToDelete(null);
      setExpandedWalletId(null); // collapse accordion after delete
      if (result.blocked) return;
      if (result.newDefaultName) {
        Toast.show({
          type: 'success',
          text1: 'Wallet Deleted',
          text2: `"${result.newDefaultName}" is now your default wallet.`,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Wallet Deleted',
          text2: 'Transactions have been moved to your default wallet.',
        });
      }
    }
  };

  const handleEditClick = (id: string) => {
    router.push(`/add-wallet?editId=${id}`);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseBalance(acc.balance), 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header
          title="Wallets"
          showBack={false}
          rightIcon={Plus}
          onRightPress={() => router.push('/add-wallet')}
        />
      </View>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}>
        {accounts.length > 0 && (
          <View className="mb-6 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
            <Text className="mb-1 text-sm font-medium text-muted">Total Balance</Text>
            <Text className="text-3xl font-bold text-foreground">
              {userProfile.currencySymbol}
              {formatNumber(totalBalance)}
            </Text>
          </View>
        )}

        <View className="mb-8">
          {accounts.length > 0 ? (
            <WalletList
              accounts={accounts}
              expandedWalletId={expandedWalletId}
              onToggleExpand={toggleWalletExpand}
              onSetDefault={setAsDefault}
              onDeleteClick={(id) => setWalletToDelete(id)}
              onAddFirstWallet={() => router.push('/add-wallet')}
              onEditClick={handleEditClick}
            />
          ) : (
            <EmptyState
              icon={Wallet}
              title="No Wallets Yet"
              description="Add your first wallet or bank account to start tracking your balances and transactions."
              buttonText="Add Wallet"
              onButtonPress={() => router.push('/add-wallet')}
            />
          )}

          <DeleteWalletModal
            visible={walletToDelete !== null}
            walletId={walletToDelete}
            onCancel={() => {
              setWalletToDelete(null);
              setExpandedWalletId(null); // collapse accordion on cancel
            }}
            onConfirm={executeDelete}
          />
        </View>
      </ScrollView>
    </View>
  );
}
