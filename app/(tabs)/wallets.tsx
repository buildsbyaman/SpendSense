import { View, LayoutAnimation, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { useState } from 'react';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Plus, GripVertical, Check, X } from 'lucide-react-native';
import { type Account, parseBalance, formatNumber } from '@/utils/wallet';

import { WalletList } from '@/components/wallets/WalletList';
import { DeleteWalletModal } from '@/components/wallets/DeleteWalletModal';

import { useApp } from '@/context/AppContext';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { useRef, useEffect } from 'react';

export default function AccountsScreen({ isActive = true }: { isActive?: boolean }) {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const {
    accounts,
    deleteWallet,
    setDefaultWallet,
    userProfile,
    getSortedAccounts,
    updateWalletOrder,
  } = useApp();
  const listRef = useRef<any>(null);

  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'wallets') {
        listRef.current?.scrollToOffset?.({ offset: 0, animated: false });
      }
    });
  }, [addListener]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
  const [editWalletId, setEditWalletId] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftOrder, setDraftOrder] = useState<Account[]>([]);
  const [availableHeight, setAvailableHeight] = useState(0);

  const sortedAccounts = getSortedAccounts();

  // Close all open dialogs/forms when leaving this tab
  useEffect(() => {
    if (!isActive) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsMenuOpen(false);
      setExpandedWalletId(null);
      setWalletToDelete(null);
      setEditWalletId(null);
      setIsReorderMode(false);
      setDraftOrder([]);
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

  const enterReorderMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDraftOrder(sortedAccounts);
    setExpandedWalletId(null);
    setIsReorderMode(true);
  };

  const cancelReorder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsReorderMode(false);
    setDraftOrder([]);
  };

  const commitReorder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    updateWalletOrder(draftOrder.map((a) => a.id));
    setIsReorderMode(false);
    setDraftOrder([]);
    Toast.show({
      type: 'success',
      text1: 'Order Saved',
      text2: 'Your wallet order has been updated.',
    });
  };

  const resetOrder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const balanceSorted = [...accounts].sort(
      (a, b) => parseBalance(b.balance) - parseBalance(a.balance)
    );
    setDraftOrder(balanceSorted);
    updateWalletOrder([]);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseBalance(acc.balance), 0);

  const TotalBalanceHeader = () => (
    <View>
      <View className="px-6 pt-6 pb-5">
        <Text className="mb-1 text-sm font-medium text-muted">Total Balance</Text>
        <Text className="text-3xl font-bold text-foreground">
          {userProfile.currencySymbol}
          {formatNumber(totalBalance)}
        </Text>
      </View>
      <View className="h-[1px] bg-divider" />
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header
          title="Wallets"
          showBack={false}
          leftIcon={isReorderMode ? X : GripVertical}
          onLeftPress={isReorderMode ? cancelReorder : enterReorderMode}
          rightIcon={isReorderMode ? Check : Plus}
          onRightPress={isReorderMode ? commitReorder : () => router.push('/add-wallet')}
        />
      </View>

      {isReorderMode && (
        <>
          <Text className="mb-2 mt-1 text-center text-xs text-muted">
            Hold the grip or long-press to reorder
          </Text>
          <TouchableOpacity
            onPress={resetOrder}
            activeOpacity={0.7}
            className="mb-3 self-center rounded-full bg-secondary px-4 py-2 border border-border shadow-xs">
            <Text className="text-xs font-semibold text-primary">
              Reset order
            </Text>
          </TouchableOpacity>
        </>
      )}

      <View
        className="flex-1"
        style={{
          marginBottom: (insets.bottom > 0 ? insets.bottom + 8 : 20) + 76,
        }}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          if (height > 0) setAvailableHeight(height);
        }}>
        <WalletList
          listRef={listRef}
          accounts={isReorderMode ? draftOrder : sortedAccounts}
          expandedWalletId={isReorderMode ? null : expandedWalletId}
          onToggleExpand={isReorderMode ? () => {} : toggleWalletExpand}
          onSetDefault={isReorderMode ? () => {} : setAsDefault}
          onDeleteClick={isReorderMode ? () => {} : (id) => setWalletToDelete(id)}
          onAddFirstWallet={() => router.push('/add-wallet')}
          onEditClick={isReorderMode ? () => {} : handleEditClick}
          reorderMode={isReorderMode}
          onReorderEnd={setDraftOrder}
          listHeader={<TotalBalanceHeader />}
          maxHeight={availableHeight}
        />
      </View>

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
  );
}
