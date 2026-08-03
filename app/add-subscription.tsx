import {
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, Calendar } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { sanitizeAmountInput, formatDatePickerDate } from '@/utils/transaction';
import { type SubscriptionCycle } from '@/utils/subscription';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedSegment from '@/components/ui/animated-segment';

export default function AddSubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const {
    accounts,
    addSubscription,
    updateSubscription,
    getSortedCategories,
    subscriptions,
    userProfile,
  } = useApp();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { colorScheme } = useColorScheme();
  const placeholderColor =
    colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState<SubscriptionCycle>('monthly');
  const [selectedWalletId, setSelectedWalletId] = useState(
    accounts.find((a) => a.isDefault)?.id || (accounts[0]?.id ?? '')
  );

  // Re-sync wallet selection if accounts load after mount or previous selection becomes stale
  useEffect(() => {
    if (selectedWalletId && accounts.some((a) => a.id === selectedWalletId)) return;
    const fallback = (accounts.find((a) => a.isDefault)?.id || accounts[0]?.id) ?? '';
    if (fallback) setSelectedWalletId(fallback);
  }, [accounts, selectedWalletId]);
  const [category, setCategory] = useState('Subscriptions');
  const [isActive, setIsActive] = useState(true);

  // Date states
  const [nextDate, setNextDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState(new Date());
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [endCalendarMonth, setEndCalendarMonth] = useState(new Date());

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    if (editId) {
      const sub = subscriptions.find((s) => s.id === editId);
      if (sub) {
        setName(sub.name);
        setAmount(sub.amount.toString());
        setCycle(sub.cycle);
        setCategory(sub.category);
        setSelectedWalletId(sub.wallet_id);
        setNextDate(new Date(sub.next_billing_date));
        setCalendarMonth(new Date(sub.next_billing_date));
        setIsActive(sub.is_active === 1);
        if (sub.end_date) {
          setHasEndDate(true);
          setEndDate(new Date(sub.end_date));
          setEndCalendarMonth(new Date(sub.end_date));
        } else {
          setHasEndDate(false);
        }
      }
    }
  }, [editId]);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/subscriptions');
    }
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Name',
        text2: 'Please enter a subscription name',
      });
      return;
    }
    if (isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) {
      Toast.show({ type: 'error', text1: 'Invalid Amount', text2: 'Please enter a valid amount' });
      return;
    }
    if (!selectedWalletId) {
      Toast.show({ type: 'error', text1: 'Wallet Required', text2: 'Please select a wallet' });
      return;
    }

    if (hasEndDate && endDate < nextDate) {
      Toast.show({
        type: 'error',
        text1: 'Invalid End Date',
        text2: 'End date must be after next billing date',
      });
      return;
    }

    if (editId) {
      const sub = subscriptions.find((s) => s.id === editId);
      if (sub) {
        await updateSubscription({
          ...sub,
          name: name.trim(),
          amount: parsedAmount,
          cycle,
          category,
          wallet_id: selectedWalletId,
          next_billing_date: nextDate.toISOString(),
          is_active: isActive ? 1 : 0,
          end_date: hasEndDate ? endDate.toISOString() : null,
        });
      }
    } else {
      await addSubscription({
        name: name.trim(),
        amount: parsedAmount,
        cycle,
        category,
        wallet_id: selectedWalletId,
        next_billing_date: nextDate.toISOString(),
        is_active: isActive ? 1 : 0,
        end_date: hasEndDate ? endDate.toISOString() : null,
      });
    }

    Toast.show({
      type: 'success',
      text1: editId ? 'Subscription Updated' : 'Subscription Added',
      text2: editId
        ? 'Subscription details saved successfully.'
        : `Successfully added ${name.trim()} subscription!`,
    });

    handleClose();
  };

  const categoriesList = getSortedCategories('expense');

  return (
    <View className="flex-1 bg-transparent">
      <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/50 dark:bg-black/70">
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={handleClose}
          />

          <View className="rounded-t-[32px] bg-background p-6 pb-12" style={{ maxHeight: '90%' }}>
            {/* Header */}
            <View className="mb-6 flex-row items-center justify-between">
              <Text variant="h2">{editId ? 'Edit Subscription' : 'Add Subscription'}</Text>
              <TouchableOpacity onPress={handleClose} className="rounded-full bg-secondary p-2">
                <Icon as={X} size={20} className="text-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View className="gap-5">
                {/* Name Input */}
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Subscription Name</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    className={`rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base text-foreground dark:bg-gray-900 ${focusedInput === 'name' ? 'border-primary' : 'border-transparent'}`}
                    placeholder="Netflix, Spotify, Gym, etc."
                    placeholderTextColor={placeholderColor}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>

                {/* Amount Input */}
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Amount</Text>
                  <View className="relative justify-center">
                    <Text className="absolute left-5 z-10 text-base font-semibold text-foreground">
                      {userProfile.currencySymbol}
                    </Text>
                    <TextInput
                      value={amount}
                      onChangeText={(text) => setAmount(sanitizeAmountInput(text))}
                      className={`rounded-full border-2 bg-gray-50 py-3.5 pl-10 pr-5 text-base font-semibold text-foreground dark:bg-gray-900 ${focusedInput === 'amount' ? 'border-primary' : 'border-transparent'}`}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      placeholderTextColor={placeholderColor}
                      onFocus={() => setFocusedInput('amount')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                </View>

                {/* Cycle Selector */}
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Billing Cycle</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setCycle(c)}
                        className={`min-w-[70px] flex-1 items-center justify-center rounded-full border px-2 py-2.5 ${cycle === c ? 'border-primary bg-primary' : 'border-gray-200 bg-transparent dark:border-gray-800'}`}>
                        <Text
                          className={`text-xs font-semibold capitalize ${cycle === c ? 'text-white dark:text-black' : 'text-foreground'}`}>
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Active Toggle */}
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Status</Text>
                  <AnimatedSegment<'active' | 'paused'>
                    options={[
                      { label: 'Active', value: 'active' },
                      { label: 'Paused', value: 'paused' },
                    ]}
                    selectedValue={isActive ? 'active' : 'paused'}
                    onChange={(val) => setIsActive(val === 'active')}
                  />
                  <Text className="mt-2 text-center text-xs text-muted">
                    {isActive ? 'Auto-billing is enabled.' : 'Auto-billing is paused.'}
                  </Text>
                </View>

                {/* Wallet Selector */}
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Select Wallet for Auto-Pay</Text>
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

                {/* Quick Date Selector */}
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Next Billing Date</Text>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setNextDate(new Date())}
                      className={`flex-1 items-center rounded-full border py-2.5 ${nextDate.toDateString() === new Date().toDateString() ? 'border-primary bg-primary' : 'border-gray-200 bg-transparent dark:border-gray-800'}`}>
                      <Text
                        className={`text-xs font-semibold ${nextDate.toDateString() === new Date().toDateString() ? 'text-white dark:text-black' : 'text-foreground'}`}>
                        Today
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setCalendarMonth(new Date(nextDate));
                        setIsDatePickerOpen(true);
                      }}
                      className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-full border px-3 py-2.5 ${nextDate.toDateString() !== new Date().toDateString() ? 'border-primary bg-primary' : 'border-gray-200 bg-transparent dark:border-gray-800'}`}>
                      <Icon
                        as={Calendar}
                        size={12}
                        className={
                          nextDate.toDateString() !== new Date().toDateString()
                            ? 'text-white dark:text-black'
                            : 'text-foreground'
                        }
                      />
                      <Text
                        className={`text-xs font-semibold ${nextDate.toDateString() !== new Date().toDateString() ? 'text-white dark:text-black' : 'text-foreground'}`}
                        numberOfLines={1}>
                        {formatDatePickerDate(nextDate)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* End Date Selector */}
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Expiration Date</Text>
                  <AnimatedSegment<'never' | 'set'>
                    options={[
                      { label: 'Never Expires', value: 'never' },
                      { label: 'Set End Date', value: 'set' },
                    ]}
                    selectedValue={hasEndDate ? 'set' : 'never'}
                    onChange={(val) => {
                      const isSet = val === 'set';
                      setHasEndDate(isSet);
                      if (isSet && endDate < nextDate) {
                        const d = new Date(nextDate);
                        d.setMonth(d.getMonth() + 1);
                        setEndDate(d);
                      }
                    }}
                  />
                  {hasEndDate && (
                    <View className="mt-4 flex-row justify-center">
                      <TouchableOpacity
                        onPress={() => setIsEndDatePickerOpen(true)}
                        className="bg-primary/10 flex-row items-center gap-1.5 rounded-full border border-primary px-5 py-2.5">
                        <Icon as={Calendar} size={14} className="text-primary" />
                        <Text className="text-sm font-semibold text-primary">
                          {formatDatePickerDate(endDate)}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleSave}
                  disabled={
                    !amount.trim() ||
                    isNaN(parseFloat(amount)) ||
                    parseFloat(amount) === 0 ||
                    !name.trim()
                  }
                  className={`mt-8 items-center justify-center rounded-full bg-primary py-3.5 ${!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) === 0 || !name.trim() ? 'opacity-40' : 'opacity-100'}`}
                  activeOpacity={0.7}>
                  <Text className="text-base font-medium text-white dark:text-black">
                    {editId ? 'Save Changes' : 'Save Subscription'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={{ height: insets.bottom }} />
          </View>
        </KeyboardAvoidingView>

      <TransactionDatePickerModal
        visible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        date={nextDate}
        onSelectDate={setNextDate}
        calendarMonth={calendarMonth}
        onNavigateMonth={(direction) => {
          const newMonth = new Date(calendarMonth);
          newMonth.setMonth(calendarMonth.getMonth() + (direction === 'next' ? 1 : -1));
          setCalendarMonth(newMonth);
        }}
      />

      <TransactionDatePickerModal
        visible={isEndDatePickerOpen}
        onClose={() => setIsEndDatePickerOpen(false)}
        date={endDate}
        onSelectDate={setEndDate}
        calendarMonth={endCalendarMonth}
        onNavigateMonth={(direction) => {
          const newMonth = new Date(endCalendarMonth);
          newMonth.setMonth(endCalendarMonth.getMonth() + (direction === 'next' ? 1 : -1));
          setEndCalendarMonth(newMonth);
        }}
      />
    </View>
  );
}
