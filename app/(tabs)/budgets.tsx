import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { PiggyBank, Plus } from 'lucide-react-native';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { useApp } from '@/context/AppContext';
import { filterByMonth } from '@/utils/analytics';
import { getCategoryColor, getCategoryIcon } from '@/utils/transaction';
import { MonthNavigator } from '@/components/analytics/MonthNavigator';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BudgetItem, type BudgetProgressItem } from '@/components/budgets/BudgetItem';
import Toast from 'react-native-toast-message';
import { router } from 'expo-router';

export default function BudgetsScreen({ referrer }: { referrer?: string }) {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const { budgets, transactions, getSortedCategories, userProfile, deleteBudget } = useApp();
  const scrollRef = useRef<FlashListRef<BudgetProgressItem>>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetProgressItem | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'budgets') {
        scrollRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
    });
  }, [addListener]);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth());

  // Compute selected month expenses
  const currentMonthTxs = useMemo(() => {
    return filterByMonth(transactions, year, month);
  }, [transactions, year, month]);

  const budgetProgress = useMemo<BudgetProgressItem[]>(() => {
    const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    return budgets
      .filter((budget) => {
        const bStart = budget.start_date ? new Date(budget.start_date + 'T00:00:00') : null;
        const bEnd = budget.end_date ? new Date(budget.end_date + 'T23:59:59.999') : null;
        if (bStart && bStart > monthEnd) return false;
        if (bEnd && bEnd < monthStart) return false;
        return true;
      })
      .map((budget) => {
        const bStart = budget.start_date ? new Date(budget.start_date + 'T00:00:00') : null;
        const bEnd = budget.end_date ? new Date(budget.end_date + 'T23:59:59.999') : null;

        const spent = currentMonthTxs
          .filter((t) => {
            if (t.type !== 'expense' || t.category !== budget.category) return false;
            const tDate = new Date(t.date);
            if (bStart && tDate < bStart) return false;
            if (bEnd && tDate > bEnd) return false;
            return true;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
        return { ...budget, spent, percentage };
      });
  }, [budgets, currentMonthTxs, year, month]);

  const expenseCategories = getSortedCategories('expense');
  const getCatDetails = useCallback(
    (name: string) => {
      const cat = expenseCategories.find((c) => c.name === name);
      return {
        icon: getCategoryIcon(name, undefined, cat && 'icon' in cat ? cat.icon : undefined),
        color: getCategoryColor(name, cat && 'color' in cat ? cat.color : undefined),
      };
    },
    [expenseCategories]
  );

  const handleEdit = useCallback((id: string) => {
    router.push(`/add-budget?editId=${id}`);
  }, []);

  const confirmDelete = async () => {
    if (!budgetToDelete) return;
    try {
      await deleteBudget(budgetToDelete.id);
      Toast.show({
        type: 'success',
        text1: 'Budget deleted',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Failed to delete budget',
      });
    } finally {
      setBudgetToDelete(null);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header
          title="Budgets"
          showBack={true}
          onLeftPress={() => navigateTab(referrer === 'home' ? 'index' : 'profile')}
          rightIcon={Plus}
          onRightPress={() => router.push('/add-budget')}
        />
      </View>

      <FlashList
        ref={scrollRef}
        data={budgetProgress}
        keyExtractor={(bp) => bp.id}
        ListHeaderComponent={
          budgets.length > 0 ? (
            <View className="mb-4 mt-2 flex-row items-center justify-center">
              <MonthNavigator
                year={year}
                month={month}
                onChange={(y, m) => {
                  setYear(y);
                  if (m !== null) setMonth(m);
                }}
                maxYear={now.getFullYear()}
                maxMonth={now.getMonth()}
                allowAllYear={false}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon={PiggyBank}
            title={budgets.length > 0 ? 'No Budgets in this Period' : 'Monthly Budgets'}
            description={
              budgets.length > 0
                ? 'No budgets are active for the selected month.'
                : 'Set spending limits per category and track your progress throughout the month.'
            }
            buttonText="Create Budget"
            onButtonPress={() => router.push('/add-budget')}
          />
        }
        renderItem={({ item: bp }) => {
          const { icon: CatIcon, color } = getCatDetails(bp.category);

          return (
            <BudgetItem
              item={bp}
              icon={CatIcon}
              color={color}
              currencySymbol={userProfile.currencySymbol}
              isExpanded={expandedId === bp.id}
              onToggleExpand={() => toggleExpand(bp.id)}
              onEdit={() => handleEdit(bp.id)}
              onDelete={() => setBudgetToDelete(bp)}
            />
          );
        }}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      />

      <ConfirmDialog
        visible={budgetToDelete !== null}
        title="Delete Budget"
        message={`Are you sure you want to delete the budget for ${budgetToDelete?.category}? This action cannot be undone.`}
        destructive={true}
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setBudgetToDelete(null)}
      />
    </View>
  );
}
