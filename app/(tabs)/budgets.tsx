import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { PiggyBank, Plus, Edit2 } from 'lucide-react-native';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { useApp } from '@/context/AppContext';
import { filterByMonth } from '@/utils/analytics';
import { getCategoryColor, getCategoryIcon } from '@/utils/transaction';
import { formatNumber } from '@/utils/wallet';
import { MonthNavigator } from '@/components/analytics/MonthNavigator';
import { router } from 'expo-router';

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const { budgets, transactions, getSortedCategories, userProfile } = useApp();
  const scrollRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'budgets') {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
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

  const budgetProgress = useMemo(() => {
    return budgets.map((budget) => {
      const spent = currentMonthTxs
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = Math.min((spent / budget.amount) * 100, 100);
      return { ...budget, spent, percentage };
    });
  }, [budgets, currentMonthTxs]);

  const expenseCategories = getSortedCategories('expense');
  const getCatDetails = (name: string) => {
    const cat = expenseCategories.find(c => c.name === name);
    return {
      icon: getCategoryIcon(name, undefined, cat && 'icon' in cat ? cat.icon : undefined),
      color: getCategoryColor(name, cat && 'color' in cat ? cat.color : undefined),
    };
  };

  const handleEdit = (id: string) => {
    router.push(`/add-budget?editId=${id}`);
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header 
          title="Budgets" 
          showBack={true} 
          onLeftPress={() => navigateTab('profile')} 
          rightIcon={Plus}
          onRightPress={() => router.push("/add-budget")}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}>
        
        {budgets.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="Monthly Budgets"
            description="Set spending limits per category and track your progress throughout the month."
            buttonText="Create Budget"
            onButtonPress={() => router.push("/add-budget")}
          />
        ) : (
          <View className="mt-2">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="ml-1 text-sm font-medium text-muted">
                {year === now.getFullYear() && month === now.getMonth() 
                  ? 'Current Month' 
                  : `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`}
              </Text>
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
            {budgetProgress.map((bp) => {
              const { icon: CatIcon, color } = getCatDetails(bp.category);
              const isOverBudget = bp.percentage >= 100;
              const progressColor = isOverBudget ? 'bg-red-500' : 'bg-primary';

              return (
                <TouchableOpacity
                  key={bp.id}
                  activeOpacity={0.7}
                  onPress={() => handleEdit(bp.id)}
                  className="mb-4 rounded-3xl bg-surface p-5 border border-border shadow-xs">
                  
                  <View className="mb-4 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View 
                        className="h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${color}15` }}>
                        <Icon as={CatIcon} size={20} color={color} />
                      </View>
                      <View>
                        <Text className="text-base font-semibold">{bp.category}</Text>
                        <Text className="text-xs text-muted">
                          {userProfile.currencySymbol}{formatNumber(bp.spent)} spent ({Math.round((bp.spent / bp.amount) * 100)}%)
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-base font-bold">
                        {userProfile.currencySymbol}{formatNumber(bp.amount, 0)}
                      </Text>
                      <Text className="text-xs text-muted">Limit</Text>
                    </View>
                  </View>
 
                  <View className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <View
                      className={`h-full rounded-full ${progressColor}`}
                      style={{ width: `${bp.percentage}%` }}
                    />
                  </View>
                  
                  {isOverBudget && (
                    <Text className="mt-3 text-xs font-medium text-red-500 text-center">
                      Over budget by {userProfile.currencySymbol}{formatNumber(bp.spent - bp.amount)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
