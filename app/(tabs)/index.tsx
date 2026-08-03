import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useApp } from '@/context/AppContext';
import { getCategoryDetails } from '@/utils/transaction';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Plus,
  Receipt,
  Wallet,
  TrendingUp,
  Calendar,
  PiggyBank,
  Target,
  Repeat,
  ChevronRight,
  Tag,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { parseBalance, formatNumber } from '@/utils/wallet';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { Avatar } from '@/components/ui/avatar';
import { useRef, useEffect, useMemo } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

export default function HomeScreen(_props: { isActive?: boolean }) {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const { accounts, transactions, userProfile, customCategories, budgets, subscriptions } = useApp();

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'index') {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    });
  }, [addListener]);

  const now = new Date();

  // 1. Net Worth across all wallets
  const totalBalance = useMemo(
    () => accounts.reduce((sum, acc) => sum + parseBalance(acc.balance), 0),
    [accounts]
  );

  // 2. Current month's transactions
  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [transactions, now]);

  // 3. Income & Expenses this month
  const totalIncome = useMemo(
    () =>
      currentMonthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
    [currentMonthTransactions]
  );

  const totalExpense = useMemo(
    () =>
      currentMonthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0),
    [currentMonthTransactions]
  );

  const netSavings = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

  // 4. Daily average spending pace
  const currentDay = Math.max(now.getDate(), 1);
  const dailyAvgExpense = totalExpense / currentDay;

  // 5. Category breakdown
  const sortedCategories = useMemo(() => {
    const expenseTxs = currentMonthTransactions.filter((t) => t.type === 'expense');
    const categoryTotals = expenseTxs.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        ...getCategoryDetails(category, undefined, customCategories),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthTransactions, totalExpense, customCategories]);

  const topCategory = sortedCategories[0];

  // 6. Budgets & Subscriptions summary
  const totalBudgeted = useMemo(
    () => budgets.reduce((sum, b) => sum + b.amount, 0),
    [budgets]
  );

  const totalSpentInBudgets = useMemo(() => {
    return budgets.reduce((sum, b) => {
      const spent = currentMonthTransactions
        .filter((t) => t.type === 'expense' && t.category === b.category)
        .reduce((s, t) => s + t.amount, 0);
      return sum + spent;
    }, 0);
  }, [budgets, currentMonthTransactions]);

  const activeSubscriptions = useMemo(() => {
    return subscriptions.filter((s) => s.is_active === 1);
  }, [subscriptions]);

  const monthlySubscriptionsCost = useMemo(() => {
    return activeSubscriptions.reduce((sum, s) => {
      if (s.cycle === 'yearly') return sum + s.amount / 12;
      if (s.cycle === 'quarterly') return sum + s.amount / 3;
      if (s.cycle === 'weekly') return sum + s.amount * 4.33;
      return sum + s.amount;
    }, 0);
  }, [activeSubscriptions]);

  // 7. Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  const getWalletName = (walletId: string) => {
    return accounts.find((a) => a.id === walletId)?.name || 'Wallet';
  };

  const formatDateBadge = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    ) {
      return 'Today';
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()
    ) {
      return 'Yesterday';
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View className="mt-2 flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      {/* Sticky Welcome Header */}
      <View className="mb-4 ml-1 flex-row items-center justify-between px-5">
        <View className="flex-row items-center gap-3">
          <Avatar name={userProfile.name} avatar={userProfile.avatar} size={44} />
          <View>
            <Text className="mt-0.5 text-2xl font-bold text-foreground">
              Hey, {userProfile.name}
            </Text>
            <Text className="text-xs font-medium text-muted">
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/add-transaction')}
          className="h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-surface shadow-xs dark:border-gray-900"
          activeOpacity={0.7}>
          <Icon as={Plus} size={20} className="text-foreground" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}>
        {/* ── Total Balance & Net Cashflow Hero Card ── */}
        <View className="mb-5 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted">
              Total Balance
            </Text>
            {totalIncome > 0 && (
              <View className="flex-row items-center gap-1 rounded-full bg-income/10 px-2.5 py-0.5 dark:bg-income/20">
                <Icon as={TrendingUp} size={11} className="text-income" />
                <Text className="text-xs font-semibold text-income">
                  {savingsRate}% Saved
                </Text>
              </View>
            )}
          </View>

          <Text className="mt-1 text-3xl font-extrabold text-foreground">
            {userProfile.currencySymbol}
            {formatNumber(totalBalance)}
          </Text>

          {/* Mini Cashflow Proportion Bar */}
          {totalIncome > 0 && (
            <View className="mt-4">
              <View className="h-2 w-full flex-row overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <View
                  style={{ width: `${Math.min(100, Math.max(2, (totalExpense / totalIncome) * 100))}%` }}
                  className="h-full rounded-full bg-expense"
                />
                <View className="h-full flex-1 rounded-full bg-income" />
              </View>
            </View>
          )}

          {/* Divider */}
          <View className="my-4 h-[1px] bg-divider" />

          {/* Quick Income/Expense Summary */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-income/10 dark:bg-income/20">
                <Icon as={ArrowDownLeft} size={18} className="text-income" />
              </View>
              <View>
                <Text className="text-xs font-medium text-muted">Income</Text>
                <Text className="mt-0.5 text-sm font-bold text-income">
                  +{userProfile.currencySymbol}
                  {formatNumber(totalIncome)}
                </Text>
              </View>
            </View>

            <View className="mx-2 h-8 w-[1px] bg-divider" />

            <View className="flex-1 flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-expense/10 dark:bg-expense/20">
                <Icon as={ArrowUpRight} size={18} className="text-expense" />
              </View>
              <View>
                <Text className="text-xs font-medium text-muted">Expenses</Text>
                <Text className="mt-0.5 text-sm font-bold text-expense">
                  -{userProfile.currencySymbol}
                  {formatNumber(totalExpense)}
                </Text>
              </View>
            </View>
          </View>

          {/* See Analytics Link */}
          <View className="mt-4 border-t border-divider pt-3.5">
            <TouchableOpacity
              className="flex-row items-center justify-center gap-1"
              activeOpacity={0.7}
              onPress={() => navigateTab('analytics')}>
              <Text className="text-sm font-bold text-primary">See full analytics</Text>
              <Icon as={ArrowRight} size={14} className="text-primary" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Key Financial Insights (2x2 Grid) ── */}
        <View className="mb-5">
          <View className="mb-3 flex-row items-center justify-between px-1">
            <Text className="text-base font-semibold text-foreground">Monthly Insights</Text>
            <Text className="text-xs font-medium text-muted">
              {now.toLocaleDateString('en-US', { month: 'long' })}
            </Text>
          </View>

          <View className="flex-row gap-3">
            {/* Daily Average Spending Card */}
            <View className="flex-1 rounded-3xl border border-gray-100 bg-surface p-4 shadow-xs dark:border-gray-900">
              <View className="mb-2 h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 dark:bg-blue-500/20">
                <Icon as={Calendar} size={16} className="text-blue-500" />
              </View>
              <Text className="text-xs font-medium text-muted">Daily Average</Text>
              <Text className="mt-0.5 text-base font-bold text-foreground">
                {userProfile.currencySymbol}
                {formatNumber(dailyAvgExpense)}
              </Text>
              <Text className="mt-0.5 text-[11px] text-muted">
                Pace in {now.toLocaleDateString('en-US', { month: 'short' })} (Day {currentDay})
              </Text>
            </View>

            {/* Net Saved Card */}
            <View className="flex-1 rounded-3xl border border-gray-100 bg-surface p-4 shadow-xs dark:border-gray-900">
              <View className="mb-2 h-8 w-8 items-center justify-center rounded-full bg-income/10 dark:bg-income/20">
                <Icon as={PiggyBank} size={16} className="text-income" />
              </View>
              <Text className="text-xs font-medium text-muted">Net Saved</Text>
              <Text
                className={`mt-0.5 text-base font-bold ${netSavings >= 0 ? 'text-income' : 'text-expense'}`}>
                {netSavings >= 0 ? '+' : ''}
                {userProfile.currencySymbol}
                {formatNumber(netSavings)}
              </Text>
              <Text className="mt-0.5 text-[11px] text-muted">
                {totalIncome > 0 ? `${savingsRate}% retained` : 'No income logged'}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row gap-3">
            {/* Top Spend Category Card */}
            <View className="flex-1 rounded-3xl border border-gray-100 bg-surface p-4 shadow-xs dark:border-gray-900">
              <View
                className="mb-2 h-8 w-8 items-center justify-center rounded-full"
                style={{
                  backgroundColor: topCategory ? `${topCategory.color}20` : 'rgba(156, 163, 175, 0.15)',
                }}>
                <Icon
                  as={topCategory ? topCategory.icon : Tag}
                  size={16}
                  color={topCategory ? topCategory.color : undefined}
                  className={topCategory ? undefined : 'text-muted'}
                />
              </View>
              <Text className="text-xs font-medium text-muted">Top Category</Text>
              <Text className="mt-0.5 text-base font-bold text-foreground" numberOfLines={1}>
                {topCategory ? topCategory.category : 'None yet'}
              </Text>
              <Text className="mt-0.5 text-[11px] text-muted" numberOfLines={1}>
                {topCategory
                  ? `${userProfile.currencySymbol}${formatNumber(topCategory.amount)} (${Math.round(topCategory.percentage)}%)`
                  : '0 expenses logged'}
              </Text>
            </View>

            {/* Budgets / Subscriptions / Wallets Card */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                budgets.length > 0
                  ? navigateTab('budgets')
                  : subscriptions.length > 0
                    ? navigateTab('subscriptions')
                    : navigateTab('wallets')
              }
              className="flex-1 rounded-3xl border border-gray-100 bg-surface p-4 shadow-xs dark:border-gray-900">
              <View className="mb-2 h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 dark:bg-purple-500/20">
                <Icon
                  as={budgets.length > 0 ? Target : subscriptions.length > 0 ? Repeat : Wallet}
                  size={16}
                  className="text-purple-500"
                />
              </View>
              <Text className="text-xs font-medium text-muted">
                {budgets.length > 0
                  ? 'Budgets'
                  : subscriptions.length > 0
                    ? 'Subscriptions'
                    : 'Wallets'}
              </Text>
              <Text className="mt-0.5 text-base font-bold text-foreground" numberOfLines={1}>
                {budgets.length > 0
                  ? `${budgets.length} Active`
                  : subscriptions.length > 0
                    ? `${userProfile.currencySymbol}${formatNumber(monthlySubscriptionsCost)}/mo`
                    : `${accounts.length} Active`}
              </Text>
              <Text className="mt-0.5 text-[11px] text-muted" numberOfLines={1}>
                {budgets.length > 0
                  ? `${userProfile.currencySymbol}${formatNumber(totalSpentInBudgets)} spent`
                  : subscriptions.length > 0
                    ? `${activeSubscriptions.length} recurring`
                    : `${accounts.find((a) => a.isDefault)?.name || 'Default wallet'}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Category Spending Breakdown (if expenses exist) ── */}
        {sortedCategories.length > 0 && (
          <View className="mb-5 rounded-3xl border border-gray-100 bg-surface p-5 shadow-xs dark:border-gray-900">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">Spending Breakdown</Text>
              <TouchableOpacity
                onPress={() => navigateTab('analytics')}
                activeOpacity={0.7}
                className="flex-row items-center gap-0.5">
                <Text className="text-xs font-semibold text-primary">Details</Text>
                <Icon as={ChevronRight} size={12} className="text-primary" />
              </TouchableOpacity>
            </View>

            {/* Segmented Multi-color bar */}
            <View className="mb-3 h-2 w-full flex-row overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              {sortedCategories.slice(0, 4).map((cat) => (
                <View
                  key={cat.category}
                  style={{
                    width: `${Math.max(cat.percentage, 3)}%`,
                    backgroundColor: cat.color,
                  }}
                  className="h-full"
                />
              ))}
            </View>

            {/* Category rows */}
            <View className="gap-2">
              {sortedCategories.slice(0, 3).map((cat) => (
                <View key={cat.category} className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <Text className="text-xs font-medium text-foreground">{cat.category}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs font-semibold text-foreground">
                      {userProfile.currencySymbol}
                      {formatNumber(cat.amount)}
                    </Text>
                    <Text className="w-9 text-right text-[11px] text-muted">
                      {Math.round(cat.percentage)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── My Wallets Snapshot Carousel ── */}
        <View className="mb-5">
          <View className="mb-3 flex-row items-center justify-between px-1">
            <Text className="text-base font-semibold text-foreground">My Wallets</Text>
            <TouchableOpacity
              onPress={() => navigateTab('wallets')}
              activeOpacity={0.7}
              className="flex-row items-center gap-0.5">
              <Text className="text-xs font-semibold text-foreground">Manage</Text>
              <Icon as={ArrowRight} size={12} className="text-foreground" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
            {accounts.map((acc) => {
              const numericBal = parseBalance(acc.balance);
              return (
                <TouchableOpacity
                  key={acc.id}
                  activeOpacity={0.7}
                  onPress={() => navigateTab('wallets')}
                  className="min-w-[145px] rounded-3xl border border-gray-100 bg-surface p-4 shadow-xs dark:border-gray-900">
                  <View className="mb-3 flex-row items-center justify-between">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <Icon as={acc.icon || Wallet} size={18} className="text-foreground" />
                    </View>
                    {acc.isDefault && (
                      <View className="rounded-full bg-primary/10 px-2 py-0.5 dark:bg-primary/20">
                        <Text className="text-[10px] font-bold text-primary">Default</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-xs font-medium text-muted" numberOfLines={1}>
                    {acc.name}
                  </Text>
                  <Text
                    className={`mt-0.5 text-base font-bold ${numericBal >= 0 ? 'text-foreground' : 'text-expense'}`}>
                    {userProfile.currencySymbol}
                    {formatNumber(numericBal)}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/add-wallet')}
              className="min-w-[120px] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-surface/50 p-4 dark:border-gray-800">
              <View className="mb-2 h-8 w-8 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                <Icon as={Plus} size={16} className="text-primary" />
              </View>
              <Text className="text-xs font-semibold text-foreground">Add Wallet</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── Recent Transactions Section ── */}
        <View className="gap-4">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-base font-semibold text-foreground">Recent Activity</Text>
            {transactions.length > 0 && (
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
            accounts.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="Create Your First Wallet"
                description="Add a wallet to start tracking your balances and transactions."
                buttonText="Add Wallet"
                onButtonPress={() => router.push('/add-wallet')}
              />
            ) : (
              <EmptyState
                icon={Receipt}
                title="No Activity Yet"
                description="You haven't logged any transactions. Add your first transaction to get started."
                buttonText="Add Your First Transaction"
                onButtonPress={() => router.push('/add-transaction')}
              />
            )
          ) : (
            <View className="overflow-hidden rounded-[32px] border border-gray-100 bg-surface px-4 py-2 shadow-xs dark:border-gray-900">
              {recentTransactions.map((tx, idx) => {
                const { icon, color } = getCategoryDetails(tx.category, tx.title, customCategories);
                const isLast = idx === recentTransactions.length - 1;
                const dateBadge = formatDateBadge(tx.date);

                return (
                  <View key={tx.id}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => router.push('/(tabs)/transactions')}
                      className="flex-row items-center justify-between py-3.5">
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
                            {getWalletName(tx.walletId)} • {tx.category} • {dateBadge}
                          </Text>
                        </View>
                      </View>

                      <Text
                        className={`text-base font-bold ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                        {tx.type === 'income' ? '+' : '-'}
                        {userProfile.currencySymbol}
                        {formatNumber(tx.amount)}
                      </Text>
                    </TouchableOpacity>
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
