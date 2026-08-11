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
  getCategoryIcon,
  getCategoryColor,
} from '@/utils/transaction';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { ChevronDown, Plus, type LucideIcon } from 'lucide-react-native';
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
  const { transactions, accounts, deleteTransaction, userProfile, getSortedCategories } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return addListener((tabName, params) => {
      if (tabName === 'transactions') {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
        if (params?.category) {
          setCategoryFilter(params.category);
          if (params.type === 'expense' || params.type === 'income') {
            setFilter(params.type);
          }
        }
      }
    });
  }, [addListener]);
  const [filter, setFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
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

  // The whole filter → category → date → search → group pipeline is memoized so
  // it only re-runs when its inputs actually change, not on every keystroke/render.
  const visibleTransactions = useMemo(() => {
    // 1. Type filter
    const typeFiltered = transactions.filter((tx) => {
      if (filter === 'all') return true;
      return tx.type === filter;
    });
    // 2. Category filter
    const categoryFiltered = categoryFilter
      ? typeFiltered.filter((tx) => tx.category === categoryFilter)
      : typeFiltered;
    // 3. Date filter
    const dateFiltered = filterTransactionsByDateRange(categoryFiltered, dateFrom, dateTo);
    // 4. Search filter
    return searchTransactions(dateFiltered, searchQuery, getWalletName);
  }, [transactions, filter, categoryFilter, dateFrom, dateTo, searchQuery, getWalletName]);

  // Category chips shown under the type segment. Reflects the active type filter
  // so users only ever pick categories that exist for that type.
  const filterCategories = useMemo(() => {
    if (filter === 'transfer') return [];
    const types: ('expense' | 'income')[] = filter === 'all' ? ['expense', 'income'] : [filter];
    const seen = new Set<string>();
    const items: { name: string; icon: LucideIcon; color: string }[] = [];
    for (const type of types) {
      for (const cat of getSortedCategories(type)) {
        if (seen.has(cat.name)) continue;
        seen.add(cat.name);
        items.push({
          name: cat.name,
          icon: getCategoryIcon(cat.name, undefined, 'icon' in cat ? cat.icon : undefined),
          color: getCategoryColor(cat.name, 'color' in cat ? cat.color : undefined),
        });
      }
    }
    return items;
  }, [filter, getSortedCategories]);

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
      categoryFilter !== null ||
      searchQuery.length > 0 ||
      (!isDefaultDate() && (dateFrom !== null || dateTo !== null)),
    [filter, categoryFilter, searchQuery, dateFrom, dateTo, isDefaultDate]
  );

  const handleClearAll = useCallback(() => {
    setFilter('all');
    setCategoryFilter(null);
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
                onChange={(v) => {
                  setFilter(v);
                  if (v !== filter) setCategoryFilter(null);
                }}
              />
            </View>

            {/* Category filter chips */}
            {filterCategories.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <View className="flex-row items-center gap-2 py-1">
                  <TouchableOpacity
                    onPress={() => setCategoryFilter(null)}
                    activeOpacity={0.7}
                    className={`rounded-xl border px-3 py-2.5 ${
                      categoryFilter === null
                        ? 'bg-primary/10 dark:bg-primary/15 border-primary'
                        : 'border-border bg-surface'
                    }`}>
                    <Text
                      className={`text-sm font-semibold ${
                        categoryFilter === null ? 'text-primary' : 'text-foreground'
                      }`}>
                      All
                    </Text>
                  </TouchableOpacity>
                  {filterCategories.map((cat) => {
                    const isSelected = categoryFilter === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.name}
                        onPress={() => setCategoryFilter(isSelected ? null : cat.name)}
                        activeOpacity={0.7}
                        className={`flex-row items-center gap-2 rounded-xl border px-3 py-2.5 ${
                          isSelected
                            ? 'bg-primary/10 dark:bg-primary/15 border-primary'
                            : 'border-border bg-surface'
                        }`}>
                        <View
                          className="h-7 w-7 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${cat.color}15` }}>
                          <Icon as={cat.icon} size={12} color={cat.color} />
                        </View>
                        <Text
                          className={`text-sm font-semibold ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
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
