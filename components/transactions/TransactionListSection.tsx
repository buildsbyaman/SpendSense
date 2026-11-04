import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/ui/EmptyState';
import { Wallet, Receipt, Tag, FilterX } from 'lucide-react-native';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { type TransactionDayGroup, type CustomCategory } from '@/utils/transaction';
import { type Account } from '@/utils/wallet';
import { router } from 'expo-router';

interface DayGroupProps {
  group: TransactionDayGroup;
  expandedTransactionId: string | null;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  walletNames: Map<string, string>;
  wallets?: Map<string, Account>;
  currencySymbol: string;
  customCategories: CustomCategory[];
}

/**
 * One local-day section of the history list. Rendered as a single FlashList
 * item so the rounded group surface and its shadow stay identical to the
 * previous ScrollView layout while groups scroll in and out of the viewport.
 */
export function TransactionDayGroupView({
  group,
  expandedTransactionId,
  onToggleExpand,
  onDelete,
  walletNames,
  wallets,
  currencySymbol,
  customCategories,
}: DayGroupProps) {
  return (
    <View>
      <Text className="mb-2 ml-1 text-xs font-semibold text-muted">{group.label}</Text>
      <View className="overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xs">
        {group.transactions.map((tx, idx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            walletNames={walletNames}
            wallets={wallets}
            isExpanded={expandedTransactionId === tx.id}
            onToggleExpand={onToggleExpand}
            onDelete={onDelete}
            isLast={idx === group.transactions.length - 1}
            currencySymbol={currencySymbol}
            customCategories={customCategories}
            showSubtitle={false}
          />
        ))}
      </View>
    </View>
  );
}

interface EmptyStateProps {
  /** Total transactions, before filters (mirrors the old section logic). */
  hasTransactions: boolean;
  hasAccounts: boolean;
  onClearFilters: () => void;
}

export function TransactionHistoryEmptyState({
  hasTransactions,
  hasAccounts,
  onClearFilters,
}: EmptyStateProps) {
  if (!hasTransactions) {
    return hasAccounts ? (
      <View className="items-center pb-6">
        <EmptyState
          icon={Receipt}
          title="No Transactions Yet"
          description="Start tracking your income and expenses."
          buttonText="Add Transaction"
          onButtonPress={() => router.push('/add-transaction')}
        />
      </View>
    ) : (
      <View className="items-center pb-6">
        <EmptyState
          icon={Wallet}
          title="Create Your First Wallet"
          description="Add a wallet to start tracking your balances and transactions."
          buttonText="Add Wallet"
          onButtonPress={() => router.push('/add-wallet')}
        />
      </View>
    );
  }

  return (
    <View className="items-center pb-6">
      <EmptyState
        icon={Tag}
        title="No Results"
        description="No transactions match your current filters."
        buttonText="Clear Filters"
        buttonIcon={FilterX}
        onButtonPress={onClearFilters}
      />
    </View>
  );
}
