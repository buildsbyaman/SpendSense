import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useApp } from '@/context/AppContext';
import { TrendingUp, Plus, Wallet } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useTabNavigation } from '@/context/TabNavigationContext';

import { MonthNavigator } from '@/components/analytics/MonthNavigator';
import { TypeFilterToggle, type TypeFilter } from '@/components/analytics/TypeFilterToggle';
import { SummaryCards } from '@/components/analytics/SummaryCards';
import { EmptyState } from '@/components/ui/EmptyState';
import { TrendChart } from '@/components/analytics/TrendChart';
import { CategoryDonut } from '@/components/analytics/CategoryDonut';
import { SectionCard } from '@/components/analytics/SectionCard';

import {
  filterByMonth,
  filterByYear,
  filterByType,
  sumByType,
  groupByCategory,
  buildWeeklySeries,
  buildMonthlySeries,
  getPreviousStats,
} from '@/utils/analytics';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();
  const { accounts, transactions } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'analytics') {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    });
  }, [addListener]);
  const router = useRouter();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number | null>(now.getMonth());
  const [type, setType] = useState<TypeFilter>('expense');

  const scopeTxs = useMemo(
    () =>
      month !== null ? filterByMonth(transactions, year, month) : filterByYear(transactions, year),
    [transactions, year, month]
  );
  const filteredTxs = useMemo(() => filterByType(scopeTxs, type), [scopeTxs, type]);
  const { income, expense } = useMemo(() => sumByType(scopeTxs), [scopeTxs]);
  const trendSeries = useMemo(
    () =>
      month !== null
        ? buildWeeklySeries(transactions, year, month)
        : buildMonthlySeries(transactions, year),
    [transactions, year, month]
  );
  const { incomeDelta, expenseDelta } = useMemo(
    () => getPreviousStats(transactions, year, month),
    [transactions, year, month]
  );

  const categoryData = useMemo(() => {
    const catTxs = filterByType(scopeTxs, type === 'all' ? 'expense' : type);
    return groupByCategory(catTxs);
  }, [scopeTxs, type]);

  const hasData = scopeTxs.length > 0;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header title="Analytics" showBack={true} onLeftPress={() => navigateTab('index')} />
      </View>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}>
        <View className="mb-6 flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <TypeFilterToggle value={type} onChange={setType} />
          </View>

          <MonthNavigator
            year={year}
            month={month}
            onChange={(y, m) => {
              setYear(y);
              setMonth(m);
            }}
            maxYear={now.getFullYear()}
            maxMonth={now.getMonth()}
          />
        </View>

        {!hasData ? (
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
              icon={TrendingUp}
              title="No Transactions"
              description="Add some transactions to see your monthly analytics here."
              buttonText="Add Transaction"
              onButtonPress={() => router.push('/add-transaction')}
            />
          )
        ) : (
          <>
            {/* 1. Month Overview */}
            <SummaryCards
              income={income}
              expense={expense}
              incomeDelta={incomeDelta}
              expenseDelta={expenseDelta}
              count={filteredTxs.length}
            />

            <SectionCard>
              <TrendChart data={trendSeries} type={type} />
            </SectionCard>

            {/* 3. By Category */}
            <SectionCard title="By Category">
              <CategoryDonut
                data={categoryData}
                totalLabel={type === 'income' ? 'Income' : 'Expenses'}
              />
            </SectionCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}
