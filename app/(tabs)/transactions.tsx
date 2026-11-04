import { View, ScrollView, TouchableOpacity } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAppActions, useAppSelector, selectSortedCategories } from '@/context/store';
import {
  type TransactionDayGroup,
  searchTransactions,
  filterTransactionsByDateRange,
  formatDatePickerDate,
  getCategoryIcon,
  getCategoryColor,
  groupTransactionsByDay,
} from '@/utils/transaction';
import { useState, useCallback, useRef, useEffect, useMemo, useDeferredValue } from 'react';
import { type LucideIcon } from 'lucide-react-native';
import { useTabNavigation } from '@/context/TabNavigationContext';
import Toast from 'react-native-toast-message';
import TransactionFilterBar from '@/components/transactions/TransactionFilterBar';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { QuickStatsCards } from '@/components/transactions/QuickStatsCards';
import {
  TransactionDayGroupView,
  TransactionHistoryEmptyState,
} from '@/components/transactions/TransactionListSection';
import HistoryTypeFilter from '@/components/transactions/HistoryTypeFilter';
import { getWalletTypeColor } from '@/utils/wallet';
import { perfLog, perfNow } from '@/lib/perf';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const keyExtractor = (group: TransactionDayGroup) => group.key;

// Matches the old `gap-4` between day groups.
const DayGroupSeparator = () => <View className="h-4" />;

