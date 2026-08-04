import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useApp } from '@/context/AppContext';
import { getCategoryDetails } from '@/utils/transaction';
import { ArrowUpRight, ArrowDownLeft, ArrowRight, Plus, Receipt, Wallet, Tags, PiggyBank, Repeat, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { parseBalance, formatNumber } from '@/utils/wallet';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { Avatar } from '@/components/ui/avatar';

import { useState, useRef, useEffect, useMemo } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
export default function HomeScreen(_props: { isActive?: boolean }) {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const { accounts, transactions, userProfile, customCategories } = useApp();

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'index') {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    });
  }, [addListener]);

  // Calculate Net Worth
  const totalBalance = accounts.reduce((sum, acc) => sum + parseBalance(acc.balance), 0);

  // Recent 20 transactions
  const recentTransactions = transactions.slice(0, 20);

  const now = new Date();
  const currentMonthTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }),
    [transactions, now.getMonth(), now.getFullYear()]
  );

  const totalIncome = useMemo(
    () => currentMonthTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [currentMonthTransactions]
  );

  const totalExpense = useMemo(
    () => currentMonthTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [currentMonthTransactions]
  );

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

      {/* Net Balance Card (Fixed at top) */}
      <View className="px-5 mb-5">
        <View className="rounded-xl border border-border bg-surface py-5 shadow-xs">
          <View className="px-6 mb-4">
            <Text className="mb-1 text-sm font-medium text-muted">Total Balance</Text>
            <Text className="text-3xl font-bold text-foreground">
              {userProfile.currencySymbol}
              {formatNumber(totalBalance)}
            </Text>
          </View>

          {/* Divider */}
          <View className="mb-5 h-[1px] bg-divider" />

          {/* Quick Income/Expense Summary */}
          <View className="flex-row px-6 mb-5">
            <View className="flex-1 flex-row items-center gap-3">
              <View className="bg-income/10 dark:bg-income/20 h-9 w-9 items-center justify-center rounded-full">
                <Icon as={ArrowDownLeft} size={18} className="text-income" />
              </View>
              <View>
                <Text className="text-xs font-medium text-muted">Income</Text>
                <Text className="mt-0.5 text-sm font-bold text-income">
                  {userProfile.currencySymbol}
                  {formatNumber(totalIncome)}
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
                  {formatNumber(totalExpense)}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions Grid */}
          <View className="mb-4 h-[1px] bg-divider" />
          <View className="flex-row px-6 pb-2">
            {/* Column 1 */}
            <View className="flex-1 gap-3">
              <TouchableOpacity
                onPress={() => navigateTab('categories', { referrer: 'home' })}
                activeOpacity={0.7}
                className="flex-row items-center gap-3 py-1">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary/60">
                  <Icon as={Tags} size={14} className="text-primary" />
                </View>
                <Text className="text-sm font-semibold text-foreground">Categories</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => navigateTab('budgets', { referrer: 'home' })}
                activeOpacity={0.7}
                className="flex-row items-center gap-3 py-1">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary/60">
                  <Icon as={PiggyBank} size={14} className="text-primary" />
                </View>
                <Text className="text-sm font-semibold text-foreground">Budgets</Text>
              </TouchableOpacity>
            </View>

            {/* Vertical Divider */}
            <View className="mx-4 w-[1px] bg-divider" />

            {/* Column 2 */}
            <View className="flex-1 gap-3">
              <TouchableOpacity
                onPress={() => navigateTab('analytics', { referrer: 'home' })}
                activeOpacity={0.7}
                className="flex-row items-center gap-3 py-1">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary/60">
                  <Icon as={TrendingUp} size={14} className="text-primary" />
                </View>
                <Text className="text-sm font-semibold text-foreground">Analytics</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigateTab('subscriptions', { referrer: 'home' })}
                activeOpacity={0.7}
                className="flex-row items-center gap-3 py-1">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary/60">
                  <Icon as={Repeat} size={14} className="text-primary" />
                </View>
                <Text className="text-sm font-semibold text-foreground">Subscriptions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Activity Header (Fixed at top) */}
      <View className="flex-row items-center justify-between px-5 mb-4">
        <Text className="text-lg font-semibold text-foreground">Recent Activity</Text>
        {transactions.length > 0 && (
          <TouchableOpacity
            onPress={() => navigateTab('transactions')}
            className="flex-row items-center gap-1.5 rounded-[6px] border border-border bg-surface px-3 py-1.5 shadow-xs"
            activeOpacity={0.7}>
            <Text className="text-xs font-semibold text-foreground">View All</Text>
            <Icon as={ArrowRight} size={12} className="text-foreground" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}
        keyboardDismissMode="on-drag">
        {/* Recent Transactions Section */}
        <View className="gap-4">

          {recentTransactions.length === 0 ? (
            accounts.length === 0 ? (
              <View className="items-center justify-center">
                <EmptyState
                  icon={Wallet}
                  title="Create Your First Wallet"
                  description="Add a wallet to start tracking your balances and transactions."
                  buttonText="Add Wallet"
                  onButtonPress={() => router.push('/add-wallet')}
                  className="mt-6 items-center justify-center px-6"
                />
              </View>
            ) : (
              <View className="justify-center">
                <EmptyState
                  icon={Receipt}
                  title="No Activity Yet"
                  description="You haven't logged any transactions. Add your first transaction to get started."
                  buttonText="Add Your First Transaction"
                  onButtonPress={() => router.push('/add-transaction')}
                  className="mt-6 items-center justify-center px-6"
                />
              </View>
            )
          ) : (
            <View className="overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xs">
              {recentTransactions.map((tx, idx) => {
                const { icon, color } = getCategoryDetails(tx.category, tx.title, customCategories);
                const isLast = idx === recentTransactions.length - 1;

                return (
                  <View key={tx.id}>
                    <View className="flex-row items-center justify-between px-5 py-5">
                      <View className="mr-2 flex-1 flex-row items-center gap-3.5">
                        <View
                          className="h-10 w-10 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${color}15` }}>
                          <Icon as={icon} size={18} color={color} />
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-base font-medium text-foreground"
                            numberOfLines={1}>
                            {tx.title}
                          </Text>
                          <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
                            {getWalletName(tx.walletId)} • {tx.category}
                          </Text>
                        </View>
                      </View>

                      <Text
                        className={`text-base font-semibold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                        {tx.type === 'income' ? '+' : '-'}
                        {userProfile.currencySymbol}
                        {formatNumber(tx.amount)}
                      </Text>
                    </View>
                    {!isLast && <View className="h-[1px] bg-divider" />}
                  </View>
                );
              })}
            </View>
          )}
          {recentTransactions.length > 0 && (
            <Text className="text-center text-xs text-muted mt-2 font-medium">
              {transactions.length > 20
                ? 'Showing up to 20 recent transactions'
                : 'Reached the end of recent activity'}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}