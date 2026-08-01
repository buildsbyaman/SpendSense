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
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import { useApp } from '@/context/AppContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const DURATION = 280;
const EASING = Easing.out(Easing.cubic);

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
  const { userProfile } = useApp();

  const progress = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isExpanded ? 1 : 0, { duration: DURATION, easing: EASING });
  }, [isExpanded]);

  const actionsStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(progress.value, [0, 1], [0, 70]),
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]),
    overflow: 'hidden',
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }));

  const icon = getCategoryIcon(transaction.category, transaction.title);
  const color = getCategoryColor(transaction.category);

  // --- Normal row view ---
  const rowView = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggleExpand}
      className="flex-row items-center justify-between px-5 py-5">
      <View className="mr-2 flex-1 flex-row items-center gap-4">
        <View
          className="relative h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}15` }}>
          <Icon as={icon} size={22} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
            {transaction.title}
          </Text>
          <Text className="mt-0.5 text-sm text-muted" numberOfLines={1}>
            {getWalletName(transaction.walletId)} • {transaction.category}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <Text
          className={`text-base font-bold ${transaction.type === 'income' ? 'text-income' : 'text-expense'}`}>
          {transaction.type === 'income' ? '+' : '-'}{userProfile.currencySymbol}
          {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        <Animated.View style={chevronStyle}>
          <Icon as={ChevronDown} size={20} className="text-muted" />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="mb-4 overflow-hidden rounded-3xl border border-border bg-surface shadow-xs">
      {rowView}
      <Animated.View style={actionsStyle}>
        <View className="flex-row gap-2.5 px-4 pb-4">
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-full bg-secondary py-3"
            onPress={() => router.push({ pathname: '/add-transaction', params: { editId: transaction.id } })}>
            <Text className="text-foreground text-xs font-bold">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-full bg-red-50 py-3 dark:bg-red-950/20"
            onPress={onDelete}>
            <Text className="text-xs font-bold text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
