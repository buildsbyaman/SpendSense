import { View, ScrollView, TouchableOpacity, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useApp } from '@/context/AppContext';
import { formatNumber } from '@/utils/wallet';
import AnimatedSegment from '@/components/ui/animated-segment';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getCategoryIcon,
  getCategoryColor,
  type Transaction,
  searchTransactions,
  filterTransactionsByDateRange,
  formatDatePickerDate,
} from '@/utils/transaction';
import { useState, useCallback, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, ChevronDown, Plus, Receipt, Wallet } from 'lucide-react-native';
import { useTabNavigation } from '@/context/TabNavigationContext';
import Toast from 'react-native-toast-message';
import TransactionFilterBar from '@/components/transactions/TransactionFilterBar';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function TransactionsScreen({ isActive = true }: { isActive?: boolean }) {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const { transactions, accounts, deleteTransaction, updateTransaction, userProfile } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'transactions') {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    });
  }, [addListener]);
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [dateTo, setDateTo] = useState<Date | null>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  const toggleTransactionExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTransactionId(expandedTransactionId === id ? null : id);
  };

  // Close date picker when leaving this tab
  useEffect(() => {
    if (!isActive) {
      setIsDatePickerOpen(false);
      setExpandedTransactionId(null);
    }
  }, [isActive]);

  const getWalletName = (walletId: string) => {
    return accounts.find((a) => a.id === walletId)?.name || 'Unknown Wallet';
  };

  // 1. Type filter
  let visibleTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  // 2. Date filter
  visibleTransactions = filterTransactionsByDateRange(visibleTransactions, dateFrom, dateTo);

  // 3. Search filter
  visibleTransactions = searchTransactions(visibleTransactions, searchQuery, getWalletName);

  // Group transactions by date
  const groupTransactionsByDate = (txs: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    txs.forEach((tx) => {
      const dateStr = new Date(tx.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(tx);
    });
    return groups;
  };

  const grouped = groupTransactionsByDate(visibleTransactions);

  const handleDelete = (id: string, title: string) => {
    setPendingDelete({ id, title });
  };

  // Quick stats
  const totalIncome = visibleTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = visibleTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const isDefaultDate = () => {
    if (!dateFrom || !dateTo) return false;
    const d = new Date();
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    return dateFrom.getTime() === firstDay && dateTo.getTime() === lastDay;
  };

  const hasActiveFilter =
    filter !== 'all' ||
    searchQuery.length > 0 ||
    (!isDefaultDate() && (dateFrom !== null || dateTo !== null));

  const handleClearAll = () => {
    setFilter('all');
    setSearchQuery('');
    const d = new Date();
    setDateFrom(new Date(d.getFullYear(), d.getMonth(), 1));
    setDateTo(new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999));
  };

  let dateLabel = 'Any Date';
  if (dateFrom && dateTo) {
    if (dateFrom.toDateString() === dateTo.toDateString()) {
      dateLabel = formatDatePickerDate(dateFrom);
    } else {
      dateLabel = `${formatDatePickerDate(dateFrom)} - ${formatDatePickerDate(dateTo)}`;
    }
  } else if (dateFrom) {
    dateLabel = `From ${formatDatePickerDate(dateFrom)}`;
  } else if (dateTo) {
    dateLabel = `Until ${formatDatePickerDate(dateTo)}`;
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header title="History" showBack={false} />
      </View>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}>
        {transactions.length > 0 && (
          <>
            <TransactionFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateLabel={dateLabel}
              onDatePress={() => setIsDatePickerOpen(true)}
              hasActiveFilter={hasActiveFilter}
              onClearAll={handleClearAll}
            />

            <View className="mb-4 mt-2">
              <AnimatedSegment<'all' | 'expense' | 'income'>
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Expense', value: 'expense' },
                  { label: 'Income', value: 'income' },
                ]}
                selectedValue={filter}
                onChange={setFilter}
              />
            </View>
          </>
        )}

        {/* Quick Stats Cards */}
        {filter === 'all' && transactions.length > 0 && (
          <View className="mb-6 flex-row gap-4">
            <View className="flex-1 flex-row items-center gap-3 rounded-3xl bg-surface p-4">
              <View className="bg-income/10 dark:bg-income/20 h-10 w-10 items-center justify-center rounded-full">
                <Icon as={ArrowDownLeft} size={20} className="text-income" />
              </View>
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  Income
                </Text>
                <Text className="text-base font-bold text-income">
                  {userProfile.currencySymbol}
                  {formatNumber(totalIncome)}
                </Text>
              </View>
            </View>
            <View className="flex-1 flex-row items-center gap-3 rounded-3xl bg-surface p-4">
              <View className="bg-expense/10 dark:bg-expense/20 h-10 w-10 items-center justify-center rounded-full">
                <Icon as={ArrowUpRight} size={20} className="text-expense" />
              </View>
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  Expenses
                </Text>
                <Text className="text-base font-bold text-expense">
                  {userProfile.currencySymbol}
                  {formatNumber(totalExpense)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Transactions List */}
        {transactions.length === 0 ? (
          accounts.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Create Your First Wallet"
              description="Add a wallet to start tracking your balances and transactions."
              buttonText="Add Wallet"
              onButtonPress={() => router.push('/add-wallet')}
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="No Transactions Yet"
              description="Add your first transaction to start tracking your expenses and incomes."
              buttonText="Add Your First Transaction"
              onButtonPress={() => router.push('/add-transaction')}
            />
          )
        ) : Object.keys(grouped).length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No Results Found"
            description="We couldn't find any transactions matching your filters. Try clearing them or using different keywords."
          />
        ) : (
          <View className="gap-6">
            {Object.entries(grouped).map(([date, txs]) => (
              <View key={date} className="gap-2.5">
                <Text className="ml-1 text-xs font-bold uppercase tracking-widest text-muted">
                  {date}
                </Text>
                <View>
                  {txs.map((tx, idx) => {
                    const icon = getCategoryIcon(tx.category, tx.title);
                    const color = getCategoryColor(tx.category);
                    const isLast = idx === txs.length - 1;

                    return (
                      <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        isExpanded={expandedTransactionId === tx.id}
                        isLast={isLast}
                        onToggleExpand={() => toggleTransactionExpand(tx.id)}
                        onDelete={() => handleDelete(tx.id, tx.title)}
                        onUpdate={(updated) => {
                          updateTransaction(updated);
                          Toast.show({
                            type: 'success',
                            text1: 'Transaction Updated',
                            text2: 'Wallet balances adjusted successfully.',
                          });
                        }}
                        accounts={accounts}
                        getWalletName={getWalletName}
                      />
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TransactionDatePickerModal
        visible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        mode="range"
        initialFrom={dateFrom}
        initialTo={dateTo}
        onSelectRange={({ from, to }) => {
          setDateFrom(from);
          setDateTo(to);
        }}
        calendarMonth={calendarMonth}
        onNavigateMonth={(direction) => {
          const newMonth = new Date(calendarMonth);
          if (direction === 'prev') {
            newMonth.setMonth(newMonth.getMonth() - 1);
          } else {
            newMonth.setMonth(newMonth.getMonth() + 1);
          }
          setCalendarMonth(newMonth);
        }}
      />

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${pendingDelete?.title}"? This will reverse the wallet balance adjustment.`}
        confirmText="Delete"
        destructive
        onConfirm={() => {
          if (pendingDelete) {
            deleteTransaction(pendingDelete.id);
            Toast.show({
              type: 'success',
              text1: 'Transaction Deleted',
              text2: 'Wallet balance has been reverted.',
            });
          }
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}
