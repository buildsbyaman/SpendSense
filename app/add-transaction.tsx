import {
  View,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { formatNumber } from '@/utils/wallet';
import {
  type TransactionType,
  validateTransaction,
  formatDatePickerDate,
} from '@/utils/transaction';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';
import { usePrefillTransactionForm } from '@/components/transactions/usePrefillTransactionForm';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlideSheet, type SlideSheetHandle } from '@/components/ui/slide-sheet';
import { TransactionFormFields } from '@/components/transactions/TransactionFormFields';
import { checkBudgetWarning } from '@/hooks/useBudgetWarning';

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
      const { isOverBudget, totalSpent, budget } = checkBudgetWarning(
        budgets,
        transactions,
        category,
        type,
        date,
        parsedAmount!,
        editId
      );

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

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
              <TransactionFormFields
                type={type}
                onTypeChange={handleTypeChange}
                amount={amount}
                setAmount={setAmount}
                title={title}
                setTitle={setTitle}
                selectedWalletId={selectedWalletId}
                setSelectedWalletId={setSelectedWalletId}
                category={category}
                setCategory={setCategory}
                date={date}
                setDate={setDate}
                onOpenDatePicker={() => {
                  setCalendarMonth(new Date(date));
                  setIsDatePickerOpen(true);
                }}
                accounts={accounts}
                sortedAccounts={getSortedAccounts()}
                categoriesList={categoriesList}
                placeholderColor={placeholderColor}
                focusedInput={focusedInput}
                setFocusedInput={setFocusedInput}
                userProfile={userProfile}
              />

              <TouchableOpacity
                  onPress={handleSave}
                  disabled={!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) === 0}
                  className={`mt-8 items-center justify-center rounded-[6px] bg-primary py-4 ${!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) === 0 ? 'opacity-40' : 'opacity-100'}`}
                  activeOpacity={0.7}>
                  <Text className="text-base font-medium text-white dark:text-black">
                    {editId ? 'Save Changes' : 'Save Transaction'}
                  </Text>
                </TouchableOpacity>
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
