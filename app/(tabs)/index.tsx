import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useAppActions, useAppSelector } from '@/context/store';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Receipt,
  Wallet,
  Tags,
  PiggyBank,
  Repeat,
  TrendingUp,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { parseBalance, formatNumber } from '@/utils/wallet';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Toast from 'react-native-toast-message';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
export default function HomeScreen({ isActive = true }: { isActive?: boolean }) {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const { deleteTransaction } = useAppActions();
  const accounts = useAppSelector((state) => state.accounts);
  const transactions = useAppSelector((state) => state.transactions);
  const customCategories = useAppSelector((state) => state.customCategories);
  const userName = useAppSelector((state) => state.userProfile.name);
  const userAvatar = useAppSelector((state) => state.userProfile.avatar);
  const currencySymbol = useAppSelector((state) => state.userProfile.currencySymbol);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'index') {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    });
  }, [addListener]);

  // Calculate Net Worth
  const totalBalance = useMemo(
    () => accounts.reduce((sum, acc) => sum + parseBalance(acc.balance), 0),
    [accounts]
  );

  // Recent 20 transactions
  const recentTransactions = useMemo(() => transactions.slice(0, 20), [transactions]);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (!isActive) {
      setExpandedTransactionId(null);
    }
  }, [isActive]);

  const toggleTransactionExpand = useCallback((id: string) => {
    setExpandedTransactionId((prev) => (prev === id ? null : id));
  }, []);

  const handleDeleteTransaction = useCallback((id: string, title: string) => {
    setPendingDelete({ id, title });
  }, []);

  const now = useMemo(() => {
    const d = new Date();
    return { month: d.getMonth(), year: d.getFullYear() };
  }, []);

  const currentMonthTransactions = useMemo(
    () =>
      transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === now.month && d.getFullYear() === now.year;
      }),
    [transactions, now.month, now.year]
  );

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

  // One lookup table instead of scanning `accounts` per row.
  const walletNames = useMemo(
    () => new Map(accounts.map((account) => [account.id, account.name] as const)),
    [accounts]
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 12 }}>
      {/* Sticky Welcome Header */}
      <View className="mb-4 flex-row items-center justify-between px-5">
        <View className="flex-row items-center gap-3">
          <Avatar name={userName} avatar={userAvatar} size={44} />
          <View>
            <Text className="text-[23px] font-bold tracking-tight text-foreground">Hey, {userName}</Text>
          </View>
        </View>
      </View>

      {/* Net Balance Card (Fixed at top) */}
      <View className="mb-4 px-5">
        <View className="rounded-2xl border border-border bg-surface py-5">
          <View className="mb-3.5 px-6">
            <Text className="mb-1 text-[13px] font-normal text-muted">Total Balance</Text>
            <Text className="text-[32px] font-bold tracking-tight text-foreground">
              {currencySymbol}
              {formatNumber(totalBalance)}
            </Text>
          </View>

          {/* Divider */}
          <View className="mb-4 h-[1px] bg-divider" />

          {/* Quick Income/Expense Summary */}
          <View className="mb-4 flex-row items-center px-6">
            <View className="flex-1 flex-row items-center gap-3">
              <View>
                <Text className="text-[12px] font-normal text-muted">Income</Text>
                <Text className="mt-0.5 text-[14px] font-semibold text-[#00A86B]">
                  {currencySymbol}
                  {formatNumber(totalIncome)}
                </Text>
              </View>
            </View>

            <View className="mx-4 h-7 w-[1px] bg-divider" />

            <View className="flex-1 flex-row items-center gap-3">
              <View>
                <Text className="text-[12px] font-normal text-muted">Expenses</Text>
                <Text className="mt-0.5 text-[14px] font-semibold text-[#F04444]">
                  {currencySymbol}
                  {formatNumber(totalExpense)}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions Grid */}
          <View className="mb-3.5 h-[1px] bg-divider" />
          <View className="flex-row px-6 pb-1">
            {/* Column 1 */}
            <View className="flex-1 gap-3">
              <TouchableOpacity
                onPress={() => navigateTab('categories', { referrer: 'home' })}
                activeOpacity={0.7}
                className="flex-row items-center gap-3 py-1">
                <View className="h-8 w-8 items-center justify-center rounded-full border border-border bg-[#F7F7F7] dark:bg-[#1A1A1E]">
                  <Icon as={Tags} size={14} className="text-foreground" />
                </View>
                <Text className="text-[14px] font-medium text-foreground">Categories</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigateTab('budgets', { referrer: 'home' })}
                activeOpacity={0.7}
                className="flex-row items-center gap-3 py-1">
                <View className="h-8 w-8 items-center justify-center rounded-full border border-border bg-[#F7F7F7] dark:bg-[#1A1A1E]">
                  <Icon as={PiggyBank} size={14} className="text-foreground" />
                </View>
                <Text className="text-[14px] font-medium text-foreground">Budgets</Text>
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
                <View className="h-8 w-8 items-center justify-center rounded-full border border-border bg-[#F7F7F7] dark:bg-[#1A1A1E]">
                  <Icon as={TrendingUp} size={14} className="text-foreground" />
                </View>
                <Text className="text-[14px] font-medium text-foreground">Analytics</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigateTab('subscriptions', { referrer: 'home' })}
                activeOpacity={0.7}
                className="flex-row items-center gap-3 py-1">
                <View className="h-8 w-8 items-center justify-center rounded-full border border-border bg-[#F7F7F7] dark:bg-[#1A1A1E]">
                  <Icon as={Repeat} size={14} className="text-foreground" />
                </View>
                <Text className="text-[14px] font-medium text-foreground">Subscriptions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Activity Header (Fixed at top) */}
      <View className="mb-3.5 flex-row items-center justify-between px-5">
        <Text className="text-[19px] font-semibold tracking-tight text-foreground">Recent Activity</Text>
        {transactions.length > 0 && (
          <TouchableOpacity
            onPress={() => navigateTab('transactions')}
            className="flex-row items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5"
            activeOpacity={0.7}>
            <Text className="text-[12px] font-medium text-foreground">View All</Text>
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
            <View className="overflow-hidden rounded-2xl border border-border bg-surface py-1">
              {recentTransactions.map((tx, idx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  walletNames={walletNames}
                  unknownWalletLabel="Wallet"
                  isExpanded={expandedTransactionId === tx.id}
                  onToggleExpand={toggleTransactionExpand}
                  onDelete={handleDeleteTransaction}
                  isLast={idx === recentTransactions.length - 1}
                  currencySymbol={currencySymbol}
                  customCategories={customCategories}
                  showSubtitle={false}
                />
              ))}
            </View>
          )}
          {recentTransactions.length > 0 && (
            <Text className="mt-2 text-center text-[12px] font-normal text-muted">
              {transactions.length > 20
                ? 'Showing up to 20 recent transactions'
                : 'Reached the end of recent activity'}
            </Text>
          )}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete Transaction"
        message={`Are you sure you want to delete "${pendingDelete?.title}"? This will reverse the wallet balance adjustment.`}
        confirmText="Delete"
        destructive
        onConfirm={async () => {
          if (pendingDelete) {
            try {
              await deleteTransaction(pendingDelete.id);
              Toast.show({
                type: 'success',
                text1: 'Transaction Deleted',
                text2: 'Wallet balance has been reverted.',
              });
            } catch {
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: 'Your transaction could not be deleted. Please try again.',
              });
            }
          }
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}
