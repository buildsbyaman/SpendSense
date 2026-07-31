import { View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import {
  ChevronDown,
  ChevronUp,
  Star,
  Landmark,
  CreditCard,
  Smartphone,
  Wallet,
} from 'lucide-react-native';
import { type Account, formatAccountNumber, parseBalance } from '@/utils/wallet';
import { useState, useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';

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
  onUpdate,
}: WalletItemProps) {
  const { colorScheme } = useColorScheme();
  const placeholderColor =
    colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;

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
        type: inferredType,
      });
    } else {
      setIsEditing(false);
    }
  }, [isExpanded, account]);

  const handleTypeChange = (type: string) => {
    const icon = TYPE_ICONS[type] ?? Wallet;
    setDraft((prev) => ({ ...prev, type, icon }));
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
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggleExpand}
      className="flex-row items-center justify-between px-5 py-5">
      <View className="mr-2 flex-1 flex-row items-center gap-4">
        <View className="relative h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900">
          <Icon as={account.icon} size={22} className="text-foreground" />
          {account.isDefault && (
            <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary dark:border-gray-900">
              <Icon as={Star} size={10} className="text-white dark:text-black" />
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
            {account.name}
          </Text>
          {!!account.number && <Text className="mt-0.5 text-sm text-muted">{account.number}</Text>}
        </View>
      </View>
      <View className="flex-row items-center gap-3">
        <Text className={`text-base font-bold ${balanceColorClass}`}>{account.balance}</Text>
        <Icon as={isExpanded ? ChevronUp : ChevronDown} size={20} className="text-muted" />
      </View>
    </TouchableOpacity>
  );

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // --- Edit form ---
  const editView = (
    <View className="mx-1 my-1 gap-5 rounded-3xl bg-surface p-5">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-foreground text-base font-semibold">Edit Wallet</Text>
      </View>

      {/* Wallet Name */}
      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Wallet Name</Text>
        <TextInput
          value={draft.name}
          onChangeText={(text) => setDraft((prev) => ({ ...prev, name: text }))}
          className={`text-foreground rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base font-semibold dark:bg-gray-900 ${focusedInput === 'name' ? 'border-primary' : 'border-transparent'}`}
          placeholder="e.g. HDFC Bank"
          placeholderTextColor={placeholderColor}
          autoFocus
          onFocus={() => setFocusedInput('name')}
          onBlur={() => setFocusedInput(null)}
        />
      </View>

      {/* Account Number */}
      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Account / Card Number</Text>
        <TextInput
          value={draft.number}
          onChangeText={(text) =>
            setDraft((prev) => ({ ...prev, number: formatAccountNumber(text) }))
          }
          className={`text-foreground rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base dark:bg-gray-900 ${focusedInput === 'number' ? 'border-primary' : 'border-transparent'}`}
          placeholder="**** **** **** 1234"
          placeholderTextColor={placeholderColor}
          maxLength={50}
          onFocus={() => setFocusedInput('number')}
          onBlur={() => setFocusedInput(null)}
        />
      </View>

      {/* Balance */}
      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Balance</Text>
        <TextInput
          value={draft.balance}
          onChangeText={(text) => {
            // Allow '-' only at the start, nowhere else
            const sanitized = text
              .replace(/(?!^)-/g, '') // remove any '-' not at position 0
              .replace(/^-{2,}/, '-'); // collapse multiple leading '-' into one
            setDraft((prev) => ({ ...prev, balance: sanitized }));
          }}
          className={`text-foreground rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base font-semibold dark:bg-gray-900 ${focusedInput === 'balance' ? 'border-primary' : 'border-transparent'}`}
          placeholder="$0.00"
          placeholderTextColor={placeholderColor}
          keyboardType="decimal-pad"
          onFocus={() => setFocusedInput('balance')}
          onBlur={() => setFocusedInput(null)}
        />
        <Text className="ml-4 mt-1.5 text-xs text-muted">
          Tip: Start with − to enter a negative balance
        </Text>
      </View>

      {/* Account Type */}
      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Account Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {ACCOUNT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => handleTypeChange(type)}
                className={`rounded-full border px-3 py-1.5 ${draft.type === type ? 'border-primary bg-primary' : 'border-gray-200 bg-transparent dark:border-gray-800'}`}>
                <Text
                  className={`text-sm font-medium ${draft.type === type ? 'text-white dark:text-black' : 'text-foreground'}`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Save / Cancel */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 items-center justify-center rounded-full bg-secondary py-3"
          onPress={handleCancel}>
          <Text className="text-foreground text-sm font-semibold">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 items-center justify-center rounded-full bg-primary py-3"
          onPress={handleSave}>
          <Text className="text-sm font-semibold text-white dark:text-black">Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="mb-4 overflow-hidden rounded-3xl border border-border bg-surface shadow-xs">
      {isEditing ? (
        editView
      ) : isExpanded ? (
        <>
          {rowView}
          <View className="flex-row gap-2.5 px-4 pb-4 pt-0">
            <TouchableOpacity
              className={`flex-1 items-center justify-center rounded-full py-3 ${account.isDefault ? 'bg-secondary opacity-50' : 'bg-primary'}`}
              disabled={account.isDefault}
              onPress={onSetDefault}>
              <Text
                className={`text-xs font-bold ${account.isDefault ? 'text-muted' : 'text-white dark:text-black'}`}>
                Set Default
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-full bg-secondary py-3"
              onPress={() => {
                setDraft(account);
                setIsEditing(true);
              }}>
              <Text className="text-foreground text-xs font-bold">Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-full bg-red-50 py-3 dark:bg-red-950/20"
              onPress={onDelete}>
              <Text className="text-xs font-bold text-red-500">Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        rowView
      )}
    </View>
  );
}
