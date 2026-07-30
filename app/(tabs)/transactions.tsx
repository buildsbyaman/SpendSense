import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useApp } from '@/context/AppContext';
import { getCategoryIcon, getCategoryColor, type Transaction, searchTransactions, filterTransactionsByDateRange, formatDatePickerDate } from '@/utils/transaction';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, ChevronDown } from 'lucide-react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import TransactionFilterBar from '@/components/transactions/TransactionFilterBar';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, accounts, deleteTransaction } = useApp();
  const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Close date picker when leaving this tab
  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsDatePickerOpen(false);
      };
    }, [])
  );

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
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${title}"? This will reverse the wallet balance adjustment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteTransaction(id);
            Toast.show({
              type: 'success',
              text1: 'Transaction Deleted',
              text2: 'Wallet balance has been reverted.',
            });
          }
        }
      ]
    );
  };

  // Quick stats
  const totalIncome = visibleTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpense = visibleTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const hasActiveFilter = filter !== 'all' || searchQuery.length > 0 || dateFrom !== null || dateTo !== null;

  const handleClearAll = () => {
    setFilter('all');
    setSearchQuery('');
    setDateFrom(null);
    setDateTo(null);
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
    <View className="flex-1 bg-background">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ 
          paddingTop: insets.top + 24, 
          paddingBottom: 120, 
          paddingHorizontal: 20 
        }}
      >
        <Header 
          title="History" 
          showBack={true} 
        />

        <TransactionFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateLabel={dateLabel}
          onDatePress={() => setIsDatePickerOpen(true)}
          hasActiveFilter={hasActiveFilter}
          onClearAll={handleClearAll}
        />

        {/* Filter Pills */}
        <View className="flex-row gap-2 mt-2 mb-4">
          {(['all', 'expense', 'income'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`px-4 py-2 rounded-full border ${filter === f ? 'bg-primary border-primary' : 'bg-transparent border-gray-200 dark:border-gray-800'}`}
            >
              <Text className={`text-xs font-semibold capitalize ${filter === f ? 'text-white dark:text-black' : 'text-muted'}`}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats Cards */}
        {filter === 'all' && transactions.length > 0 && (
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 bg-surface p-4 rounded-3xl flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-income/10 dark:bg-income/20 items-center justify-center">
                <Icon as={ArrowDownLeft} size={20} className="text-income" />
              </View>
              <View>
                <Text className="text-[10px] text-muted font-bold uppercase tracking-widest">Income</Text>
                <Text className="text-base font-bold text-income">${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>
            <View className="flex-1 bg-surface p-4 rounded-3xl flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-expense/10 dark:bg-expense/20 items-center justify-center">
                <Icon as={ArrowUpRight} size={20} className="text-expense" />
              </View>
              <View>
                <Text className="text-[10px] text-muted font-bold uppercase tracking-widest">Expenses</Text>
                <Text className="text-base font-bold text-expense">${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Transactions List */}
        {Object.keys(grouped).length === 0 ? (
          <View className="flex-1 py-20 items-center justify-center">
            <Text className="text-base text-muted font-semibold">No transactions found</Text>
            <Text className="text-xs text-muted/60 mt-1">Tap the add button to log a transaction</Text>
          </View>
        ) : (
          <View className="gap-6">
            {Object.entries(grouped).map(([date, txs]) => (
              <View key={date} className="gap-2.5">
                <Text className="text-xs font-bold text-muted uppercase tracking-widest ml-1">{date}</Text>
                <View className="bg-surface rounded-3xl overflow-hidden px-4 py-2">
                  {txs.map((tx, idx) => {
                    const icon = getCategoryIcon(tx.category);
                    const color = getCategoryColor(tx.category);
                    const isLast = idx === txs.length - 1;
 
                    return (
                      <View key={tx.id}>
                        <View className="flex-row items-center justify-between py-3.5">
                          <View className="flex-row items-center gap-3.5 flex-1 mr-2">
                            <View 
                              className="w-10 h-10 rounded-full items-center justify-center"
                              style={{ backgroundColor: `${color}15` }}
                            >
                              <Icon as={icon} size={18} color={color} />
                            </View>
                            <View className="flex-1">
                              <Text className="text-base text-foreground font-semibold" numberOfLines={1}>
                                {tx.title}
                              </Text>
                              <Text className="text-xs text-muted mt-0.5" numberOfLines={1}>
                                {getWalletName(tx.walletId)} • {tx.category}
                              </Text>
                            </View>
                          </View>
                          
                          <View className="flex-row items-center gap-3">
                            <Text className={`text-base font-bold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                              {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Text>
                            <Icon as={ChevronDown} size={18} className="text-muted" />
                          </View>
                        </View>
                        {!isLast && (
                          <View className="h-[1px] bg-divider ml-[54px]" />
                        )}
                      </View>
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
    </View>
  );
}
