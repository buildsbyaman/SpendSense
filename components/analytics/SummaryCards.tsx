import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { savingsRate } from '@/utils/analytics';
import { useApp } from '@/context/AppContext';
import { formatNumber } from '@/utils/wallet';

interface SummaryCardsProps {
  income: number;
  expense: number;
  incomeDelta: number | null;
  expenseDelta: number | null;
  count: number;
}

function DeltaBadge({ delta, type }: { delta: number | null, type: 'income' | 'expense' }) {
  if (delta === null) {
    return <Text className="text-xs text-muted">—</Text>;
  }
  const positive = delta > 0;
  
  // Income increase is good (green), Expense increase is bad (red)
  const isGood = type === 'income' ? positive : !positive;
  
  const color = delta === 0 
    ? 'text-muted' 
    : isGood 
      ? 'text-income' 
      : 'text-expense';

  return (
    <View className="flex-row items-center gap-0.5">
      {positive ? (
        <Icon as={TrendingUp} size={11} className={color} />
      ) : delta < 0 ? (
        <Icon as={TrendingDown} size={11} className={color} />
      ) : (
        <Icon as={Minus} size={11} className="text-muted" />
      )}
      <Text className={`text-xs ${color}`}>
        {positive ? '+' : ''}
        {delta.toFixed(1)}%
      </Text>
    </View>
  );
}

export function SummaryCards({
  income,
  expense,
  incomeDelta,
  expenseDelta,
  count,
}: SummaryCardsProps) {
  const net = income - expense;
  const rate = savingsRate(income, expense);
  const { userProfile } = useApp();

  return (
    <View className="mb-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
      {/* Income row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <View className="bg-income/10 dark:bg-income/20 h-7 w-7 items-center justify-center rounded-full">
            <Icon as={ArrowDownLeft} size={14} className="text-income" />
          </View>
          <Text className="text-sm font-medium text-muted">Income</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <DeltaBadge delta={incomeDelta} type="income" />
          <Text className="text-sm font-semibold text-foreground">
            {userProfile.currencySymbol}{formatNumber(income)}
          </Text>
        </View>
      </View>

      {/* Expense row */}
      <View className="mt-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <View className="bg-expense/10 dark:bg-expense/20 h-7 w-7 items-center justify-center rounded-full">
            <Icon as={ArrowUpRight} size={14} className="text-expense" />
          </View>
          <Text className="text-sm font-medium text-muted">Expenses</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <DeltaBadge delta={expenseDelta} type="expense" />
          <Text className="text-sm font-semibold text-foreground">
            {userProfile.currencySymbol}{formatNumber(expense)}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View className="my-4 h-[1px] bg-divider" />

      {/* Net */}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-foreground">Net</Text>
        <Text className={`text-lg font-bold ${net >= 0 ? 'text-income' : 'text-expense'}`}>
          {net >= 0 ? '+' : ''}{userProfile.currencySymbol}{formatNumber(Math.abs(net))}
        </Text>
      </View>

      {/* Savings info */}
      <View className="mt-2 flex-row items-center gap-1.5">
        {rate !== null && (
          <Text className="text-xs text-muted">
            Saved {rate}% of income · {count} transaction{count !== 1 ? 's' : ''}
          </Text>
        )}
        {rate === null && (
          <Text className="text-xs text-muted">
            {count} transaction{count !== 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </View>
  );
}