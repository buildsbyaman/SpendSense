import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { formatNumber } from '@/utils/wallet';

interface Props {
  income: number;
  expense: number;
  currencySymbol: string;
}

export function QuickStatsCards({ income, expense, currencySymbol }: Props) {
  return (
    <View className="mb-4 flex-row gap-3">
      <View className="flex-1 flex-row items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-income/10 dark:bg-income/20">
          <Icon as={ArrowDownLeft} size={18} className="text-income" />
        </View>
        <View>
          <Text className="text-xs font-medium text-muted">Income</Text>
          <Text className="mt-0.5 text-sm font-bold text-income">
            {currencySymbol}
            {formatNumber(income)}
          </Text>
        </View>
      </View>
      <View className="flex-1 flex-row items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-expense/10 dark:bg-expense/20">
          <Icon as={ArrowUpRight} size={18} className="text-expense" />
        </View>
        <View>
          <Text className="text-xs font-medium text-muted">Expenses</Text>
          <Text className="mt-0.5 text-sm font-bold text-expense">
            {currencySymbol}
            {formatNumber(expense)}
          </Text>
        </View>
      </View>
    </View>
  );
}
