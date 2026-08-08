import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { EmptyState } from '@/components/ui/EmptyState';
import { Wallet, Receipt, Tag, FilterX } from 'lucide-react-native';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { type Transaction } from '@/utils/transaction';
import { type Account } from '@/utils/wallet';
import { router } from 'expo-router';

interface Props {
  transactions: Transaction[];
  accounts: Account[];
  grouped: Record<string, Transaction[]>;
  expandedTransactionId: string | null;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  getWalletName: (walletId: string) => string;
  onClearFilters: () => void;
}

export function TransactionListSection({
  transactions,
  accounts,
  grouped,
  expandedTransactionId,
  onToggleExpand,
  onDelete,
  getWalletName,
  onClearFilters,
}: Props) {
  if (transactions.length === 0) {
    return accounts.length === 0 ? (
      <View className="items-center pb-6">
        <EmptyState
          icon={Wallet}
          title="Create Your First Wallet"
          description="Add a wallet to start tracking your balances and transactions."
          buttonText="Add Wallet"
          onButtonPress={() => router.push('/add-wallet')}
        />
      </View>
    ) : (
      <View className="items-center pb-6">
        <EmptyState
          icon={Receipt}
          title="No Transactions Yet"
          description="Start tracking your income and expenses."
          buttonText="Add Transaction"
          onButtonPress={() => router.push('/add-transaction')}
        />
      </View>
    );
  }

  if (Object.keys(grouped).length === 0) {
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

  return (
    <View className="gap-4">
      {Object.entries(grouped).map(([date, txs]) => (
        <View key={date}>
          <Text className="mb-2 ml-1 text-xs font-semibold text-muted">{date}</Text>
          <View className="overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xs">
            {txs.map((tx, idx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                accounts={accounts}
                getWalletName={getWalletName}
                isExpanded={expandedTransactionId === tx.id}
                onToggleExpand={() => onToggleExpand(tx.id)}
                onDelete={() => onDelete(tx.id, tx.title)}
                isLast={idx === txs.length - 1}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
