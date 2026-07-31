import {
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, Calendar } from 'lucide-react-native';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
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

export default function AddTransactionScreen() {
  const { accounts, addTransaction } = useApp();
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

    addTransaction({
      title: title.trim() || category,
      amount: parsedAmount!,
      type,
      category,
      date: date.toISOString(),
      walletId: selectedWalletId,
    });

    Toast.show({
      type: 'success',
      text1: 'Transaction Added',
      text2: `Successfully added ${type === 'income' ? 'income' : 'expense'}!`,
    });

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(calendarMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCalendarMonth(newMonth);
  };

  const categoriesList = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between pb-4 pt-8">
          <Text variant="h2">Add Transaction</Text>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900"
            activeOpacity={0.7}>
            <Icon as={X} size={20} className="text-foreground" />
          </TouchableOpacity>
        </View>

        {/* Form Body - Grouped in a Card container */}
        <View className="gap-6 rounded-3xl bg-surface p-6">
          {/* Income / Expense Toggle */}
          <TransactionTypeToggle type={type} onChange={handleTypeChange} />

          {/* Amount Input */}
          <View>
            <Text className="mb-2 ml-1 text-sm text-muted">Amount</Text>
            <View className="relative justify-center">
              <Text className="text-foreground absolute left-5 z-10 text-base font-semibold">
                $
              </Text>
              <TextInput
                value={amount}
                onChangeText={(text) => {
                  setAmount(sanitizeAmountInput(text));
                }}
                className={`text-foreground rounded-full border-2 bg-gray-50 py-3.5 pl-10 pr-5 text-base font-semibold dark:bg-gray-900 ${focusedInput === 'amount' ? 'border-primary' : 'border-transparent'}`}
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
              className={`text-foreground rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base dark:bg-gray-900 ${focusedInput === 'title' ? 'border-primary' : 'border-transparent'}`}
              placeholder={
                type === 'expense' ? 'e.g. Starbucks Coffee' : 'e.g. Freelance project, Bonus'
              }
              placeholderTextColor={placeholderColor}
              onFocus={() => setFocusedInput('title')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* Wallet Selector */}
          <View className="gap-2">
            <Text className="ml-1 text-sm text-muted">Select Wallet</Text>
            {accounts.length === 0 ? (
              <TouchableOpacity
                onPress={() => {
                  router.back();
                  router.push('/(tabs)/wallets');
                }}
                className="items-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <Text className="text-sm font-semibold text-primary">Create a wallet first</Text>
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
                          className={isSelected ? 'text-white dark:text-black' : 'text-foreground'}
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
          <View className="gap-2">
            <Text className="ml-1 text-sm text-muted">Category</Text>
            <Animated.View
              key={type}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}>
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
            </Animated.View>
          </View>

          {/* Quick Date Selector */}
          <View className="gap-2">
            <Text className="ml-1 text-sm text-muted">Date</Text>
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

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSave}
            className="mt-4 items-center justify-center rounded-full bg-primary py-4"
            activeOpacity={0.8}>
            <Text className="text-base font-bold text-white dark:text-black">Save Transaction</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Calendar Modal */}
      <TransactionDatePickerModal
        visible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        date={date}
        onSelectDate={setDate}
        calendarMonth={calendarMonth}
        onNavigateMonth={navigateMonth}
      />
    </KeyboardAvoidingView>
  );
}
