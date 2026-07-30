import { View, ScrollView, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { useState } from 'react';
import Toast from 'react-native-toast-message';
import { Wallet, Landmark, CreditCard, Smartphone } from 'lucide-react-native';
import { type Account } from '@/utils/wallet';

import { AddWalletForm } from '@/components/wallets/AddWalletForm';
import { WalletList } from '@/components/wallets/WalletList';
import { DeleteWalletModal } from '@/components/wallets/DeleteWalletModal';
import { WalletOptionsMenu } from '@/components/wallets/WalletOptionsMenu';

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedWalletId, setExpandedWalletId] = useState<string | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);

  const toggleAdding = (show: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsAdding(show);
  };

  const toggleWalletExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedWalletId(expandedWalletId === id ? null : id);
  };

  const setAsDefault = (id: string) => {
    setAccounts(accounts.map(acc => ({
      ...acc,
      isDefault: acc.id === id
    })));
    Toast.show({ type: 'success', text1: 'Default Set', text2: 'Wallet has been set as your default.' });
    toggleWalletExpand(id);
  };

  const executeDelete = () => {
    if (walletToDelete) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setAccounts(accounts.filter(acc => acc.id !== walletToDelete));
      setWalletToDelete(null);
      Toast.show({ type: 'success', text1: 'Wallet Deleted', text2: 'Wallet has been successfully removed.' });
    }
  };

  const handleUpdateWallet = (updatedAccount: Account) => {
    setAccounts(accounts.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
  };

  const handleSaveWallet = (walletData: { name: string; number: string; balance: string; type: string }) => {
    let icon = Wallet;
    if (walletData.type === 'Bank') icon = Landmark;
    if (walletData.type === 'Card') icon = CreditCard;
    if (walletData.type === 'Digital') icon = Smartphone;

    const newAccount: Account = {
      id: Date.now().toString(),
      name: walletData.name,
      number: walletData.number,
      balance: walletData.balance,
      icon,
      isDefault: accounts.length === 0,
      type: walletData.type,
    };
    
    setAccounts([...accounts, newAccount]);
    toggleAdding(false);

    Toast.show({
      type: 'success',
      text1: 'Wallet Added',
      text2: 'Your new wallet has been added successfully',
    });
  };

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
