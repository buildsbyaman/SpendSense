import { View, TouchableOpacity, TextInput, LayoutAnimation, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';

import { Text } from '@/components/ui/text';
import { useState, useEffect } from 'react';
import { formatWalletBalance, formatAccountNumber } from '@/utils/wallet';
import { useApp } from '@/context/AppContext';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import { Icon } from '@/components/ui/icon';
import { X, Trash2, Landmark, CreditCard, Smartphone, Wallet } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCOUNT_TYPES = ['Bank', 'Card', 'Digital', 'Cash'];

export default function AddWalletScreen() {
  const { colorScheme } = useColorScheme();
  const { accounts, addWallet, updateWallet, deleteWallet, setDefaultWallet, userProfile } = useApp();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  
  const placeholderColor = colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;
  
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [accountType, setAccountType] = useState('Card');
  const [errors, setErrors] = useState<{ name?: string; balance?: string }>({});

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (editId) {
      const wallet = accounts.find(a => a.id === editId);
      if (wallet) {
        setNewName(wallet.name);
        setNewNumber(wallet.number || '');
        setNewBalance(wallet.balance.replace(/[^0-9.-]/g, ''));
        setAccountType(wallet.type || 'Card');
      }
    }
  }, [editId, accounts]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/wallets');
      }
    }, 300);
  };

  const handleSave = () => {
    const newErrors: { name?: string; balance?: string } = {};
    if (!newName.trim()) newErrors.name = 'Wallet name is required';
    if (!newBalance.trim()) newErrors.balance = 'Current balance is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      return;
    }

    const formattedName = newName.trim();
    const formattedBalance = formatWalletBalance(newBalance, userProfile.currencySymbol);

    let icon = Wallet;
    if (accountType === 'Bank') icon = Landmark;
    if (accountType === 'Card') icon = CreditCard;
    if (accountType === 'Digital') icon = Smartphone;

    if (editId) {
      updateWallet({
        id: editId,
        name: formattedName,
        number: newNumber.trim(),
        balance: formattedBalance,
        icon,
        type: accountType,
        isDefault: accounts.find(a => a.id === editId)?.isDefault || false,
      });
      Toast.show({ type: 'success', text1: 'Wallet Updated', text2: 'Your wallet has been updated successfully' });
    } else {
      addWallet({
        name: formattedName,
        number: newNumber.trim(),
        balance: formattedBalance,
        icon,
        type: accountType,
      });
      Toast.show({ type: 'success', text1: 'Wallet Added', text2: 'Your new wallet has been successfully added' });
    }

    handleClose();
  };

  const handleDelete = () => {
    if (editId) {
      const result = deleteWallet(editId);
      if (!result.blocked) {
        if (result.newDefaultName) {
          Toast.show({ type: 'success', text1: 'Wallet Deleted', text2: `"${result.newDefaultName}" is now your default wallet.` });
        } else {
          Toast.show({ type: 'success', text1: 'Wallet Deleted', text2: 'Transactions have been moved to your default wallet.' });
        }
        handleClose();
      }
    }
  };

  const handleSetDefault = () => {
    if (editId) {
      setDefaultWallet(editId);
      Toast.show({ type: 'success', text1: 'Default Set', text2: 'Wallet has been set as your default.' });
      handleClose();
    }
  };

  return (
    <View className="flex-1 bg-transparent">
      <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50 dark:bg-black/70">
          
          <TouchableOpacity 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            activeOpacity={1} 
            onPress={handleClose} 
          />

          <View className="rounded-t-[32px] bg-background p-6 pb-12" style={{ maxHeight: '90%' }}>
            <View className="mb-6 flex-row items-center justify-between">
              <Text variant="h2">{editId ? 'Edit Wallet' : 'Add Wallet'}</Text>
              <View className="flex-row items-center gap-2">
                {editId && !accounts.find(a => a.id === editId)?.isDefault && (
                  <TouchableOpacity 
                    onPress={handleDelete} 
                    className="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
                    <Icon as={Trash2} size={20} className="text-red-500" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleClose} className="rounded-full bg-secondary p-2">
                  <Icon as={X} size={20} className="text-foreground" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-col gap-5">
              <View>
                <Text className="mb-2 ml-1 text-sm text-muted">Wallet Name</Text>
                <TextInput
                  className={`text-foreground rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base dark:bg-gray-900 ${errors.name ? 'border-red-500' : focusedInput === 'name' ? 'border-primary' : 'border-transparent'}`}
                  placeholder="e.g. PayPal"
                  placeholderTextColor={placeholderColor}
                  value={newName}
                  onChangeText={(text) => {
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    if (text.length > 0) {
                      setNewName(text.charAt(0).toUpperCase() + text.slice(1));
                    } else {
                      setNewName(text);
                    }
                  }}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                />
                {errors.name && <Text className="ml-4 mt-2 text-xs text-red-500">{errors.name}</Text>}
              </View>

              <View>
                <Text className="mb-2 ml-1 text-sm text-muted">Account Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  {ACCOUNT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      className={`mr-2 rounded-full border px-3 py-1.5 ${accountType === type ? 'border-primary bg-primary' : 'border-gray-200 bg-transparent dark:border-gray-800'}`}
                      onPress={() => setAccountType(type)}>
                      <Text
                        className={`text-sm font-medium ${accountType === type ? 'text-white dark:text-black' : 'text-foreground'}`}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View>
                <Text className="mb-2 ml-1 text-sm text-muted">Card / Account Number (Optional)</Text>
                <TextInput
                  className={`text-foreground rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base dark:bg-gray-900 ${focusedInput === 'number' ? 'border-primary' : 'border-transparent'}`}
                  placeholder="**** **** **** 1234"
                  placeholderTextColor={placeholderColor}
                  value={newNumber}
                  onChangeText={(text) => setNewNumber(formatAccountNumber(text))}
                  maxLength={50}
                  onFocus={() => setFocusedInput('number')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View>
                <Text className="mb-2 ml-1 text-sm text-muted">Current Balance</Text>
                <TextInput
                  className={`text-foreground rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base dark:bg-gray-900 ${errors.balance ? 'border-red-500' : focusedInput === 'balance' ? 'border-primary' : 'border-transparent'}`}
                  placeholder={`${userProfile.currencySymbol}0.00`}
                  placeholderTextColor={placeholderColor}
                  keyboardType="decimal-pad"
                  value={newBalance}
                  onChangeText={(text) => {
                    if (errors.balance) setErrors((prev) => ({ ...prev, balance: undefined }));
                    const sanitized = text.replace(/(?!^)-/g, '').replace(/^-{2,}/, '-');
                    setNewBalance(sanitized);
                  }}
                  onFocus={() => setFocusedInput('balance')}
                  onBlur={() => setFocusedInput(null)}
                />
                <Text className="ml-4 mt-1.5 text-xs text-muted">
                  Tip: Start with − to enter a negative balance
                </Text>
                {errors.balance && (
                  <Text className="ml-4 mt-1 text-xs text-red-500">{errors.balance}</Text>
                )}
              </View>
            </View>

            <View className="mt-8 flex-row gap-3">
              {editId && !accounts.find(a => a.id === editId)?.isDefault && (
                <TouchableOpacity
                  className="flex-1 items-center justify-center rounded-full bg-secondary py-3.5"
                  onPress={handleSetDefault}
                  activeOpacity={0.7}>
                  <Text className="text-foreground text-base font-medium">Set Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className={`items-center justify-center rounded-full bg-primary py-3.5 ${editId && !accounts.find(a => a.id === editId)?.isDefault ? 'flex-1' : 'flex-1'} ${!newName.trim() || !newBalance.trim() ? 'opacity-40' : 'opacity-100'}`}
                onPress={handleSave}
                activeOpacity={0.7}>
                <Text className="text-base font-medium text-white dark:text-black">Save Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
