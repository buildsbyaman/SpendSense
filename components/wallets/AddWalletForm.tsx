import { View, TouchableOpacity, TextInput, LayoutAnimation, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { useState } from 'react';
import { formatWalletBalance, formatAccountNumber } from '@/utils/wallet';

const ACCOUNT_TYPES = ['Bank', 'Card', 'Digital', 'Cash'];

interface AddWalletFormProps {
  onSave: (wallet: { name: string; number: string; balance: string; type: string }) => void;
  onCancel: () => void;
}

export function AddWalletForm({ onSave, onCancel }: AddWalletFormProps) {
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [accountType, setAccountType] = useState('Card');
  const [errors, setErrors] = useState<{name?: string, balance?: string}>({});

  const handleSave = () => {
    const newErrors: {name?: string, balance?: string} = {};
    if (!newName.trim()) newErrors.name = 'Wallet name is required';
    if (!newBalance.trim()) newErrors.balance = 'Current balance is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      return;
    }
    
    const formattedName = newName.trim();
    const formattedBalance = formatWalletBalance(newBalance);
    
    onSave({
      name: formattedName,
      number: newNumber.trim(),
      balance: formattedBalance,
      type: accountType
    });

    // Reset local state
    setNewName('');
    setNewNumber('');
    setNewBalance('');
    setAccountType('Card');
    setErrors({});
  };

  return (
    <View className="bg-surface rounded-3xl p-6 mb-6">            
      <View className="flex-col gap-5">
        <View>
          <Text className="text-sm text-muted mb-2 ml-1">Wallet Name</Text>
          <TextInput
            className={`bg-gray-50 dark:bg-gray-900 rounded-full px-5 py-3.5 text-foreground text-base border-2 ${errors.name ? 'border-red-500' : (focusedInput === 'name' ? 'border-primary' : 'border-transparent')}`}
            placeholder="e.g. PayPal"
            placeholderTextColor="#9ca3af"
            value={newName}
            onChangeText={(text) => {
              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              if (text.length > 0) {
                setNewName(text.charAt(0).toUpperCase() + text.slice(1));
              } else {
                setNewName(text);
              }
            }}
            onFocus={() => setFocusedInput('name')}
            onBlur={() => setFocusedInput(null)}
          />
          {errors.name && (
            <Text className="text-xs text-red-500 mt-2 ml-4">{errors.name}</Text>
          )}
        </View>

         <View>
          <Text className="text-sm text-muted mb-2 ml-1">Account Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {ACCOUNT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                className={`px-3 py-1.5 rounded-full mr-2 border ${accountType === type ? 'bg-primary border-primary' : 'bg-transparent border-gray-200 dark:border-gray-800'}`}
                onPress={() => setAccountType(type)}
              >
                <Text className={`text-sm font-medium ${accountType === type ? 'text-white dark:text-black' : 'text-foreground'}`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View>
          <Text className="text-sm text-muted mb-2 ml-1">Card / Account Number (Optional)</Text>
          <TextInput
            className={`bg-gray-50 dark:bg-gray-900 rounded-full px-5 py-3.5 text-foreground text-base border-2 ${focusedInput === 'number' ? 'border-primary' : 'border-transparent'}`}
            placeholder="**** **** **** 1234"
            placeholderTextColor="#9ca3af"
            value={newNumber}
            onChangeText={(text) => setNewNumber(formatAccountNumber(text))}
            maxLength={50}
            onFocus={() => setFocusedInput('number')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>

        <View>
          <Text className="text-sm text-muted mb-2 ml-1">Current Balance</Text>
          <TextInput
            className={`bg-gray-50 dark:bg-gray-900 rounded-full px-5 py-3.5 text-foreground text-base border-2 ${errors.balance ? 'border-red-500' : (focusedInput === 'balance' ? 'border-primary' : 'border-transparent')}`}
            placeholder="$0.00"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
            value={newBalance}
            onChangeText={(text) => {
              if (errors.balance) setErrors(prev => ({ ...prev, balance: undefined }));
              setNewBalance(text);
            }}
            onFocus={() => setFocusedInput('balance')}
            onBlur={() => setFocusedInput(null)}
          />
          {errors.balance && (
            <Text className="text-xs text-red-500 mt-2 ml-4">{errors.balance}</Text>
          )}
        </View>
      </View>

      <View className="flex-row mt-8 gap-3">
        <TouchableOpacity 
          className="flex-1 py-3.5 items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full"
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Text className="text-foreground text-base font-medium">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3.5 items-center justify-center bg-black dark:bg-white rounded-full ${(!newName.trim() || !newBalance.trim()) ? 'opacity-40' : 'opacity-100'}`}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text className="text-white dark:text-black text-base font-medium">Save Wallet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
