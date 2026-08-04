import { View, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { type SubscriptionCycle } from '@/utils/subscription';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';
import { usePrefillSubscriptionForm } from '@/components/subscriptions/usePrefillSubscriptionForm';
import { validateSubscriptionForm } from '@/lib/subscriptionForm';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlideSheet, type SlideSheetHandle } from '@/components/ui/slide-sheet';
import { SubscriptionFormFields } from '@/components/subscriptions/SubscriptionFormFields';

export default function AddSubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const {
    accounts,
    addSubscription,
    updateSubscription,
    getSortedCategories,
    getSortedAccounts,
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
    getSortedAccounts().find((a) => a.isDefault)?.id || (getSortedAccounts()[0]?.id ?? '')
  );

  // Re-sync wallet selection if accounts load after mount or previous selection becomes stale
  useEffect(() => {
    if (selectedWalletId && accounts.some((a) => a.id === selectedWalletId)) return;
    const fallback =
      (getSortedAccounts().find((a) => a.isDefault)?.id || getSortedAccounts()[0]?.id) ?? '';
    if (fallback) setSelectedWalletId(fallback);
  }, [accounts, getSortedAccounts, selectedWalletId]);
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
  const sheetRef = useRef<SlideSheetHandle>(null);

  usePrefillSubscriptionForm(editId, subscriptions, {
    setName,
    setAmount,
    setCycle,
    setCategory,
    setSelectedWalletId,
    setNextDate,
    setCalendarMonth,
    setIsActive,
    setHasEndDate,
    setEndDate,
    setEndCalendarMonth,
  });

  const handleNavigateBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/subscriptions');
    }
  };

  const handleClose = () => {
    sheetRef.current?.close();
  };

  const savingRef = useRef(false);

  const handleSave = async () => {
    if (savingRef.current) return;

    const parsedAmount = parseFloat(amount);
    const validation = validateSubscriptionForm({
      name,
      amount,
      selectedWalletId,
      hasEndDate,
      endDate,
      nextDate,
    });
    if (validation) {
      Toast.show({ type: 'error', ...validation });
      return;
    }

    savingRef.current = true;
    try {
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
    } finally {
      savingRef.current = false;
    }
  };

  const categoriesList = getSortedCategories('expense');

  return (
    <View className="flex-1 bg-transparent">
      <SlideSheet ref={sheetRef} onClosed={handleNavigateBack}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/50 dark:bg-black/70">
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
              <Text variant="h2">{editId ? 'Edit Subscription' : 'Add Subscription'}</Text>
              <TouchableOpacity onPress={handleClose} className="rounded-[6px] bg-secondary p-2.5">
                <Icon as={X} size={20} className="text-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
              <SubscriptionFormFields
                name={name}
                setName={setName}
                amount={amount}
                setAmount={setAmount}
                cycle={cycle}
                setCycle={setCycle}
                isActive={isActive}
                setIsActive={setIsActive}
                selectedWalletId={selectedWalletId}
                setSelectedWalletId={setSelectedWalletId}
                category={category}
                setCategory={setCategory}
                nextDate={nextDate}
                setNextDate={setNextDate}
                hasEndDate={hasEndDate}
                endDate={endDate}
                onChangeHasEndDate={setHasEndDate}
                onChangeEndDate={setEndDate}
                onOpenEndDatePicker={() => setIsEndDatePickerOpen(true)}
                onOpenDatePicker={() => {
                  setCalendarMonth(new Date(nextDate));
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
                  disabled={
                    !amount.trim() ||
                    isNaN(parseFloat(amount)) ||
                    parseFloat(amount) === 0 ||
                    !name.trim()
                  }
                  className={`mt-8 items-center justify-center rounded-[6px] bg-primary py-4 ${!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) === 0 || !name.trim() ? 'opacity-40' : 'opacity-100'}`}
                  activeOpacity={0.7}>
                  <Text className="text-base font-medium text-white dark:text-black">
                    {editId ? 'Save Changes' : 'Save Subscription'}
                  </Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={{ height: insets.bottom }} />
          </View>
        </KeyboardAvoidingView>
      </SlideSheet>

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
