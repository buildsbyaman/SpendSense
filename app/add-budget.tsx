import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, Trash2, Info } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { getCategoryColor, getCategoryIcon, sanitizeAmountInput } from '@/utils/transaction';
import Toast from 'react-native-toast-message';
import { router, useLocalSearchParams } from 'expo-router';
import { SlideSheet, type SlideSheetHandle } from '@/components/ui/slide-sheet';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';

export default function AddBudgetScreen() {
  const { colorScheme } = useColorScheme();
  const { budgets, addBudget, updateBudget, deleteBudget, getSortedCategories, userProfile } =
    useApp();
  const { editId } = useLocalSearchParams<{ editId?: string }>();

  const placeholderColor =
    colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;

  const [selectedCategory, setSelectedCategory] = useState<string>(
    () => getSortedCategories('expense')[0]?.name || ''
  );
  const [amount, setAmount] = useState<string>('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const sheetRef = useRef<SlideSheetHandle>(null);

  const expenseCategories = getSortedCategories('expense');

  useEffect(() => {
    setError('');
    if (!editId) return;
    const budget = budgets.find((b) => b.id === editId);
    if (budget) {
      setSelectedCategory(budget.category);
      setAmount(budget.amount.toString());
    }
  }, [editId, budgets]);

  const handleNavigateBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/budgets');
    }
  };

  const handleClose = () => {
    sheetRef.current?.close();
  };

  const savingRef = useRef(false);

  const handleSave = () => {
    if (savingRef.current) return;

    if (
      !amount.trim() ||
      isNaN(Number(amount)) ||
      !isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      setError('Please enter a valid amount');
      return;
    }
    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }

    if (!editId) {
      const existing = budgets.find((b) => b.category === selectedCategory);
      if (existing) {
        setError('A budget for this category already exists');
        return;
      }
    } else {
      // When editing, prevent switching to a category that already has a different budget
      const existing = budgets.find((b) => b.category === selectedCategory && b.id !== editId);
      if (existing) {
        setError('A budget for this category already exists');
        return;
      }
    }

    savingRef.current = true;
    try {
      const budgetData = {
        category: selectedCategory,
        amount: Number(amount),
      };

      if (editId) {
        updateBudget({ id: editId, ...budgetData });
        Toast.show({
          type: 'success',
          text1: 'Budget Updated',
          text2: 'Your budget has been updated',
        });
      } else {
        addBudget(budgetData);
        Toast.show({
          type: 'success',
          text1: 'Budget Created',
          text2: 'Your budget has been created',
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
            <View className="mb-6 flex-row items-center justify-between">
              <Text variant="h2">{editId ? 'Edit Budget' : 'Add Budget'}</Text>
              <View className="flex-row items-center gap-2">
                {editId && (
                  <TouchableOpacity
                    onPress={handleDelete}
                    className="rounded-[6px] bg-red-100 p-2.5 dark:bg-red-900/30">
                    <Icon as={Trash2} size={20} className="text-red-500" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleClose}
                  className="rounded-[6px] bg-secondary p-2.5">
                  <Icon as={X} size={20} className="text-foreground" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={{ flexShrink: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <View className="flex-col gap-6">
                <View className="bg-primary/10 flex-row items-center gap-3 rounded-xl p-4">
                  <Icon as={Info} size={20} className="text-primary" />
                  <Text className="flex-1 text-sm text-primary dark:text-primary">
                    Budgets apply globally and reset automatically on the 1st of every month.
                  </Text>
                </View>

                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Category</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row">
                    {expenseCategories.map((cat) => {
                      const CatIcon = getCategoryIcon(
                        cat.name,
                        undefined,
                        'icon' in cat ? cat.icon : undefined
                      );
                      const color = getCategoryColor(
                        cat.name,
                        'color' in cat ? cat.color : undefined
                      );
                      const isSelected = selectedCategory === cat.name;

                      return (
                        <TouchableOpacity
                          key={cat.name}
                          onPress={() => {
                            setSelectedCategory(cat.name);
                            setError('');
                          }}
                          className={`mr-3 items-center justify-center rounded-xl border p-4 ${
                            isSelected ? 'bg-primary/10 border-primary' : 'border-border bg-surface'
                          }`}
                          style={{ minWidth: 100 }}>
                          <View
                            className="mb-2 h-12 w-12 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${color}15` }}>
                            <Icon as={CatIcon} size={24} color={color} />
                          </View>
                          <Text
                            className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Monthly Limit</Text>
                  <View className="relative justify-center">
                    <Text className="absolute left-5 z-10 text-base font-semibold text-foreground">
                      {userProfile.currencySymbol}
                    </Text>
                    <TextInput
                      value={amount}
                      onChangeText={(text) => {
                        setAmount(sanitizeAmountInput(text));
                        setError('');
                      }}
                      className={`rounded-xl border bg-surface py-3.5 pl-10 pr-5 text-base font-semibold text-foreground ${error ? 'border-red-500' : focusedInput === 'amount' ? 'border-primary' : 'border-border'}`}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      placeholderTextColor={placeholderColor}
                      onFocus={() => setFocusedInput('amount')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                  {error ? <Text className="ml-4 mt-2 text-xs text-red-500">{error}</Text> : null}
                </View>
              </View>
            </ScrollView>

            <View className="mt-10 flex-row gap-3">
              <TouchableOpacity
                className="flex-1 items-center justify-center rounded-[6px] bg-secondary py-4"
                onPress={handleClose}
                activeOpacity={0.7}>
                <Text className="text-base font-medium text-foreground">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 items-center justify-center rounded-[6px] bg-primary py-4 ${!amount.trim() || !selectedCategory ? 'opacity-40' : 'opacity-100'}`}
                onPress={handleSave}
                activeOpacity={0.7}>
                <Text className="text-base font-medium text-white dark:text-black">
                  Save Budget
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SlideSheet>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Budget"
        message="Are you sure you want to delete this budget? This cannot be undone."
        confirmText="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
}
