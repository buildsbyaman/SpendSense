import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useApp } from '@/context/AppContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useState, useMemo } from 'react';

import { MonthNavigator } from '@/components/analytics/MonthNavigator';
import { TypeFilterToggle, type TypeFilter } from '@/components/analytics/TypeFilterToggle';
import { SummaryCards } from '@/components/analytics/SummaryCards';
import { TrendChart } from '@/components/analytics/TrendChart';
import { MonthlyBarChart } from '@/components/analytics/MonthlyBarChart';
import { CategoryDonut } from '@/components/analytics/CategoryDonut';
import { TopCategories } from '@/components/analytics/TopCategories';
import { SectionCard } from '@/components/analytics/SectionCard';

import {
  filterByMonth,
  filterByType,
  sumByType,
  groupByCategory,
  buildDailySeries,
  getPreviousMonthStats,
  getLast6Months,
} from '@/utils/analytics';

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions } = useApp();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [type, setType] = useState<TypeFilter>('all');

  const monthTxs = useMemo(
    () => filterByMonth(transactions, year, month),
    [transactions, year, month]
  );
  const filteredTxs = useMemo(() => filterByType(monthTxs, type), [monthTxs, type]);
  const { income, expense } = useMemo(() => sumByType(monthTxs), [monthTxs]);
  const dailySeries = useMemo(
    () => buildDailySeries(transactions, year, month),
    [transactions, year, month]
  );
  const last6 = useMemo(
    () => getLast6Months(transactions, year, month),
    [transactions, year, month]
  );
  const { prevIncome, prevExpense, incomeDelta, expenseDelta } = useMemo(
    () => getPreviousMonthStats(transactions, year, month),
    [transactions, year, month]
  );

  const categoryData = useMemo(() => {
    const catTxs = filterByType(monthTxs, type === 'all' ? 'expense' : type);
    return groupByCategory(catTxs);
  }, [monthTxs, type]);

  const topCategoriesMax = categoryData.length > 0 ? categoryData[0].amount : 0;

  const hasData = monthTxs.length > 0;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: 120,
        paddingHorizontal: 20,
      }}>
      <Header title="Analytics" showBack={true} />

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

      <TypeFilterToggle value={type} onChange={setType} />

      {!hasData ? (
        <View className="mt-20 items-center justify-center px-6">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900">
            <Icon as={TrendingUp} size={40} className="text-muted opacity-50" />
          </View>
          <Text variant="h3" className="mb-2 text-center">
            No Transactions
          </Text>
          <Text className="mb-8 text-center text-muted">
            Add some transactions to see your monthly analytics here.
          </Text>
        </View>
      ) : (
        <>
          <SummaryCards income={income} expense={expense} />

          {/* Month over Month */}
          <SectionCard title="vs Last Month">
            <View className="flex-row gap-4">
              {expenseDelta !== null && (
                <View className="flex-1 flex-row items-center gap-2">
                  {expenseDelta > 0 ? (
                    <Icon as={TrendingUp} size={16} className="text-expense" />
                  ) : expenseDelta < 0 ? (
                    <Icon as={TrendingDown} size={16} className="text-income" />
                  ) : (
                    <Icon as={Minus} size={16} className="text-muted" />
                  )}
                  <View>
                    <Text className="text-xs text-muted">Expenses</Text>
                    <Text
                      className={`text-sm font-bold ${expenseDelta > 0 ? 'text-expense' : expenseDelta < 0 ? 'text-income' : 'text-foreground'}`}>
                      {expenseDelta > 0 ? '+' : ''}
                      {expenseDelta.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              )}
              {incomeDelta !== null && (
                <View className="flex-1 flex-row items-center gap-2">
                  {incomeDelta > 0 ? (
                    <Icon as={TrendingUp} size={16} className="text-income" />
                  ) : incomeDelta < 0 ? (
                    <Icon as={TrendingDown} size={16} className="text-expense" />
                  ) : (
                    <Icon as={Minus} size={16} className="text-muted" />
                  )}
                  <View>
                    <Text className="text-xs text-muted">Income</Text>
                    <Text
                      className={`text-sm font-bold ${incomeDelta > 0 ? 'text-income' : incomeDelta < 0 ? 'text-expense' : 'text-foreground'}`}>
                      {incomeDelta > 0 ? '+' : ''}
                      {incomeDelta.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </SectionCard>

          {/* Daily Trend */}
          <SectionCard title="Daily Trend">
            <TrendChart data={dailySeries} type={type} />
          </SectionCard>

          {/* Monthly Bar Chart */}
          <SectionCard title="Last 6 Months">
            <MonthlyBarChart data={last6} />
          </SectionCard>

          {/* Category Donut */}
          <SectionCard title="By Category">
            <CategoryDonut
              data={categoryData}
              totalLabel={type === 'income' ? 'Income' : 'Expenses'}
            />
          </SectionCard>

          {/* Top Categories */}
          <SectionCard title="Top Categories">
            <TopCategories data={categoryData} maxAmount={topCategoriesMax} />
          </SectionCard>
        </>
      )}
    </ScrollView>
  );
}
