import { View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronDown, ChevronUp, Star, Landmark, CreditCard, Smartphone, Wallet } from 'lucide-react-native';
import { type Account, formatAccountNumber, parseBalance } from '@/utils/wallet';
import { useState, useEffect } from 'react';

const ACCOUNT_TYPES = ['Bank', 'Card', 'Digital', 'Cash'];

const TYPE_ICONS: Record<string, any> = {
  Bank: Landmark,
  Card: CreditCard,
  Digital: Smartphone,
  Cash: Wallet,
};

interface WalletItemProps {
  account: Account;
  isExpanded: boolean;
  isLast: boolean;
  onToggleExpand: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  onUpdate: (updated: Account) => void;
}

export function WalletItem({ 
  account, 
  isExpanded, 
  isLast,
  onToggleExpand, 
  onSetDefault, 
  onDelete,
  onUpdate
}: WalletItemProps) {
  
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(account);

  useEffect(() => {
    if (isExpanded) {
      let inferredType = account.type;
      if (!inferredType) {
        // Map the icon back to a type if type field is missing
        if (account.icon === Landmark) inferredType = 'Bank';
        else if (account.icon === CreditCard) inferredType = 'Card';
        else if (account.icon === Smartphone) inferredType = 'Digital';
        else inferredType = 'Cash';
      }
      setDraft({
        ...account,
        type: inferredType
      });
    } else {
      setIsEditing(false);
    }
  }, [isExpanded, account]);

  const handleTypeChange = (type: string) => {
    const icon = TYPE_ICONS[type] ?? Wallet;
    setDraft(prev => ({ ...prev, type, icon }));
  };

  const handleSave = () => {
    onUpdate(draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(account);
    setIsEditing(false);
  };


  const numericBalance = parseBalance(account.balance);
  const balanceColorClass = numericBalance >= 0 ? 'text-income' : 'text-expense';

  // --- Normal row view ---
  const rowView = (
    <View className="flex-row items-center justify-between px-5 py-5">
      <View className="flex-row items-center gap-4 flex-1 mr-2">
        <View className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-900 items-center justify-center relative">
          <Icon as={account.icon} size={22} className="text-foreground" />
          {account.isDefault && (
            <View className="absolute -top-1 -right-1 bg-primary w-5 h-5 rounded-full items-center justify-center border-2 border-white dark:border-gray-900">
              <Icon as={Star} size={10} className="text-white dark:text-black" />
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-base text-foreground font-semibold" numberOfLines={1}>{account.name}</Text>
          {!!account.number && (
            <Text className="text-muted text-sm mt-0.5">{account.number}</Text>
          )}
        </View>
      </View>
      <View className="flex-row items-center gap-3">
        <Text className={`text-base font-bold ${balanceColorClass}`}>{account.balance}</Text>
        <TouchableOpacity onPress={onToggleExpand} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Icon as={isExpanded ? ChevronUp : ChevronDown} size={20} className="text-muted" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // --- Edit form ---
  const editView = (
    <View className="bg-surface rounded-3xl p-5 mx-1 my-1 gap-5">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-foreground">Edit Wallet</Text>
      </View>

      {/* Wallet Name */}
      <View>
        <Text className="text-sm text-muted mb-2 ml-1">Wallet Name</Text>
        <TextInput
          value={draft.name}
          onChangeText={(text) => setDraft(prev => ({ ...prev, name: text }))}
          className={`bg-gray-50 dark:bg-gray-900 rounded-full px-5 py-3.5 text-foreground text-base font-semibold border-2 ${focusedInput === 'name' ? 'border-primary' : 'border-transparent'}`}
          placeholder="e.g. HDFC Bank"
          placeholderTextColor="#9ca3af"
          autoFocus
          onFocus={() => setFocusedInput('name')}
          onBlur={() => setFocusedInput(null)}
        />
      </View>

      {/* Account Number */}
      <View>
        <Text className="text-sm text-muted mb-2 ml-1">Account / Card Number</Text>
        <TextInput
          value={draft.number}
          onChangeText={(text) => setDraft(prev => ({ ...prev, number: formatAccountNumber(text) }))}
          className={`bg-gray-50 dark:bg-gray-900 rounded-full px-5 py-3.5 text-foreground text-base border-2 ${focusedInput === 'number' ? 'border-primary' : 'border-transparent'}`}
          placeholder="**** **** **** 1234"
          placeholderTextColor="#9ca3af"
          maxLength={50}
          onFocus={() => setFocusedInput('number')}
          onBlur={() => setFocusedInput(null)}
        />
      </View>

      {/* Balance */}
      <View>
        <Text className="text-sm text-muted mb-2 ml-1">Balance</Text>
        <TextInput
          value={draft.balance}
          onChangeText={(text) => {
            // Allow '-' only at the start, nowhere else
            const sanitized = text
              .replace(/(?!^)-/g, '')   // remove any '-' not at position 0
              .replace(/^-{2,}/, '-');  // collapse multiple leading '-' into one
            setDraft(prev => ({ ...prev, balance: sanitized }));
          }}
          className={`bg-gray-50 dark:bg-gray-900 rounded-full px-5 py-3.5 text-foreground text-base font-semibold border-2 ${focusedInput === 'balance' ? 'border-primary' : 'border-transparent'}`}
          placeholder="$0.00"
          placeholderTextColor="#9ca3af"
          keyboardType="decimal-pad"
          onFocus={() => setFocusedInput('balance')}
          onBlur={() => setFocusedInput(null)}
        />
        <Text className="text-xs text-muted mt-1.5 ml-4">Tip: Start with − to enter a negative balance</Text>
      </View>

      {/* Account Type */}
      <View>
        <Text className="text-sm text-muted mb-2 ml-1">Account Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {ACCOUNT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => handleTypeChange(type)}
                className={`px-3 py-1.5 rounded-full border ${draft.type === type ? 'bg-primary border-primary' : 'bg-transparent border-gray-200 dark:border-gray-800'}`}
              >
                <Text className={`text-sm font-medium ${draft.type === type ? 'text-white dark:text-black' : 'text-foreground'}`}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Save / Cancel */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 py-3 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
          onPress={handleCancel}
        >
          <Text className="font-semibold text-sm text-foreground">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 items-center justify-center rounded-full bg-primary"
          onPress={handleSave}
        >
          <Text className="font-semibold text-sm text-white dark:text-black">Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="bg-surface rounded-3xl mb-4 overflow-hidden border border-gray-100 dark:border-gray-900 shadow-xs">
      {isEditing ? (
        editView
      ) : isExpanded ? (
        <>
          {rowView}
          <View className="px-4 pb-4 pt-0 flex-row gap-2.5">
            <TouchableOpacity 
              className={`flex-1 py-3 items-center justify-center rounded-full ${account.isDefault ? 'bg-gray-100 dark:bg-gray-800 opacity-50' : 'bg-primary'}`}
              disabled={account.isDefault}
              onPress={onSetDefault}
            >
              <Text className={`font-bold text-xs ${account.isDefault ? 'text-muted' : 'text-white dark:text-black'}`}>Set Default</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
              onPress={() => { setDraft(account); setIsEditing(true); }}
            >
              <Text className="font-bold text-xs text-foreground">Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="flex-1 py-3 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/20"
              onPress={onDelete}
            >
              <Text className="text-red-500 font-bold text-xs">Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <TouchableOpacity activeOpacity={0.7} onPress={onToggleExpand}>
          {rowView}
        </TouchableOpacity>
      )}
    </View>
  );
}
