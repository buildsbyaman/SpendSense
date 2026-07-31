import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronDown, ChevronUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import {
  type Transaction,
  type TransactionType,
  getCategoryIcon,
  getCategoryColor,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  sanitizeAmountInput,
} from '@/utils/transaction';
import { type Account } from '@/utils/wallet';
import TransactionTypeToggle from './TransactionTypeToggle';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';

interface TransactionItemProps {
  transaction: Transaction;
  isExpanded: boolean;
  isLast: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onUpdate: (updated: Transaction) => void;
  accounts: Account[];
  getWalletName: (walletId: string) => string;
}

export function TransactionItem({
  transaction,
  isExpanded,
  isLast,
  onToggleExpand,
  onDelete,
  onUpdate,
  accounts,
  getWalletName,
}: TransactionItemProps) {
  const { colorScheme } = useColorScheme();
  const placeholderColor =
    colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Transaction>(transaction);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded) {
      setDraft({
        ...transaction,
        title: transaction.title === transaction.category ? '' : transaction.title,
      });
    } else {
      setIsEditing(false);
    }
  }, [isExpanded, transaction]);

  const handleTypeChange = (newType: TransactionType) => {
    setDraft((prev) => ({
      ...prev,
      type: newType,
      category: newType === 'expense' ? 'Food' : 'Salary',
      title: prev.title === (prev.type === 'expense' ? 'Food' : 'Salary') ? '' : prev.title,
    }));
  };

  const handleSave = () => {
    const parsedAmount = parseFloat(draft.amount.toString());
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid amount',
      });
      return;
    }

    if (!draft.walletId) {
      Toast.show({
        type: 'error',
        text1: 'Wallet Required',
        text2: 'Please associate a wallet with this transaction',
      });
      return;
    }

    onUpdate({
      ...draft,
      title: draft.title.trim() || draft.category,
      amount: parsedAmount,
    });
    setIsEditing(false);
    onToggleExpand();
  };

  const handleCancel = () => {
    setDraft(transaction);
    setIsEditing(false);
    onToggleExpand();
  };

  const icon = getCategoryIcon(transaction.category);
  const color = getCategoryColor(transaction.category);
  const categoriesList = draft.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // --- Normal row view ---
  const rowView = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggleExpand}
      className="flex-row items-center justify-between py-3.5">
      <View className="mr-2 flex-1 flex-row items-center gap-3.5">
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}15` }}>
          <Icon as={icon} size={18} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
            {transaction.title}
          </Text>
          <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
            {getWalletName(transaction.walletId)} • {transaction.category}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <Text
          className={`text-base font-bold ${transaction.type === 'income' ? 'text-income' : 'text-expense'}`}>
          {transaction.type === 'income' ? '+' : '-'}$
          {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        <Icon as={isExpanded ? ChevronUp : ChevronDown} size={18} className="text-muted" />
      </View>
    </TouchableOpacity>
  );

  // --- Edit form ---
  const editView = (
    <View className="gap-5 p-2">
      <Text className="text-foreground text-base font-semibold">Edit Transaction</Text>

      {/* Income / Expense Toggle */}
      <TransactionTypeToggle type={draft.type} onChange={handleTypeChange} />

      {/* Amount */}
      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Amount</Text>
        <View className="relative justify-center">
          <Text className="text-foreground absolute left-5 z-10 text-base font-semibold">$</Text>
          <TextInput
            value={draft.amount.toString()}
            onChangeText={(text) =>
              setDraft((prev) => ({ ...prev, amount: parseFloat(sanitizeAmountInput(text)) || 0 }))
            }
            className={`text-foreground rounded-full border-2 bg-gray-50 py-3.5 pl-10 pr-5 text-base font-semibold dark:bg-gray-900 ${focusedInput === 'amount' ? 'border-primary' : 'border-transparent'}`}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor={placeholderColor}
            onFocus={() => setFocusedInput('amount')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
      </View>

      {/* Title */}
      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Description / Title</Text>
        <TextInput
          value={draft.title}
          onChangeText={(text) => setDraft((prev) => ({ ...prev, title: text }))}
          className={`text-foreground rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base dark:bg-gray-900 ${focusedInput === 'title' ? 'border-primary' : 'border-transparent'}`}
          placeholder={
            draft.type === 'expense' ? 'Starbucks, Rent, etc.' : 'Salary, Freelance, etc.'
          }
          placeholderTextColor={placeholderColor}
          onFocus={() => setFocusedInput('title')}
          onBlur={() => setFocusedInput(null)}
        />
      </View>

      {/* Wallet Selector */}
      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Wallet</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-3 py-1">
            {accounts.map((wallet) => {
              const isSelected = draft.walletId === wallet.id;
              return (
                <TouchableOpacity
                  key={wallet.id}
                  onPress={() => setDraft((prev) => ({ ...prev, walletId: wallet.id }))}
                  className={`flex-row items-center gap-2.5 rounded-2xl border px-4 py-3 ${isSelected ? 'border-primary bg-primary' : 'border-gray-200 bg-transparent dark:border-gray-800'}`}>
                  <Icon
                    as={wallet.icon}
                    size={16}
                    className={isSelected ? 'text-white dark:text-black' : 'text-foreground'}
                  />
                  <View>
                    <Text
                      className={`text-sm font-semibold ${isSelected ? 'text-white dark:text-black' : 'text-foreground'}`}>
                      {wallet.name}
                    </Text>
                    <Text
                      className={`text-[10px] ${isSelected ? 'text-white/80 dark:text-black/60' : 'text-muted'}`}>
                      {wallet.balance}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Category Selector */}
      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {categoriesList.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                onPress={() => setDraft((prev) => ({ ...prev, category: cat.name }))}
                className={`rounded-full border px-3.5 py-2 ${draft.category === cat.name ? 'border-primary bg-primary' : 'border-gray-200 bg-transparent dark:border-gray-800'}`}>
                <Text
                  className={`text-xs font-semibold ${draft.category === cat.name ? 'text-white dark:text-black' : 'text-foreground'}`}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Buttons */}
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
    <View>
      {isEditing ? (
        editView
      ) : isExpanded ? (
        <View className="py-1">
          {rowView}
          <View className="flex-row gap-2.5 pb-2.5 pt-1">
            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-full bg-secondary py-3"
              onPress={() => setIsEditing(true)}>
              <Text className="text-foreground text-xs font-bold">Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 items-center justify-center rounded-full bg-red-50 py-3 dark:bg-red-950/20"
              onPress={onDelete}>
              <Text className="text-xs font-bold text-red-500">Delete</Text>
            </TouchableOpacity>
          </View>
          {!isLast && <View className="ml-[54px] mt-1 h-[1px] bg-divider" />}
        </View>
      ) : (
        <>
          {rowView}
          {!isLast && <View className="ml-[54px] h-[1px] bg-divider" />}
        </>
      )}
    </View>
  );
}