export default function TransactionsScreen({ isActive = true }: { isActive?: boolean }) {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const { deleteTransaction } = useAppActions();
  const transactions = useAppSelector((state) => state.transactions);
  const accounts = useAppSelector((state) => state.accounts);
  const currencySymbol = useAppSelector((state) => state.userProfile.currencySymbol);
  const customCategories = useAppSelector((state) => state.customCategories);
  const deletedDefaultCategories = useAppSelector((state) => state.deletedDefaultCategories);
  const categoryOrder = useAppSelector((state) => state.categoryOrder);
  const scrollRef = useRef<FlashListRef<TransactionDayGroup>>(null);

  useEffect(() => {
    return addListener((tabName, params) => {
      if (tabName === 'transactions') {
        scrollRef.current?.scrollToOffset({ offset: 0, animated: false });
        if (params?.category) {
          setCategoryFilter(params.category);
          if (params.type === 'expense' || params.type === 'income') {
            setFilter(params.type);
          }
        }
        if (params?.wallet) {
          setWalletFilter(params.wallet);
        }
        if (params?.from && params?.to) {
          const from = new Date(params.from);
          const to = new Date(params.to);
          if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
            setDateFrom(from);
            setDateTo(to);
            setCalendarMonth(new Date(from.getFullYear(), from.getMonth(), 1));
          }
        }
      }
    });
  }, [addListener]);
  const [filter, setFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [walletFilter, setWalletFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // The TextInput value stays on `searchQuery` so typing is never blocked.
  // Filtering waits for the text to settle (debounce) and, if React is busy,
  // finishes the previous render first (deferred value).
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 200);
  const deferredSearchQuery = useDeferredValue(debouncedSearchQuery);
  // Clearing the box should clear results immediately, not 200 ms later.
  const filterQuery = searchQuery === '' ? '' : deferredSearchQuery;
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleTransactionExpand = useCallback((id: string) => {
    setExpandedTransactionId((prev) => (prev === id ? null : id));
  }, []);

  // Close date picker when leaving this tab
  useEffect(() => {
    if (!isActive) {
      setIsDatePickerOpen(false);
      setExpandedTransactionId(null);
      setIsFilterOpen(false);
    }
  }, [isActive]);

  // One lookup table instead of scanning `accounts` for every row (and for
  // every row the search predicate evaluates).
  const walletNames = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name] as const)),
    [accounts]
  );

  // The whole filter → category → date → search → group pipeline is memoized so
  // it only re-runs when its inputs actually change, not on every keystroke/render.
  const visibleTransactions = useMemo(() => {
    const startedAt = perfNow();
    // 1. Type filter
    const typeFiltered = transactions.filter((tx) => {
      if (filter === 'all') return true;
      return tx.type === filter;
    });
    // 2. Category filter
    const categoryFiltered = categoryFilter
      ? typeFiltered.filter((tx) => tx.category === categoryFilter)
      : typeFiltered;
    // 3. Wallet filter
    const walletFiltered = walletFilter
      ? categoryFiltered.filter((tx) => tx.walletId === walletFilter)
      : categoryFiltered;
    // 4. Date filter
    const dateFiltered = filterTransactionsByDateRange(walletFiltered, dateFrom, dateTo);
    // 5. Search filter
    const searched = searchTransactions(
      dateFiltered,
      filterQuery,
      (walletId) => walletNames.get(walletId) || 'Unknown Wallet'
    );
    perfLog(
      'history.filter',
      startedAt,
      `in=${transactions.length} out=${searched.length} q=${filterQuery.length}`
    );
    return searched;
  }, [
    transactions,
    filter,
    categoryFilter,
    walletFilter,
    dateFrom,
    dateTo,
    filterQuery,
    walletNames,
  ]);

  // Category chips shown under the type segment. Reflects the active type filter
  // so users only ever pick categories that exist for that type.
  const filterCategories = useMemo(() => {
    if (filter === 'transfer') return [];
    const types: ('expense' | 'income')[] = filter === 'all' ? ['expense', 'income'] : [filter];
    const seen = new Set<string>();
    const items: { name: string; icon: LucideIcon; color: string }[] = [];
    for (const type of types) {
      for (const cat of selectSortedCategories(
        type,
        customCategories,
        deletedDefaultCategories,
        categoryOrder
      )) {
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
  }, [filter, customCategories, deletedDefaultCategories, categoryOrder]);

  // Group transactions by local day, formatting each day label once.
  const grouped = useMemo(() => groupTransactionsByDay(visibleTransactions), [visibleTransactions]);

  const handleDelete = useCallback((id: string, title: string) => {
    setPendingDelete({ id, title });
  }, []);

  const renderDayGroup = useCallback(
    ({ item }: { item: TransactionDayGroup }) => (
      <TransactionDayGroupView
        group={item}
        expandedTransactionId={expandedTransactionId}
        onToggleExpand={toggleTransactionExpand}
        onDelete={handleDelete}
        walletNames={walletNames}
        currencySymbol={currencySymbol}
        customCategories={customCategories}
      />
    ),
    [
      customCategories,
      currencySymbol,
      expandedTransactionId,
      handleDelete,
      toggleTransactionExpand,
      walletNames,
    ]
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
      walletFilter !== null ||
      searchQuery.length > 0 ||
      (!isDefaultDate() && (dateFrom !== null || dateTo !== null)),
    [filter, categoryFilter, walletFilter, searchQuery, dateFrom, dateTo, isDefaultDate]
  );

  const handleClearAll = useCallback(() => {
    setFilter('all');
    setCategoryFilter(null);
    setWalletFilter(null);
    setSearchQuery('');
    const d = new Date();
    setDateFrom(new Date(d.getFullYear(), d.getMonth(), 1));
    setDateTo(new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999));
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter !== 'all') count++;
    if (categoryFilter !== null) count++;
    if (walletFilter !== null) count++;
    return count;
  }, [filter, categoryFilter, walletFilter]);

  const handlePrevMonth = useCallback(() => {
    const base = dateFrom ?? calendarMonth;
    const prevMonthDate = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    const from = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);
    const to = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0, 23, 59, 59, 999);
    setDateFrom(from);
    setDateTo(to);
    setCalendarMonth(from);
  }, [dateFrom, calendarMonth]);

  const handleNextMonth = useCallback(() => {
    const base = dateFrom ?? calendarMonth;
    const nextMonthDate = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    const from = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 1);
    const to = new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, 0, 23, 59, 59, 999);
    setDateFrom(from);
    setDateTo(to);
    setCalendarMonth(from);
  }, [dateFrom, calendarMonth]);

  const dateLabel = useMemo(() => {
    if (dateFrom && dateTo) {
      const isStart = dateFrom.getDate() === 1;
      const lastDay = new Date(dateFrom.getFullYear(), dateFrom.getMonth() + 1, 0).getDate();
      const isEnd = dateTo.getDate() === lastDay;
      const sameMonth =
        dateFrom.getMonth() === dateTo.getMonth() &&
        dateFrom.getFullYear() === dateTo.getFullYear();

      // Full month selected: e.g. "Oct '26"
      if (isStart && isEnd && sameMonth) {
        const monthShort = dateFrom.toLocaleDateString('en-US', { month: 'short' });
        const yearShort = String(dateFrom.getFullYear()).slice(-2);
        return `${monthShort} '${yearShort}`;
      }

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
      <FlashList
        ref={scrollRef}
        data={grouped}
        keyExtractor={keyExtractor}
        renderItem={renderDayGroup}
        ItemSeparatorComponent={DayGroupSeparator}
        ListHeaderComponent={
          <>
            {transactions.length > 0 && (
              <>
                <TransactionFilterBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  dateLabel={dateLabel}
                  onDatePress={() => setIsDatePickerOpen(true)}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  hasActiveFilter={hasActiveFilter}
                  onClearAll={handleClearAll}
                  onFilterToggle={() => setIsFilterOpen((prev) => !prev)}
                  isFilterOpen={isFilterOpen}
                  activeFilterCount={activeFilterCount}
                />

                {/* ── Embedded Inline Filters ── */}
                {isFilterOpen && (
                  <View className="mb-4 gap-3">
                    {/* 1. Type Switcher (Minimal Animated Capsule) */}
                    <View className="items-center justify-center">
                      <HistoryTypeFilter
                        value={filter}
                        onChange={(v) => {
                          setFilter(v);
                          if (v !== filter) setCategoryFilter(null);
                        }}
                      />
                    </View>

                    {/* 2. Category Chips */}
                    {filter !== 'transfer' && filterCategories.length > 0 && (
                      <View>
                        <Text className="mb-1.5 ml-1 text-[10px] font-semibold uppercase text-muted">
                          Category
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                          <TouchableOpacity
                            onPress={() => setCategoryFilter(null)}
                            activeOpacity={0.7}
                            style={{ outline: 'none' } as any}
                            className={`h-8 items-center justify-center rounded-full border px-3.5 ${
                              categoryFilter === null
                                ? 'border-black bg-surface dark:border-white'
                                : 'border-border bg-surface/60'
                            }`}>
                            <Text
                              className={`text-xs ${
                                categoryFilter === null
                                  ? 'font-bold text-foreground'
                                  : 'font-medium text-muted'
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
                                style={{ outline: 'none' } as any}
                                className={`h-8 flex-row items-center gap-1.5 rounded-full border px-3 ${
                                  isSelected
                                    ? 'border-black bg-surface dark:border-white'
                                    : 'border-border bg-surface/60'
                                }`}>
                                <View
                                  className="h-4 w-4 items-center justify-center rounded-full"
                                  style={{ backgroundColor: `${cat.color}18` }}>
                                  <Icon as={cat.icon} size={10} color={cat.color} />
                                </View>
                                <Text
                                  className={`text-xs ${
                                    isSelected ? 'font-bold text-foreground' : 'font-medium text-muted'
                                  }`}>
                                  {cat.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                    {/* 3. Wallet Chips */}
                    {accounts.length > 1 && (
                      <View>
                        <Text className="mb-1.5 ml-1 text-[10px] font-semibold uppercase text-muted">
                          Wallet
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                          <TouchableOpacity
                            onPress={() => setWalletFilter(null)}
                            activeOpacity={0.7}
                            style={{ outline: 'none' } as any}
                            className={`h-8 items-center justify-center rounded-full border px-3.5 ${
                              walletFilter === null
                                ? 'border-black bg-surface dark:border-white'
                                : 'border-border bg-surface/60'
                            }`}>
                            <Text
                              className={`text-xs ${
                                walletFilter === null
                                  ? 'font-bold text-foreground'
                                  : 'font-medium text-muted'
                              }`}>
                              All
                            </Text>
                          </TouchableOpacity>
                          {accounts.map((wallet) => {
                            const isSelected = walletFilter === wallet.id;
                            const walletColor = getWalletTypeColor(wallet.type);
                            const WalletIcon = wallet.icon;
                            return (
                              <TouchableOpacity
                                key={wallet.id}
                                onPress={() => setWalletFilter(isSelected ? null : wallet.id)}
                                activeOpacity={0.7}
                                style={{ outline: 'none' } as any}
                                className={`h-8 flex-row items-center gap-1.5 rounded-full border px-3 ${
                                  isSelected
                                    ? 'border-black bg-surface dark:border-white'
                                    : 'border-border bg-surface/60'
                                }`}>
                                <Icon as={WalletIcon} size={11} color={walletColor} />
                                <Text
                                  className={`text-xs ${
                                    isSelected ? 'font-bold text-foreground' : 'font-medium text-muted'
                                  }`}>
                                  {wallet.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </>
        }
        ListEmptyComponent={
          <TransactionHistoryEmptyState
            hasTransactions={transactions.length > 0}
            hasAccounts={accounts.length > 0}
            onClearFilters={handleClearAll}
          />
        }
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      />

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
