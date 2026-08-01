import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useApp } from '@/context/AppContext';
import { getCategoryIcon, getCategoryColor } from '@/utils/transaction';
import { ArrowUpRight, ArrowDownLeft, ArrowRight, Plus, Receipt } from 'lucide-react-native';
import { router } from 'expo-router';
import { parseBalance } from '@/utils/wallet';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { Avatar } from '@/components/ui/avatar';

import { useState, useRef, useEffect } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const { accounts, transactions, userProfile } = useApp();

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'index') {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    });
  }, [addListener]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const initials = getInitials(userProfile.name);

  // Calculate Net Worth
  const totalBalance = accounts.reduce((sum, acc) => sum + parseBalance(acc.balance), 0);

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  const now = new Date();
  const currentMonthTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const getWalletName = (walletId: string) => {
    return accounts.find((a) => a.id === walletId)?.name || 'Wallet';
  };

  return (
    <View className="mt-2 flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      {/* Sticky Welcome Header */}
      <View className="mb-4 ml-1 flex-row items-center justify-between px-5">
        <View className="flex-row items-center gap-3">
          <Avatar name={userProfile.name} avatar={userProfile.avatar} size={42} />
          <View>
            <Text className="mt-0.5 text-2xl font-semibold text-foreground">
              Hey, {userProfile.name}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}>
        {/* Net Balance Card */}
        <View className="mb-6 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
          <Text className="mb-1 text-sm font-medium text-muted">Total Balance</Text>
          <Text className="mb-4 text-3xl font-bold text-foreground">
            {userProfile.currencySymbol}
            {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>

          {/* Divider */}
          <View className="mb-4 h-[1px] bg-divider" />

          {/* Quick Income/Expense Summary */}
          <View className="flex-row">
            <View className="flex-1 flex-row items-center gap-3">
              <View className="bg-income/10 dark:bg-income/20 h-9 w-9 items-center justify-center rounded-full">
                <Icon as={ArrowDownLeft} size={18} className="text-income" />
              </View>
              <View>
                <Text className="text-xs font-medium text-muted">Income</Text>
                <Text className="mt-0.5 text-sm font-bold text-income">
                  {userProfile.currencySymbol}
                  {totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View className="mx-4 w-[1px] bg-divider" />

            <View className="flex-1 flex-row items-center gap-3">
              <View className="bg-expense/10 dark:bg-expense/20 h-9 w-9 items-center justify-center rounded-full">
                <Icon as={ArrowUpRight} size={18} className="text-expense" />
              </View>
              <View>
                <Text className="text-xs font-medium text-muted">Expenses</Text>
                <Text className="mt-0.5 text-sm font-bold text-expense">
                  {userProfile.currencySymbol}
                  {totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>

          {/* See Analytics Link */}
          <View className="my-4 h-[1px] bg-divider" />
          <TouchableOpacity
            className="flex-row items-center justify-center gap-1"
            activeOpacity={0.7}
            onPress={() => navigateTab('analytics')}>
            <Text className="text-base font-bold text-primary">See analytics</Text>
            <Icon as={ArrowRight} size={14} className="text-primary" />
          </TouchableOpacity>
        </View>

        {/* Recent Transactions Section */}
        <View className="gap-4">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-lg font-semibold text-foreground">Recent Activity</Text>
            {transactions.length > 5 && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/transactions')}
                className="flex-row items-center gap-1.5 rounded-full border border-gray-100 bg-surface px-3 py-1.5 shadow-xs dark:border-gray-900"
                activeOpacity={0.7}>
                <Text className="text-xs font-semibold text-foreground">View All</Text>
                <Icon as={ArrowRight} size={12} className="text-foreground" />
              </TouchableOpacity>
            )}
          </View>

          {recentTransactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Activity Yet"
              description="You haven't logged any transactions. Add your first transaction to get started."
              buttonText="Add Your First Transaction"
              onButtonPress={() => router.push('/add-transaction')}
            />
          ) : (
            <View className="overflow-hidden rounded-[32px] border border-gray-100 bg-surface px-4 py-2 shadow-xs dark:border-gray-900">
              {recentTransactions.map((tx, idx) => {
                const icon = getCategoryIcon(tx.category, tx.title);
                const color = getCategoryColor(tx.category);
                const isLast = idx === recentTransactions.length - 1;

                return (
                  <View key={tx.id}>
                    <View className="flex-row items-center justify-between py-3.5">
                      <View className="mr-2 flex-1 flex-row items-center gap-3.5">
                        <View
                          className="h-10 w-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${color}15` }}>
                          <Icon as={icon} size={18} color={color} />
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-base font-semibold text-foreground"
                            numberOfLines={1}>
                            {tx.title}
                          </Text>
                          <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
                            {getWalletName(tx.walletId)} • {tx.category}
                          </Text>
                        </View>
                      </View>

                      <Text
                        className={`text-base font-bold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                        {tx.type === 'income' ? '+' : '-'}
                        {userProfile.currencySymbol}
                        {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                    {!isLast && <View className="ml-[54px] h-[1px] bg-divider" />}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
