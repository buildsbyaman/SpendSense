import {
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, Calendar } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatNumber } from '@/utils/wallet';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
  sanitizeAmountInput,
  validateTransaction,
  formatDatePickerDate,
} from '@/utils/transaction';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import TransactionTypeToggle from '@/components/transactions/TransactionTypeToggle';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const {
    accounts,
    addTransaction,
    updateTransaction,
    getSortedCategories,
    budgets,
    transactions,
    userProfile,
  } = useApp();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { colorScheme } = useColorScheme();
  const placeholderColor =
    colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState(
    accounts.find((a) => a.isDefault)?.id || (accounts[0]?.id ?? '')
  );
  const [category, setCategory] = useState('Food');

  // Date states
  const [date, setDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (editId) {
      const tx = transactions.find((t) => t.id === editId);
      if (tx) {
        setType(tx.type);
        setAmount(tx.amount.toString());
        setTitle(tx.title === tx.category ? '' : tx.title);
        setCategory(tx.category);
        setSelectedWalletId(tx.walletId);
        setDate(new Date(tx.date));
        setCalendarMonth(new Date(tx.date));
      }
    }
    // Mount the modal slightly after the screen renders to ensure the slide-in animation fires
    setIsModalVisible(true);
  }, [editId]);

  const handleClose = () => {
    setIsModalVisible(false);
    // Wait for the native modal slide-out animation to finish before unmounting the screen
    setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }, 300);
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'expense' ? 'Food' : 'Salary');
  };

  const handleSave = () => {
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
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(calendarMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCalendarMonth(newMonth);
  };

  const categoriesList = getSortedCategories(type);

  return (
    <View className="flex-1 bg-transparent">
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50 dark:bg-black/70">
          {/* Background touch area to close */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={handleClose}
          />

          <View className="rounded-t-[32px] bg-background p-6 pb-12" style={{ maxHeight: '90%' }}>
            {/* Header */}
            <View className="mb-6 flex-row items-center justify-between">
              <Text variant="h2">{editId ? 'Edit Transaction' : 'Add Transaction'}</Text>
              <TouchableOpacity onPress={handleClose} className="rounded-full bg-secondary p-2">
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
                      className={`rounded-full border-2 bg-gray-50 py-3.5 pl-10 pr-5 text-base font-semibold text-foreground dark:bg-gray-900 ${focusedInput === 'amount' ? 'border-primary' : 'border-transparent'}`}
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
                    className={`rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base text-foreground dark:bg-gray-900 ${focusedInput === 'title' ? 'border-primary' : 'border-transparent'}`}
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
                  {accounts.length === 0 ? (
                    <TouchableOpacity
                      onPress={() => {
                        if (router.canGoBack()) router.back();
                        router.push('/(tabs)/wallets');
                      }}
                      className="items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                      <Text className="text-sm font-semibold text-primary">
                        Create a wallet first
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row gap-3 py-1">
                        {accounts.map((wallet) => {
                          const isSelected = selectedWalletId === wallet.id;
                          return (
                            <TouchableOpacity
                              key={wallet.id}
                              onPress={() => setSelectedWalletId(wallet.id)}
                              className={`flex-row items-center gap-2.5 rounded-2xl border px-4 py-3 ${isSelected ? 'border-primary bg-primary' : 'border-gray-200 bg-transparent dark:border-gray-800'}`}>
                              <Icon
                                as={wallet.icon}
                                size={16}
                                className={
                                  isSelected ? 'text-white dark:text-black' : 'text-foreground'
                                }
                              />
                              <View>
                                <Text
                                  className={`text-sm font-semibold ${isSelected ? 'text-white dark:text-black' : 'text-foreground'}`}>
                                  {wallet.name}
                                </Text>
                                <Text
                                  className={`text-[10px] ${isSelected ? 'text-white/80 dark:text-black/60' : 'text-muted'}`}>
                                  {wallet.balance}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  )}
                </View>

                {/* Category Selector */}
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Category</Text>
                  <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row gap-2.5 py-1">
                        {categoriesList.map((cat) => {
                          const isSelected = category === cat.name;
                          return (
                            <TouchableOpacity
                              key={cat.name}
                              onPress={() => setCategory(cat.name)}
                              className={`flex-row items-center gap-2 rounded-full border px-3 py-1.5 ${isSelected ? 'border-primary bg-primary' : 'border-gray-200 bg-transparent dark:border-gray-800'}`}>
                              <Text
                                className={`text-sm font-medium ${isSelected ? 'text-white dark:text-black' : 'text-foreground'}`}>
                                {cat.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                </View>

                {/* Quick Date Selector */}
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Date</Text>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setDate(new Date())}
                      className={`flex-1 items-center rounded-full border py-2.5 ${date.toDateString() === new Date().toDateString() ? 'border-primary bg-primary' : 'border-gray-200 bg-transparent dark:border-gray-800'}`}>
                      <Text
                        className={`text-xs font-semibold ${date.toDateString() === new Date().toDateString() ? 'text-white dark:text-black' : 'text-foreground'}`}>
                        Today
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        setDate(yesterday);
                      }}
                      className={`flex-1 items-center rounded-full border py-2.5 ${date.toDateString() === new Date(Date.now() - 3600000 * 24).toDateString() ? 'border-primary bg-primary' : 'border-gray-200 bg-transparent dark:border-gray-800'}`}>
                      <Text
                        className={`text-xs font-semibold ${date.toDateString() === new Date(Date.now() - 3600000 * 24).toDateString() ? 'text-white dark:text-black' : 'text-foreground'}`}>
                        Yesterday
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setCalendarMonth(new Date(date));
                        setIsDatePickerOpen(true);
                      }}
                      className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-full border px-3 py-2.5 ${date.toDateString() !== new Date().toDateString() && date.toDateString() !== new Date(Date.now() - 3600000 * 24).toDateString() ? 'border-primary bg-primary' : 'border-gray-200 bg-transparent dark:border-gray-800'}`}>
                      <Icon
                        as={Calendar}
                        size={12}
                        className={
                          date.toDateString() !== new Date().toDateString() &&
                          date.toDateString() !== new Date(Date.now() - 3600000 * 24).toDateString()
                            ? 'text-white dark:text-black'
                            : 'text-foreground'
                        }
                      />
                      <Text
                        className={`text-xs font-semibold ${date.toDateString() !== new Date().toDateString() && date.toDateString() !== new Date(Date.now() - 3600000 * 24).toDateString() ? 'text-white dark:text-black' : 'text-foreground'}`}
                        numberOfLines={1}>
                        {formatDatePickerDate(date)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) === 0}
                  className={`mt-8 items-center justify-center rounded-full bg-primary py-3.5 ${!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) === 0 ? 'opacity-40' : 'opacity-100'}`}
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
      </Modal>

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
