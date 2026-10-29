import React, { useRef, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronDown, ArrowLeftRight } from 'lucide-react-native';
import { type Transaction, type CustomCategory, getCategoryDetails } from '@/utils/transaction';
import { formatNumber } from '@/utils/wallet';
import { router } from 'expo-router';
import { useExpandAnimation } from '@/hooks/useExpandAnimation';
import Animated from 'react-native-reanimated';

interface TransactionItemProps {
  transaction: Transaction;
  isExpanded: boolean;
  isLast: boolean;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  walletNames: Map<string, string>;
  /** Fallback when a wallet id is missing (Home and History use different copy). */
  unknownWalletLabel?: string;
  currencySymbol: string;
  customCategories: CustomCategory[];
}

/**
 * Animated pieces are split out so a collapsed row (the common case in a long
 * history) never creates Reanimated shared values. They mount on first
 * expansion and stay mounted afterwards so the closing animation still plays.
 */
function AnimatedChevron({
  isExpanded,
  animateOnMount,
}: {
  isExpanded: boolean;
  animateOnMount: boolean;
}) {
  const { chevronStyle } = useExpandAnimation(isExpanded, animateOnMount);

  return (
    <Animated.View style={chevronStyle} className="shrink-0">
      <Icon as={ChevronDown} size={20} className="text-muted" />
    </Animated.View>
  );
}

function TransactionActions({
  transaction,
  isExpanded,
  animateOnMount,
  onDelete,
}: {
  transaction: Transaction;
  isExpanded: boolean;
  animateOnMount: boolean;
  onDelete: (id: string, title: string) => void;
}) {
  const { actionsStyle } = useExpandAnimation(isExpanded, animateOnMount);

  return (
    <Animated.View style={actionsStyle}>
      <View className="h-[1px] bg-divider" />
      <View className="flex-row gap-2.5 px-4 py-3">
        <TouchableOpacity
          className="flex-1 items-center justify-center rounded-[6px] bg-secondary py-3"
          onPress={() =>
            router.push({ pathname: '/add-transaction', params: { editId: transaction.id } })
          }>
          <Text className="text-xs font-bold text-foreground">Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 items-center justify-center rounded-[6px] bg-red-50 py-3 dark:bg-red-950/20"
          onPress={() => onDelete(transaction.id, transaction.title)}>
          <Text className="text-xs font-bold text-red-500">Delete</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export const TransactionItem = React.memo(function TransactionItem({
  transaction,
  isExpanded,
  isLast,
  onToggleExpand,
  onDelete,
  walletNames,
  unknownWalletLabel = 'Unknown Wallet',
  currencySymbol,
  customCategories,
}: TransactionItemProps) {
  // Once a row has been opened we keep the animated children mounted so the
  // close animation can run; a row that mounts already expanded renders open
  // without replaying the opening animation.
  const [hasExpanded, setHasExpanded] = useState(isExpanded);
  const animateOnMount = useRef(!isExpanded).current;
  if (isExpanded && !hasExpanded) setHasExpanded(true);

  const isTransfer = transaction.type === 'transfer';
  const { icon, color } = isTransfer
    ? { icon: ArrowLeftRight, color: '#8e8e93' }
    : getCategoryDetails(transaction.category, transaction.title, customCategories);

  const subtitle = isTransfer
    ? `${walletNames.get(transaction.walletId) || unknownWalletLabel} → ${walletNames.get(transaction.toWalletId ?? '') || unknownWalletLabel}`
    : `${walletNames.get(transaction.walletId) || unknownWalletLabel} • ${transaction.category}`;

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onToggleExpand(transaction.id)}
        className="flex-row items-center justify-between px-5 py-5">
        <View className="mr-2 flex-1 flex-row items-center gap-4">
          <View
            className="relative h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}15` }}>
            <Icon as={icon} size={22} color={color} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
              {transaction.title}
            </Text>
            <Text className="mt-0.5 text-sm text-muted" numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <Text
            className={`text-base font-semibold ${
              isTransfer
                ? 'text-muted'
                : transaction.type === 'income'
                  ? 'text-income'
                  : 'text-expense'
            }`}>
            {transaction.type === 'income' ? '+' : isTransfer ? '' : '-'}
            {currencySymbol}
            {formatNumber(transaction.amount)}
          </Text>
          {hasExpanded ? (
            <AnimatedChevron isExpanded={isExpanded} animateOnMount={animateOnMount} />
          ) : (
            <View className="shrink-0">
              <Icon as={ChevronDown} size={20} className="text-muted" />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {hasExpanded && (
        <TransactionActions
          transaction={transaction}
          isExpanded={isExpanded}
          animateOnMount={animateOnMount}
          onDelete={onDelete}
        />
      )}
    </View>
  );
});
