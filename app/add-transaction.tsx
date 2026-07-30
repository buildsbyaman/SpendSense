import { 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
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
  formatDatePickerDate
} from '@/utils/transaction';
import Toast from 'react-native-toast-message';
import TransactionTypeToggle from '@/components/transactions/TransactionTypeToggle';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';

export default function AddTransactionScreen() {
  const { accounts, addTransaction } = useApp();
  
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState(
    accounts.find(a => a.isDefault)?.id || (accounts[0]?.id ?? '')
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
    const { isValid, errorTitle, errorMessage, parsedAmount } = validateTransaction(amount, selectedWalletId);
    
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
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>
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
            activeOpacity={0.7}
          >
            <Icon as={X} size={20} className="text-foreground" />
          </TouchableOpacity>
        </View>

        {/* Form Body - Grouped in a Card container */}
        <View className="bg-surface rounded-3xl p-6 gap-6">
          {/* Income / Expense Toggle */}
          <TransactionTypeToggle type={type} onChange={handleTypeChange} />

          {/* Amount Input */}
          <View>
            <Text className="text-sm text-muted mb-2 ml-1">Amount</Text>
            <View className="relative justify-center">
              <Text className="absolute left-5 text-base font-semibold text-foreground z-10">$</Text>
              <TextInput
                value={amount}
                onChangeText={(text) => {
                  setAmount(sanitizeAmountInput(text));
                }}
                className={`bg-gray-50 dark:bg-gray-900 rounded-full pl-10 pr-5 py-3.5 text-foreground text-base font-semibold border-2 ${focusedInput === 'amount' ? 'border-primary' : 'border-transparent'}`}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#9ca3af"
                onFocus={() => setFocusedInput('amount')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          {/* Title */}
          <View>
            <Text className="text-sm text-muted mb-2 ml-1">
              {type === 'expense' ? 'What was this for? (Optional)' : 'Source / Description (Optional)'}
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              className={`bg-gray-50 dark:bg-gray-900 rounded-full px-5 py-3.5 text-foreground text-base border-2 ${focusedInput === 'title' ? 'border-primary' : 'border-transparent'}`}
              placeholder={type === 'expense' ? 'e.g. Starbucks Coffee' : 'e.g. Freelance project, Bonus'}
              placeholderTextColor="#9ca3af"
              onFocus={() => setFocusedInput('title')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* Wallet Selector */}
          <View className="gap-2">
            <Text className="text-sm text-muted ml-1">Select Wallet</Text>
            {accounts.length === 0 ? (
              <TouchableOpacity 
                onPress={() => { router.back(); router.push('/(tabs)/wallets'); }}
                className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 border border-dashed border-gray-300 dark:border-gray-700 items-center"
              >
                <Text className="text-sm text-primary font-semibold">Create a wallet first</Text>
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
                        className={`px-4 py-3 rounded-2xl border flex-row items-center gap-2.5 ${isSelected ? 'bg-primary border-primary' : 'bg-transparent border-gray-200 dark:border-gray-800'}`}
                      >
                        <Icon as={wallet.icon} size={16} className={isSelected ? 'text-white dark:text-black' : 'text-foreground'} />
                        <View>
                          <Text className={`font-semibold text-sm ${isSelected ? 'text-white dark:text-black' : 'text-foreground'}`}>
                            {wallet.name}
                          </Text>
                          <Text className={`text-[10px] ${isSelected ? 'text-white/80 dark:text-black/60' : 'text-muted'}`}>
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
            <Text className="text-sm text-muted ml-1">Category</Text>
            <Animated.View key={type} entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2.5 py-1">
                  {categoriesList.map((cat) => {
                    const isSelected = category === cat.name;
                    return (
                      <TouchableOpacity
                        key={cat.name}
                        onPress={() => setCategory(cat.name)}
                        className={`flex-row items-center gap-2 px-3 py-1.5 rounded-full border ${isSelected ? 'bg-primary border-primary' : 'bg-transparent border-gray-200 dark:border-gray-800'}`}
                      >
                        <Text className={`text-sm font-medium ${isSelected ? 'text-white dark:text-black' : 'text-foreground'}`}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </Animated.View>
          </View>

          {/* Quick Date Selector */}
          <View className="gap-2">
            <Text className="text-sm text-muted ml-1">Date</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDate(new Date())}
                className={`flex-1 py-2.5 rounded-full border items-center ${date.toDateString() === new Date().toDateString() ? 'bg-primary border-primary' : 'bg-transparent border-gray-200 dark:border-gray-800'}`}
              >
                <Text className={`font-semibold text-xs ${date.toDateString() === new Date().toDateString() ? 'text-white dark:text-black' : 'text-foreground'}`}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setDate(yesterday);
                }}
                className={`flex-1 py-2.5 rounded-full border items-center ${date.toDateString() === new Date(Date.now() - 3600000 * 24).toDateString() ? 'bg-primary border-primary' : 'bg-transparent border-gray-200 dark:border-gray-800'}`}
              >
                <Text className={`font-semibold text-xs ${date.toDateString() === new Date(Date.now() - 3600000 * 24).toDateString() ? 'text-white dark:text-black' : 'text-foreground'}`}>Yesterday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setCalendarMonth(new Date(date));
                  setIsDatePickerOpen(true);
                }}
                className={`flex-1 py-2.5 rounded-full border items-center flex-row justify-center gap-1.5 px-3 ${date.toDateString() !== new Date().toDateString() && date.toDateString() !== new Date(Date.now() - 3600000 * 24).toDateString() ? 'bg-primary border-primary' : 'bg-transparent border-gray-200 dark:border-gray-800'}`}
              >
                <Icon as={Calendar} size={12} className={date.toDateString() !== new Date().toDateString() && date.toDateString() !== new Date(Date.now() - 3600000 * 24).toDateString() ? 'text-white dark:text-black' : 'text-foreground'} />
                <Text className={`font-semibold text-xs ${date.toDateString() !== new Date().toDateString() && date.toDateString() !== new Date(Date.now() - 3600000 * 24).toDateString() ? 'text-white dark:text-black' : 'text-foreground'}`} numberOfLines={1}>
                  {formatDatePickerDate(date)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSave}
            className="bg-primary rounded-full py-4 items-center justify-center mt-4"
            activeOpacity={0.8}
          >
            <Text className="font-bold text-base text-white dark:text-black">Save Transaction</Text>
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
