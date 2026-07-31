import { View, ScrollView, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Wallet, Landmark, CreditCard, Smartphone, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { type Account, parseBalance } from '@/utils/wallet';

import { AddWalletForm } from '@/components/wallets/AddWalletForm';
import { WalletList } from '@/components/wallets/WalletList';
import { DeleteWalletModal } from '@/components/wallets/DeleteWalletModal';
import { WalletOptionsMenu } from '@/components/wallets/WalletOptionsMenu';

import { useApp } from '@/context/AppContext';

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const { accounts, transactions, addWallet, updateWallet, deleteWallet, setDefaultWallet } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);

  // Close all open dialogs/forms when leaving this tab
  useFocusEffect(
    useCallback(() => {
      return () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsAdding(false);
        setIsMenuOpen(false);
        setExpandedWalletId(null);
        setWalletToDelete(null);
      };
    }, [])
  );

  const toggleAdding = (show: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAdding(show);
  };

  const toggleWalletExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedWalletId(expandedWalletId === id ? null : id);
  };

  const setAsDefault = (id: string) => {
    setDefaultWallet(id);
    Toast.show({ type: 'success', text1: 'Default Set', text2: 'Wallet has been set as your default.' });
    toggleWalletExpand(id);
  };

  const executeDelete = () => {
    if (walletToDelete) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      deleteWallet(walletToDelete);
      setWalletToDelete(null);
      Toast.show({ type: 'success', text1: 'Wallet Deleted', text2: 'Wallet has been successfully removed.' });
    }
  };

  const handleUpdateWallet = (updatedAccount: Account) => {
    updateWallet(updatedAccount);
  };

  const handleSaveWallet = (walletData: { name: string; number: string; balance: string; type: string }) => {
    let icon = Wallet;
    if (walletData.type === 'Bank') icon = Landmark;
    if (walletData.type === 'Card') icon = CreditCard;
    if (walletData.type === 'Digital') icon = Smartphone;

    addWallet({
      name: walletData.name,
      number: walletData.number,
      balance: walletData.balance,
      icon,
      type: walletData.type,
    });
    
    toggleAdding(false);

    Toast.show({
      type: 'success',
      text1: 'Wallet Added',
      text2: 'Your new wallet has been added successfully',
    });
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseBalance(acc.balance), 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <ScrollView 
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 120, paddingHorizontal: 20 }}
    >
      <Header 
        title="Wallets" 
        showBack={true} 
        onRightPress={() => setIsMenuOpen(true)} 
      />
      
      {accounts.length > 0 && (
        <View className="bg-surface rounded-[32px] p-6 mb-6 border border-gray-100 dark:border-gray-900 shadow-xs">
          <Text className="text-muted text-sm font-medium mb-1">Total Balance</Text>
          <Text className="text-3xl font-bold text-foreground ">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      )}

      <View className="mb-8">
        {isAdding && (
          <AddWalletForm 
            onSave={handleSaveWallet} 
            onCancel={() => toggleAdding(false)} 
          />
        )}
        
        {(!isAdding || accounts.length > 0) && (
          <WalletList 
            accounts={accounts}
            expandedWalletId={expandedWalletId}
            onToggleExpand={toggleWalletExpand}
            onSetDefault={setAsDefault}
            onDeleteClick={(id) => setWalletToDelete(id)}
            onAddFirstWallet={() => toggleAdding(true)}
            onUpdate={handleUpdateWallet}
          />
        )}

        <WalletOptionsMenu 
          visible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onAddWallet={() => toggleAdding(true)}
        />

        <DeleteWalletModal 
          visible={walletToDelete !== null}
          onCancel={() => setWalletToDelete(null)}
          onConfirm={executeDelete}
        />
      </View>
    </ScrollView>
  );
}
