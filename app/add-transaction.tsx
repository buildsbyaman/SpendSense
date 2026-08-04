import {
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, Calendar } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { formatNumber } from '@/utils/wallet';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
  sanitizeAmountInput,
  validateTransaction,
  formatDatePickerDate,
  getCategoryIcon,
  getCategoryColor,
} from '@/utils/transaction';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import TransactionTypeToggle from '@/components/transactions/TransactionTypeToggle';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';
import { QuickDatePicker } from '@/components/transactions/QuickDatePicker';
import { usePrefillTransactionForm } from '@/components/transactions/usePrefillTransactionForm';
import { WalletSelector } from '@/components/wallets/WalletSelector';
import { CategorySelector } from '@/components/categories/CategorySelector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlideSheet, type SlideSheetHandle } from '@/components/ui/slide-sheet';

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const {
    accounts,
    addTransaction,
    updateTransaction,
    getSortedCategories,
    getSortedAccounts,
    budgets,
    transactions,
    userProfile,
    customCategories,
  } = useApp();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { colorScheme } = useColorScheme();
  const placeholderColor =
    colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState(
    getSortedAccounts().find((a) => a.isDefault)?.id || (getSortedAccounts()[0]?.id ?? '')
  );
  const [category, setCategory] = useState('Food');

  // Date states
  const [date, setDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const sheetRef = useRef<SlideSheetHandle>(null);

  usePrefillTransactionForm(editId, transactions, {
    setType,
    setAmount,
    setTitle,
    setCategory,
    setSelectedWalletId,
    setDate,
    setCalendarMonth,
  });

  const handleNavigateBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleClose = () => {
    sheetRef.current?.close();
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'expense' ? 'Food' : 'Salary');
  };

  const savingRef = useRef(false);

  const handleSave = () => {
    if (savingRef.current) return;

    const { isValid, errorTitle, errorMessage, parsedAmount } = validateTransaction(
      amount,
      selectedWalletId
    );

    if (!isValid) {
      Toast.show({
        type: 'error',
        text1: errorTitle,
        text2: errorMessage,
      });
      return;
    }

    savingRef.current = true;
    try {
      if (editId) {
        const tx = transactions.find((t) => t.id === editId);
        if (tx) {
          updateTransaction({
            ...tx,
            title: title.trim() || category,
            amount: parsedAmount!,
            type,
            category,
            date: date.toISOString(),
            walletId: selectedWalletId,
          });
        }
      } else {
        addTransaction({
          title: title.trim() || category,
          amount: parsedAmount!,
          type,
          category,
          date: date.toISOString(),
          walletId: selectedWalletId,
        });
      }

      // Check if the transaction exceeds the category budget
      const budget = budgets.find((b) => b.category === category);
      let isOverBudget = false;
      let totalSpent = 0;

      if (type === 'expense' && budget) {
        const txDate = new Date(date);
        const txYear = txDate.getFullYear();
        const txMonth = txDate.getMonth();

        const currentMonthTxs = transactions.filter((t) => {
          const d = new Date(t.date);
          return d.getFullYear() === txYear && d.getMonth() === txMonth;
        });

        const spent = currentMonthTxs
          .filter((t) => t.type === 'expense' && t.category === category && t.id !== editId)
          .reduce((sum, t) => sum + t.amount, 0);

        totalSpent = spent + parsedAmount!;
        if (totalSpent > budget.amount) {
          isOverBudget = true;
        }
      }

      if (isOverBudget && budget) {
        Toast.show({
          type: 'error',
          text1: 'Budget Exceeded Warning',
          text2: `Transaction ${editId ? 'updated' : 'added'}, but "${category}" is over budget! (${userProfile.currencySymbol}${formatNumber(totalSpent)} / ${userProfile.currencySymbol}${formatNumber(budget.amount)} spent)`,
        });
      } else {
        Toast.show({
          type: 'success',
          text1: editId ? 'Transaction Updated' : 'Transaction Added',
          text2: editId
            ? 'Transaction details saved successfully.'
            : `Successfully added ${type === 'income' ? 'income' : 'expense'}!`,
        });
      }

      handleClose();
    } finally {
      savingRef.current = false;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(calendarMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCalendarMonth(newMonth);
  };

  const categoriesList = getSortedCategories(type);

  return (
    <View className="flex-1 bg-transparent">
      <SlideSheet ref={sheetRef} onClosed={handleNavigateBack}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/50 dark:bg-black/70">
          {/* Background touch area to close */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={handleClose}
          />

          <View
            className="rounded-t-2xl border-t border-border bg-background p-6 pb-12"
            style={{ maxHeight: '90%' }}>
            {/* Header */}
            <View className="mb-6 flex-row items-center justify-between">
              <Text variant="h2">{editId ? 'Edit Transaction' : 'Add Transaction'}</Text>
              <TouchableOpacity onPress={handleClose} className="rounded-[6px] bg-secondary p-2.5">
                <Icon as={X} size={20} className="text-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View className="gap-5">
                {/* Income / Expense Toggle */}
                <TransactionTypeToggle type={type} onChange={handleTypeChange} />

                {/* Amount Input */}
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Amount</Text>
                  <View className="relative justify-center">
                    <Text className="absolute left-5 z-10 text-base font-semibold text-foreground">
                      {userProfile.currencySymbol}
                    </Text>
                    <TextInput
                      value={amount}
                      onChangeText={(text) => {
                        setAmount(sanitizeAmountInput(text));
                      }}
                      className={`rounded-xl border bg-surface py-3.5 pl-10 pr-5 text-base font-semibold text-foreground ${focusedInput === 'amount' ? 'border-primary' : 'border-border'}`}
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
                  <Text className="mb-2 ml-1 text-sm text-muted">
                    {type === 'expense'
                      ? 'What was this for? (Optional)'
                      : 'Source / Description (Optional)'}
                  </Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    className={`rounded-xl border bg-surface px-4 py-3 text-base text-foreground ${focusedInput === 'title' ? 'border-primary' : 'border-border'}`}
                    placeholder={
                      type === 'expense' ? 'e.g. Starbucks Coffee' : 'e.g. Freelance project, Bonus'
                    }
                    placeholderTextColor={placeholderColor}
                    onFocus={() => setFocusedInput('title')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>

                {/* Wallet Selector */}
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Select Wallet</Text>
                  <WalletSelector
                    accounts={accounts}
                    sortedAccounts={getSortedAccounts()}
                    selectedWalletId={selectedWalletId}
                    onSelect={setSelectedWalletId}
                    emptyMessage="Create a wallet first"
                    onEmptyAction={() => router.push('/add-wallet')}
                  />
                </View>

                {/* Category Selector */}
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Category</Text>
                  <CategorySelector
                    categories={categoriesList as Array<{ name: string; icon?: string; color?: string }>}
                    selected={category}
                    onSelect={setCategory}
                    withMeta
                  />
                </View>

                {/* Quick Date Selector */}
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Date</Text>
                  <QuickDatePicker
                    date={date}
                    onSelectToday={() => setDate(new Date())}
                    onSelectYesterday={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      setDate(yesterday);
                    }}
                    onOpenCalendar={() => {
                      setCalendarMonth(new Date(date));
                      setIsDatePickerOpen(true);
                    }}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) === 0}
                  className={`mt-8 items-center justify-center rounded-[6px] bg-primary py-3.5 ${!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) === 0 ? 'opacity-40' : 'opacity-100'}`}
                  activeOpacity={0.7}>
                  <Text className="text-base font-medium text-white dark:text-black">
                    {editId ? 'Save Changes' : 'Save Transaction'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Safe area spacing for iOS */}
            <View style={{ height: insets.bottom }} />
          </View>
        </KeyboardAvoidingView>
      </SlideSheet>

      {/* Custom Calendar Modal */}
      <TransactionDatePickerModal
        visible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        date={date}
        onSelectDate={setDate}
        calendarMonth={calendarMonth}
        onNavigateMonth={navigateMonth}
      />
    </View>
  );
}
