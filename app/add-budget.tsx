import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  BackHandler,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, Trash2, Check, Delete, Info, Calendar } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { getCategoryColor, getCategoryIcon, formatDatePickerDate } from '@/utils/transaction';
import Toast from 'react-native-toast-message';
import { router, useLocalSearchParams } from 'expo-router';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedSegment from '@/components/ui/animated-segment';
import TransactionDatePickerModal from '@/components/transactions/TransactionDatePickerModal';
import { ScreenTransition } from '@/components/ui/ScreenTransition';
import { triggerKeypadHaptic, triggerSuccessHaptic } from '@/utils/haptics';

export default function AddBudgetScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const { budgets, addBudget, updateBudget, deleteBudget, getSortedCategories, userProfile } =
    useApp();
  const { editId } = useLocalSearchParams<{ editId?: string }>();

  const [selectedCategory, setSelectedCategory] = useState<string>(
    () => getSortedCategories('expense')[0]?.name || ''
  );
  const [amount, setAmount] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Budget lifetime: starting date & ending date (or infinity)
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [startDate, setStartDate] = useState<Date>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isInfinity, setIsInfinity] = useState<boolean>(true);

  // Date picker modal state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(firstDayOfMonth);

  const categoryScrollRef = useRef<ScrollView>(null);
  const expenseCategories = getSortedCategories('expense');

  useEffect(() => {
    if (!editId) return;
    const budget = budgets.find((b) => b.id === editId);
    if (budget) {
      setSelectedCategory(budget.category);
      setAmount(budget.amount.toString());

      if (budget.start_date) {
        const parts = budget.start_date.split('-');
        if (parts.length === 3) {
          setStartDate(new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
        } else {
          setStartDate(new Date(budget.start_date));
        }
      }

      if (budget.end_date) {
        const parts = budget.end_date.split('-');
        if (parts.length === 3) {
          setEndDate(new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
        } else {
          setEndDate(new Date(budget.end_date));
        }
        setIsInfinity(false);
      } else {
        setEndDate(null);
        setIsInfinity(true);
      }
    }
  }, [editId, budgets]);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/budgets');
    }
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, []);

  // Auto-scroll category scrollview to selected category
  useEffect(() => {
    const catIndex = expenseCategories.findIndex((c) => c.name === selectedCategory);
    if (catIndex !== -1 && categoryScrollRef.current) {
      const offset = Math.max(0, catIndex * 85 - 120);
      setTimeout(() => {
        categoryScrollRef.current?.scrollTo({ x: offset, animated: true });
      }, 60);
    }
  }, [selectedCategory, expenseCategories]);

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

  const handleSave = () => {
    triggerSuccessHaptic();
    if (savingRef.current) return;

    const parsedAmount = parseFloat(amount.replace(/[^0-9.-]/g, ''));
    if (
      !amount.trim() ||
      isNaN(parsedAmount) ||
      !isFinite(parsedAmount) ||
      parsedAmount === 0
    ) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid budget amount',
      });
      return;
    }
    if (!selectedCategory) {
      Toast.show({
        type: 'error',
        text1: 'Category Required',
        text2: 'Please select a category for this budget',
      });
      return;
    }

    if (!editId) {
      const existing = budgets.find((b) => b.category === selectedCategory);
      if (existing) {
        Toast.show({
          type: 'error',
          text1: 'Duplicate Budget',
          text2: `A budget for "${selectedCategory}" already exists`,
        });
        return;
      }
    } else {
      // When editing, prevent switching to a category that already has a different budget
      const existing = budgets.find((b) => b.category === selectedCategory && b.id !== editId);
      if (existing) {
        Toast.show({
          type: 'error',
          text1: 'Duplicate Budget',
          text2: `A budget for "${selectedCategory}" already exists`,
        });
        return;
      }
    }

    if (!isInfinity && endDate && endDate < startDate) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Date Range',
        text2: 'Ending date cannot be before starting date',
      });
      return;
    }

    const fmtDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    savingRef.current = true;
    try {
      const budgetData = {
        category: selectedCategory,
        amount: Number(amount),
        start_date: fmtDate(startDate),
        end_date: isInfinity || !endDate ? null : fmtDate(endDate),
      };

      if (editId) {
        updateBudget({ id: editId, ...budgetData });
        Toast.show({
          type: 'success',
          text1: 'Budget Updated',
          text2: 'Your budget has been updated successfully',
        });
      } else {
        addBudget(budgetData);
        Toast.show({
          type: 'success',
          text1: 'Budget Created',
          text2: 'Your budget has been created successfully',
        });
      }

      handleClose();
    } finally {
      savingRef.current = false;
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (editId) {
      deleteBudget(editId);
      Toast.show({
        type: 'success',
        text1: 'Budget Deleted',
        text2: 'Your budget has been removed',
      });
      setShowDeleteConfirm(false);
      handleClose();
    }
  };

  const handleSelectDate = (d: Date) => {
    if (pickerTarget === 'start') {
      setStartDate(d);
      if (!isInfinity && endDate && endDate < d) {
        setEndDate(d);
      }
    } else if (pickerTarget === 'end') {
      if (d < startDate) {
        setStartDate(d);
      }
      setEndDate(d);
    }
    setIsDatePickerOpen(false);
    setPickerTarget(null);
  };

  return (
    <ScreenTransition
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top + 16,
        paddingBottom: Math.max(insets.bottom, 16),
      }}>
      {/* ── Top Bar: Close (Left), Heading (Center), Delete / Spacer (Right) ── */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-1">
        <TouchableOpacity
          onPress={handleClose}
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-xs active:scale-95"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon as={X} size={18} className="text-foreground" />
        </TouchableOpacity>

        <Text className="text-xl font-semibold text-foreground">
          {editId ? 'Edit Budget' : 'New Budget'}
        </Text>

        {editId ? (
          <TouchableOpacity
            onPress={handleDelete}
            className="h-11 w-11 items-center justify-center rounded-full border border-red-200 bg-red-50 shadow-xs active:scale-95 dark:border-red-900/40 dark:bg-red-950/20"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon as={Trash2} size={18} className="text-red-500" />
          </TouchableOpacity>
        ) : (
          <View className="h-11 w-11" />
        )}
      </View>

      {/* ── Budget Duration: Ongoing (Infinity) vs Custom Period ── */}
      <View className="items-center justify-center px-5 pt-1.5 pb-1">
        <View className="w-full max-w-[270px]">
          <AnimatedSegment<'infinity' | 'range'>
            options={[
              { label: 'ongoing (∞)', value: 'infinity' },
              { label: 'fixed period', value: 'range' },
            ]}
            selectedValue={isInfinity ? 'infinity' : 'range'}
            onChange={(val) => {
              const inf = val === 'infinity';
              setIsInfinity(inf);
              if (!inf && !endDate) {
                const d = new Date(startDate);
                d.setMonth(d.getMonth() + 1);
                d.setDate(0);
                setEndDate(d);
              }
            }}
            paddingVertical={6}
            fontSize={12}
          />
        </View>

        {/* Clickable Date Selector Pills */}
        <View className="mt-2 flex-row items-center gap-2">
          {/* Start Date Pill */}
          <TouchableOpacity
            onPress={() => {
              setPickerTarget('start');
              setCalendarMonth(startDate);
              setIsDatePickerOpen(true);
            }}
            style={{ outline: 'none' } as any}
            className="flex-row items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 active:scale-95 focus:outline-none">
            <Icon as={Calendar} size={12} className="text-muted" />
            <Text className="text-xs font-semibold text-foreground">
              From {formatDatePickerDate(startDate, true)}
            </Text>
          </TouchableOpacity>

          {/* End Date Pill */}
          {isInfinity ? (
            <View className="flex-row items-center gap-1.5 rounded-full border border-border bg-surface/50 px-3 py-1.5">
              <Text className="text-xs font-medium text-muted">
                To Infinity (∞)
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setPickerTarget('end');
                setCalendarMonth(endDate ?? startDate);
                setIsDatePickerOpen(true);
              }}
              style={{ outline: 'none' } as any}
              className="flex-row items-center gap-1.5 rounded-full border border-black dark:border-white bg-surface px-3 py-1.5 active:scale-95 focus:outline-none">
              <Icon as={Calendar} size={12} className="text-foreground" />
              <Text className="text-xs font-semibold text-foreground">
                To {formatDatePickerDate(endDate ?? startDate, true)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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

      {/* ── Scrollable Interactive Category Pills ── */}
      <View className="gap-2.5 pb-3 pt-1">
        <View className="px-5">
          <Text className="mb-1 text-[11px] font-medium text-muted">Category</Text>
          <ScrollView
            ref={categoryScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 8,
              alignItems: 'center',
            }}>
            {expenseCategories.map((cat, idx) => {
              const isSelected = selectedCategory === cat.name;
              const catIcon = 'icon' in cat ? cat.icon : undefined;
              const catColor = 'color' in cat ? cat.color : undefined;
              const IconComp = getCategoryIcon(cat.name, undefined, catIcon);
              const color = getCategoryColor(cat.name, catColor);
              return (
                <TouchableOpacity
                  key={`${cat.name}-${idx}`}
                  onPress={() => setSelectedCategory(cat.name)}
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
      </View>

      {/* ── Keypad Section: 3x4 Grid of Circular Buttons with Solid Black Checkmark ── */}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Budget"
        message={`Are you sure you want to delete the budget for ${selectedCategory}?`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Date Picker Modal */}
      <TransactionDatePickerModal
        visible={isDatePickerOpen}
        onClose={() => {
          setIsDatePickerOpen(false);
          setPickerTarget(null);
        }}
        date={pickerTarget === 'start' ? startDate : (endDate ?? startDate)}
        calendarMonth={calendarMonth}
        onNavigateMonth={(dir) => {
          setCalendarMonth((prev) => {
            const next = new Date(prev);
            next.setMonth(prev.getMonth() + (dir === 'next' ? 1 : -1));
            return next;
          });
        }}
        onChangeMonth={setCalendarMonth}
        onSelectDate={handleSelectDate}
      />
    </ScreenTransition>
  );
}