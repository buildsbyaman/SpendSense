import { View, ScrollView, TouchableOpacity, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useApp } from '@/context/AppContext';
import { formatNumber } from '@/utils/wallet';
import AnimatedSegment from '@/components/ui/animated-segment';
import {
  type Transaction,
  searchTransactions,
  filterTransactionsByDateRange,
  formatDatePickerDate,
} from '@/utils/transaction';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { ChevronDown, Plus } from 'lucide-react-native';
import { useTabNavigation } from '@/context/TabNavigationContext';
import Toast from 'react-native-toast-message';
import TransactionFilterBar from '@/components/transactions/TransactionFilterBar';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { QuickStatsCards } from '@/components/transactions/QuickStatsCards';
import { TransactionListSection } from '@/components/transactions/TransactionListSection';

export default function TransactionsScreen({ isActive = true }: { isActive?: boolean }) {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const { transactions, accounts, deleteTransaction, userProfile } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'transactions') {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    });
  }, [addListener]);
  const [filter, setFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
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

  const toggleTransactionExpand = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTransactionId((prev) => (prev === id ? null : id));
  }, []);

  // Close date picker when leaving this tab
  useEffect(() => {
    if (!isActive) {
      setIsDatePickerOpen(false);
      setExpandedTransactionId(null);
    }
  }, [isActive]);

  const getWalletName = useCallback(
    (walletId: string) => {
      return accounts.find((a) => a.id === walletId)?.name || 'Unknown Wallet';
    },
    [accounts]
  );

  // The whole filter → date → search → group pipeline is memoized so it only
  // re-runs when its inputs actually change, not on every keystroke/render.
  const visibleTransactions = useMemo(() => {
    // 1. Type filter
    const typeFiltered = transactions.filter((tx) => {
      if (filter === 'all') return true;
      return tx.type === filter;
    });
    // 2. Date filter
    const dateFiltered = filterTransactionsByDateRange(typeFiltered, dateFrom, dateTo);
    // 3. Search filter
    return searchTransactions(dateFiltered, searchQuery, getWalletName);
  }, [transactions, filter, dateFrom, dateTo, searchQuery, getWalletName]);

  // Group transactions by date (pure + stable identity so it can be hoisted)
  const grouped = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    visibleTransactions.forEach((tx) => {
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
  }, [visibleTransactions]);

  const handleDelete = useCallback((id: string, title: string) => {
    setPendingDelete({ id, title });
  }, []);

  // Quick stats
  const totalIncome = useMemo(
    () =>
      visibleTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [visibleTransactions]
  );

  const totalExpense = useMemo(
    () =>
      visibleTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [visibleTransactions]
  );

  const isDefaultDate = useCallback(() => {
    if (!dateFrom || !dateTo) return false;
    const d = new Date();
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    return dateFrom.getTime() === firstDay && dateTo.getTime() === lastDay;
  }, [dateFrom, dateTo]);

  const hasActiveFilter = useMemo(
    () =>
      filter !== 'all' ||
      searchQuery.length > 0 ||
      (!isDefaultDate() && (dateFrom !== null || dateTo !== null)),
    [filter, searchQuery, dateFrom, dateTo, isDefaultDate]
  );

  const handleClearAll = useCallback(() => {
    setFilter('all');
    setSearchQuery('');
    const d = new Date();
    setDateFrom(new Date(d.getFullYear(), d.getMonth(), 1));
    setDateTo(new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999));
  }, []);

  const dateLabel = useMemo(() => {
    if (dateFrom && dateTo) {
      if (dateFrom.toDateString() === dateTo.toDateString()) {
        return formatDatePickerDate(dateFrom, true);
      }
      const sameYear = dateFrom.getFullYear() === dateTo.getFullYear();
      return `${formatDatePickerDate(dateFrom, !sameYear)} - ${formatDatePickerDate(dateTo, true)}`;
    } else if (dateFrom) {
      return `From ${formatDatePickerDate(dateFrom, true)}`;
    } else if (dateTo) {
      return `Until ${formatDatePickerDate(dateTo, true)}`;
    }
    return 'Any Date';
  }, [dateFrom, dateTo]);

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
        }}
        keyboardDismissMode="on-drag">
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
              <AnimatedSegment<'all' | 'expense' | 'income' | 'transfer'>
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Expense', value: 'expense' },
                  { label: 'Income', value: 'income' },
                  { label: 'Transfer', value: 'transfer' },
                ]}
                selectedValue={filter}
                onChange={setFilter}
              />
            </View>
          </>
        )}

        {/* Quick Stats Cards */}
        {filter === 'all' && transactions.length > 0 && (
          <QuickStatsCards
            income={totalIncome}
            expense={totalExpense}
            currencySymbol={userProfile.currencySymbol}
          />
        )}

        {/* Transactions List */}
        <TransactionListSection
          transactions={transactions}
          accounts={accounts}
          grouped={grouped}
          expandedTransactionId={expandedTransactionId}
          onToggleExpand={toggleTransactionExpand}
          onDelete={handleDelete}
          getWalletName={getWalletName}
          onClearFilters={handleClearAll}
        />
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
        onChangeMonth={setCalendarMonth}
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
        onConfirm={async () => {
          if (pendingDelete) {
            try {
              await deleteTransaction(pendingDelete.id);
              Toast.show({
                type: 'success',
                text1: 'Transaction Deleted',
                text2: 'Wallet balance has been reverted.',
              });
            } catch {
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: 'Your transaction could not be deleted. Please try again.',
              });
            }
          }
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}
