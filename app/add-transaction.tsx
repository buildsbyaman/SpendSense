import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import {
  X,
  Calendar,
  Check,
  Delete,
  Wallet,
} from 'lucide-react-native';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatNumber } from '@/utils/wallet';
import {
  type TransactionType,
  validateTransaction,
  TRANSFER_CATEGORY,
  getCategoryIcon,
  getCategoryColor,
} from '@/utils/transaction';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';
import { usePrefillTransactionForm } from '@/components/transactions/usePrefillTransactionForm';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkBudgetWarning } from '@/hooks/useBudgetWarning';
import AnimatedSegment from '@/components/ui/animated-segment';
import { ScreenTransition } from '@/components/ui/ScreenTransition';
import { triggerKeypadHaptic, triggerSuccessHaptic } from '@/utils/haptics';

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

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
  } = useApp();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { colorScheme } = useColorScheme();
  const placeholderColor =
    colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const defaultWalletId =
    getSortedAccounts().find((a) => a.isDefault)?.id || (getSortedAccounts()[0]?.id ?? '');
  const [selectedWalletId, setSelectedWalletId] = useState(defaultWalletId);
  const [selectedToWalletId, setSelectedToWalletId] = useState(
    getSortedAccounts().find((a) => a.id !== defaultWalletId)?.id ?? ''
  );
  const [category, setCategory] = useState('Food');

  // Date states
  const [date, setDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Note modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  const dateScrollRef = useRef<ScrollView>(null);
  const categoryScrollRef = useRef<ScrollView>(null);
  const walletScrollRef = useRef<ScrollView>(null);

  usePrefillTransactionForm(editId, transactions, {
    setType,
    setAmount,
    setTitle,
    setCategory,
    setSelectedWalletId,
    setSelectedToWalletId,
    setDate,
    setCalendarMonth,
  });

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, []);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(
      newType === 'transfer' ? TRANSFER_CATEGORY : newType === 'expense' ? 'Food' : 'Salary'
    );
  };

  const handleFromWalletChange = (id: string) => {
    setSelectedWalletId(id);
    if (id === selectedToWalletId) {
      const next = getSortedAccounts().find((a) => a.id !== id);
      setSelectedToWalletId(next?.id ?? '');
    }
  };

  const handleToWalletChange = (id: string) => {
    setSelectedToWalletId(id);
    if (id === selectedWalletId) {
      const next = getSortedAccounts().find((a) => a.id !== id);
      setSelectedWalletId(next?.id ?? '');
    }
  };

  // Rolling strip of dates around the current date
  const stripDates = useMemo(() => {
    const dates: Date[] = [];
    const base = new Date();
    for (let i = -14; i <= 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      dates.push(d);
    }
    const hasSelected = dates.some((d) => isSameDay(d, date));
    if (!hasSelected) {
      dates.push(new Date(date));
      dates.sort((a, b) => a.getTime() - b.getTime());
    }
    return dates;
  }, [date]);

  useEffect(() => {
    const selectedIndex = stripDates.findIndex((d) => isSameDay(d, date));
    if (selectedIndex !== -1 && dateScrollRef.current) {
      const offset = Math.max(0, selectedIndex * 60 - 140);
      setTimeout(() => {
        dateScrollRef.current?.scrollTo({ x: offset, animated: true });
      }, 80);
    }
  }, [date, stripDates]);

  const categoriesList = type === 'transfer' ? [] : getSortedCategories(type);
  const toAccounts = getSortedAccounts().filter((a) => a.id !== selectedWalletId);

  // Auto-scroll category scrollview to selected category
  useEffect(() => {
    const catIndex = categoriesList.findIndex((c) => c.name === category);
    if (catIndex !== -1 && categoryScrollRef.current) {
      const offset = Math.max(0, catIndex * 85 - 120);
      setTimeout(() => {
        categoryScrollRef.current?.scrollTo({ x: offset, animated: true });
      }, 50);
    }
  }, [category, categoriesList]);

  // Auto-scroll wallet scrollview to selected wallet
  useEffect(() => {
    const walletIndex = getSortedAccounts().findIndex((w) => w.id === selectedWalletId);
    if (walletIndex !== -1 && walletScrollRef.current) {
      const offset = Math.max(0, walletIndex * 100 - 120);
      setTimeout(() => {
        walletScrollRef.current?.scrollTo({ x: offset, animated: true });
      }, 50);
    }
  }, [selectedWalletId]);

  // Keypad logic
  const handleToggleNegative = () => {
    triggerKeypadHaptic();
    if (amount.startsWith('-')) {
      setAmount(amount.slice(1));
    } else {
      setAmount('-' + amount);
    }
  };

  const handleKeyPress = (key: string) => {
    triggerKeypadHaptic();
    if (key === '.') {
      if (amount.includes('.')) return;
      if (!amount || amount === '-') {
        setAmount(amount ? '-0.' : '0.');
      } else {
        setAmount(amount + '.');
      }
      return;
    }

    if (amount === '0') {
      if (key === '0') return;
      setAmount(key);
      return;
    }

    if (amount === '-0' || amount === '-') {
      if (key === '0') {
        setAmount('-0');
        return;
      }
      setAmount('-' + key);
      return;
    }

    // Limit to 2 decimal places
    if (amount.includes('.')) {
      const parts = amount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
    }

    // Limit max digits
    if (amount.replace(/[^0-9]/g, '').length >= 9) return;

    setAmount((prev) => prev + key);
  };

  const handleBackspace = () => {
    triggerKeypadHaptic();
    if (!amount || amount.length <= 1 || amount === '-') {
      setAmount('');
    } else {
      const next = amount.slice(0, -1);
      if (next === '-') {
        setAmount('');
      } else {
        setAmount(next);
      }
    }
  };

  const handleClear = () => {
    triggerKeypadHaptic();
    setAmount('');
  };

  const savingRef = useRef(false);

  const handleSave = async () => {
    triggerSuccessHaptic();
    if (savingRef.current) return;

    const { isValid, errorTitle, errorMessage, parsedAmount } = validateTransaction(
      amount,
      selectedWalletId,
      type,
      selectedToWalletId
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
      try {
        if (editId) {
          const tx = transactions.find((t) => t.id === editId);
          if (tx) {
            await updateTransaction({
              ...tx,
              title: title.trim() || category,
              amount: parsedAmount!,
              type,
              category,
              date: date.toISOString(),
              walletId: selectedWalletId,
              toWalletId: type === 'transfer' ? selectedToWalletId : undefined,
            });
          }
        } else {
          await addTransaction({
            title: title.trim() || category,
            amount: parsedAmount!,
            type,
            category,
            date: date.toISOString(),
            walletId: selectedWalletId,
            toWalletId: type === 'transfer' ? selectedToWalletId : undefined,
          });
        }
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Save Failed',
          text2: 'Your transaction could not be saved. Please try again.',
        });
        return;
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
            : type === 'transfer'
              ? 'Transfer completed successfully!'
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

  return (
    <ScreenTransition
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top + 16,
        paddingBottom: Math.max(insets.bottom, 16),
      }}>
      {/* ── Top Bar: Close (Left), Heading (Center), Calendar (Right) ── */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-1">
        <TouchableOpacity
          onPress={handleClose}
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-xs active:scale-95"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon as={X} size={18} className="text-foreground" />
        </TouchableOpacity>

        <Text className="text-xl font-semibold text-foreground">
          {editId ? 'Edit Transaction' : 'Add Transaction'}
        </Text>

        <TouchableOpacity
          onPress={() => {
            setCalendarMonth(new Date(date));
            setIsDatePickerOpen(true);
          }}
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-xs active:scale-95"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon as={Calendar} size={18} className="text-foreground" />
        </TouchableOpacity>
      </View>

      {/* ── Payment Type Segmented Capsule (Spacious & Centered) ── */}
      <View className="items-center justify-center px-5 pt-0.5 pb-1.5">
        <View className="w-full max-w-[280px]">
          <AnimatedSegment<TransactionType>
            options={[
              { label: 'expenses', value: 'expense' },
              { label: 'income', value: 'income' },
              { label: 'transfer', value: 'transfer' },
            ]}
            selectedValue={type}
            onChange={handleTypeChange}
            paddingVertical={6}
            fontSize={12}
          />
        </View>
      </View>

      {/* ── Date Strip (Horizontal Scroll) ── */}
      <View className="mt-2 py-1">
        <ScrollView
          ref={dateScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 3,
            gap: 10,
            alignItems: 'center',
          }}>
          {stripDates.map((d) => {
            const isSelected = isSameDay(d, date);
            const dayNum = d.getDate();
            const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
            return (
              <TouchableOpacity
                key={d.toISOString()}
                onPress={() => setDate(d)}
                className={`items-center justify-center ${
                  isSelected
                    ? 'min-w-[50px] rounded-2xl bg-black px-3.5 py-2 dark:bg-white'
                    : 'min-w-[44px] px-2.5 py-1.5'
                }`}>
                <Text
                  className={`text-base font-bold ${
                    isSelected ? 'text-white dark:text-black' : 'text-foreground'
                  }`}>
                  {dayNum}
                </Text>
                <Text
                  className={`text-[11px] font-medium lowercase ${
                    isSelected ? 'text-white/80 dark:text-black/80' : 'text-muted'
                  }`}>
                  {weekday}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Center Amount Display (Zero Overlap, Mathematically Centered) ── */}
      <View className="flex-1 items-center justify-center px-4">
        <View className="w-full flex-row items-center justify-center">
          {/* Symmetrical Left Container with ± (Negative Toggle) Button */}
          <View className="h-11 w-11 items-center justify-center">
            <TouchableOpacity
              onPress={handleToggleNegative}
              activeOpacity={0.7}
              className={`h-10 w-10 items-center justify-center rounded-full border active:scale-90 ${
                amount.startsWith('-')
                  ? 'border-black bg-surface dark:border-white'
                  : 'border-border bg-surface/60'
              }`}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text
                className={`text-base font-semibold ${
                  amount.startsWith('-') ? 'font-bold text-foreground' : 'text-muted'
                }`}>
                ±
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Text constrained within flex-1 so it can never collide or overlap */}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            className={`flex-1 text-center font-bold tracking-tight ${
              amount.replace('-', '') ? 'text-foreground' : 'text-muted/60'
            }`}
            style={{
              fontSize:
                amount.replace('-', '').length > 6 ? 40 : amount.replace('-', '').length > 4 ? 48 : 56,
              lineHeight:
                amount.replace('-', '').length > 6 ? 48 : amount.replace('-', '').length > 4 ? 56 : 64,
            }}>
            {amount.startsWith('-') ? '-' : ''}
            {userProfile.currencySymbol}
            {amount.replace('-', '') || '0'}
          </Text>

          {/* Right Backspace Container */}
          <View className="h-11 w-11 items-center justify-center">
            {amount.length > 0 && (
              <TouchableOpacity
                onPress={handleBackspace}
                onLongPress={handleClear}
                className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface active:scale-90"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Icon as={Delete} size={18} className="text-foreground" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── Scrollable Interactive Pills Section (No Solid Black Fill, Direct Touch) ── */}
      <View className="gap-2.5 pb-3 pt-1">
        {type !== 'transfer' ? (
          <>
            {/* 1. Category Scrollable Pills */}
            <View>
              <ScrollView
                ref={categoryScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingVertical: 3,
                  gap: 8,
                  alignItems: 'center',
                }}>
                {categoriesList.map((cat, idx) => {
                  const isSelected = category === cat.name;
                  const catIcon = 'icon' in cat ? cat.icon : undefined;
                  const catColor = 'color' in cat ? cat.color : undefined;
                  const IconComp = getCategoryIcon(cat.name, undefined, catIcon);
                  const color = getCategoryColor(cat.name, catColor);
                  return (
                    <TouchableOpacity
                      key={`${cat.name}-${idx}`}
                      onPress={() => setCategory(cat.name)}
                      activeOpacity={0.7}
                      className={`h-9 flex-row items-center gap-1.5 rounded-full border px-3 ${
                        isSelected
                          ? 'border-black bg-surface dark:border-white'
                          : 'border-border bg-surface/60'
                      }`}>
                      <View
                        className="h-5 w-5 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${color}18` }}>
                        <Icon as={IconComp} size={11} color={color} />
                      </View>
                      <Text
                        className={`text-xs ${
                          isSelected
                            ? 'font-bold text-foreground'
                            : 'font-medium text-muted'
                        }`}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. Wallet Scrollable Pills */}
            <View>
              <ScrollView
                ref={walletScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingVertical: 3,
                  gap: 8,
                  alignItems: 'center',
                }}>
                {getSortedAccounts().map((wallet) => {
                  const isSelected = selectedWalletId === wallet.id;
                  return (
                    <TouchableOpacity
                      key={wallet.id}
                      onPress={() => setSelectedWalletId(wallet.id)}
                      activeOpacity={0.7}
                      className={`h-9 flex-row items-center gap-1.5 rounded-full border px-3 ${
                        isSelected
                          ? 'border-black bg-surface dark:border-white'
                          : 'border-border bg-surface/60'
                      }`}>
                      <Icon
                        as={wallet.icon || Wallet}
                        size={13}
                        className={isSelected ? 'text-foreground' : 'text-muted'}
                      />
                      <Text
                        className={`text-xs ${
                          isSelected
                            ? 'font-bold text-foreground'
                            : 'font-medium text-muted'
                        }`}>
                        {wallet.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 3. Note Pill (Outline capsule, not filled with black) */}
            <View className="flex-row items-center justify-center">
              <TouchableOpacity
                onPress={() => {
                  setNoteInput(title);
                  setIsNoteModalOpen(true);
                }}
                activeOpacity={0.7}
                className={`h-8 flex-row items-center gap-1.5 rounded-full border px-3.5 ${
                  title.trim()
                    ? 'border-black bg-surface dark:border-white'
                    : 'border-border bg-surface/60'
                }`}>
                <Text
                  className={`text-xs ${
                    title.trim() ? 'font-bold text-foreground' : 'font-medium text-muted'
                  }`}
                  numberOfLines={1}>
                  {title.trim() ? title : 'add note'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* From Wallet Row */}
            <View className="px-5">
              <Text className="mb-1 text-[11px] font-medium text-muted">From</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, alignItems: 'center', paddingVertical: 3 }}>
                {getSortedAccounts().map((wallet) => {
                  const isSelected = selectedWalletId === wallet.id;
                  return (
                    <TouchableOpacity
                      key={`from-${wallet.id}`}
                      onPress={() => handleFromWalletChange(wallet.id)}
                      activeOpacity={0.7}
                      className={`h-9 flex-row items-center gap-1.5 rounded-full border px-3 ${
                        isSelected
                          ? 'border-black bg-surface dark:border-white'
                          : 'border-border bg-surface/60'
                      }`}>
                      <Icon
                        as={wallet.icon || Wallet}
                        size={13}
                        className={isSelected ? 'text-foreground' : 'text-muted'}
                      />
                      <Text
                        className={`text-xs ${
                          isSelected
                            ? 'font-bold text-foreground'
                            : 'font-medium text-muted'
                        }`}>
                        {wallet.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* To Wallet Row */}
            <View className="px-5">
              <Text className="mb-1 text-[11px] font-medium text-muted">To</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, alignItems: 'center', paddingVertical: 3 }}>
                {toAccounts.map((wallet) => {
                  const isSelected = selectedToWalletId === wallet.id;
                  return (
                    <TouchableOpacity
                      key={`to-${wallet.id}`}
                      onPress={() => handleToWalletChange(wallet.id)}
                      activeOpacity={0.7}
                      className={`h-9 flex-row items-center gap-1.5 rounded-full border px-3 ${
                        isSelected
                          ? 'border-black bg-surface dark:border-white'
                          : 'border-border bg-surface/60'
                      }`}>
                      <Icon
                        as={wallet.icon || Wallet}
                        size={13}
                        className={isSelected ? 'text-foreground' : 'text-muted'}
                      />
                      <Text
                        className={`text-xs ${
                          isSelected
                            ? 'font-bold text-foreground'
                            : 'font-medium text-muted'
                        }`}>
                        {wallet.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Note Pill */}
            <View className="flex-row items-center justify-center">
              <TouchableOpacity
                onPress={() => {
                  setNoteInput(title);
                  setIsNoteModalOpen(true);
                }}
                activeOpacity={0.7}
                className={`h-8 flex-row items-center gap-1.5 rounded-full border px-3.5 ${
                  title.trim()
                    ? 'border-black bg-surface dark:border-white'
                    : 'border-border bg-surface/60'
                }`}>
                <Text
                  className={`text-xs ${
                    title.trim() ? 'font-bold text-foreground' : 'font-medium text-muted'
                  }`}
                  numberOfLines={1}>
                  {title.trim() ? title : 'add note'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ── Keypad Section: 3x4 Grid of Circular Buttons ── */}
      <View className="px-7 pb-2">
        <View className="gap-3">
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['.', '0', 'confirm'],
          ].map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row items-center justify-around">
              {row.map((item) => {
                if (item === 'confirm') {
                  return (
                    <View
                      key="confirm"
                      className="h-[68px] w-[68px] items-center justify-center">
                      <TouchableOpacity
                        onPress={handleSave}
                        activeOpacity={0.7}
                        className="h-[56px] w-[56px] items-center justify-center rounded-full bg-black active:scale-95 active:opacity-80 dark:bg-white"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Icon
                          as={Check}
                          size={22}
                          strokeWidth={2.4}
                          color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                }
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => handleKeyPress(item)}
                    activeOpacity={0.7}
                    className="h-[68px] w-[68px] items-center justify-center rounded-full bg-[#F3F3F4] dark:bg-[#1E1E1E] active:scale-95 active:bg-[#E5E5EA] dark:active:bg-[#2C2C2E]">
                    <Text
                      className={`${item === '.' ? 'text-3xl font-bold -mt-2' : 'text-2xl font-normal'} text-foreground`}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* ── Note / Description Input Modal ── */}
      <Modal
        visible={isNoteModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsNoteModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-center bg-black/60 px-6">
          <View className="rounded-2xl border border-border bg-background p-5">
            <Text className="mb-3 text-base font-bold text-foreground">
              What was this for?
            </Text>
            <TextInput
              value={noteInput}
              onChangeText={setNoteInput}
              autoFocus
              placeholder="e.g. Burger King, Starbucks, Groceries"
              placeholderTextColor={placeholderColor}
              className="h-11 rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground"
            />
            <View className="mt-4 flex-row justify-end gap-2.5">
              <TouchableOpacity
                onPress={() => {
                  setTitle('');
                  setNoteInput('');
                  setIsNoteModalOpen(false);
                }}
                className="rounded-lg px-3.5 py-2">
                <Text className="text-xs font-medium text-muted">Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setTitle(noteInput.trim());
                  setIsNoteModalOpen(false);
                }}
                className="rounded-lg border border-black bg-surface px-4 py-2 dark:border-white">
                <Text className="text-xs font-semibold text-foreground">
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Custom Full Calendar Modal ── */}
      <TransactionDatePickerModal
        visible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        date={date}
        onSelectDate={setDate}
        calendarMonth={calendarMonth}
        onNavigateMonth={navigateMonth}
        onChangeMonth={setCalendarMonth}
      />
    </ScreenTransition>
  );
}