import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react-native';

interface SummaryCardsProps {
  income: number;
  expense: number;
}

export function SummaryCards({ income, expense }: SummaryCardsProps) {
  const net = income - expense;

  return (
    <View className="mb-4 flex-row gap-3">
      <View className="flex-1 rounded-[24px] border border-gray-100 bg-surface p-4 shadow-xs dark:border-gray-900">
        <View className="bg-income/10 dark:bg-income/20 mb-2 h-8 w-8 items-center justify-center rounded-full">
          <Icon as={ArrowDownLeft} size={16} className="text-income" />
        </View>
        <Text className="text-xs font-medium text-muted">Income</Text>
        <Text className="mt-0.5 text-base font-bold text-income">
          ${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      <View className="flex-1 rounded-[24px] border border-gray-100 bg-surface p-4 shadow-xs dark:border-gray-900">
        <View className="bg-expense/10 dark:bg-expense/20 mb-2 h-8 w-8 items-center justify-center rounded-full">
          <Icon as={ArrowUpRight} size={16} className="text-expense" />
        </View>
        <Text className="text-xs font-medium text-muted">Expenses</Text>
        <Text className="mt-0.5 text-base font-bold text-expense">
          ${expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      </View>

      <View className="flex-1 rounded-[24px] border border-gray-100 bg-surface p-4 shadow-xs dark:border-gray-900">
        <View className="bg-accent/10 dark:bg-accent/20 mb-2 h-8 w-8 items-center justify-center rounded-full">
          <Icon as={TrendingUp} size={16} className="text-accent-foreground" />
        </View>
        <Text className="text-xs font-medium text-muted">Net</Text>
        <Text className={`mt-0.5 text-base font-bold ${net >= 0 ? 'text-income' : 'text-expense'}`}>
          {net >= 0 ? '+' : ''}${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
  );
}
