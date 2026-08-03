import React from 'react';
import { useColorScheme } from 'nativewind';
import { BarChart } from 'react-native-gifted-charts';
import { CHART_COLORS, type ColorScheme } from '@/lib/chart-theme';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { niceCeil, formatCompactCurrency } from '@/utils/analytics';

interface MonthlyBarChartProps {
  data: { label: string; income: number; expense: number }[];
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const { colorScheme } = useColorScheme();
  const scheme = (colorScheme ?? 'light') as ColorScheme;
  const colors = CHART_COLORS[scheme];

  const barData = data.map((d) => ({
    value: d.expense,
    frontColor: colors.expense,
    label: d.label,
    barWidth: 16,
    barBorderRadius: 6,
  }));

  const netData = data.map((d) => ({
    value: d.income - d.expense,
    color: colors.income,
  }));

  const maxVal = niceCeil(Math.max(...data.map((d) => d.expense), 1));
  const hasNegativeNet = data.some((d) => d.income - d.expense < 0);

  return (
    <View>
      <BarChart
        data={barData}
        barWidth={16}
        spacing={data.length > 0 ? (280 - 40) / data.length : 280}
        noOfSections={4}
        xAxisColor={colors.grid}
        yAxisColor={colors.grid}
        xAxisLabelTextStyle={{ color: colors.axisLabel, fontSize: 9 }}
        yAxisTextStyle={{ color: colors.axisLabel, fontSize: 9 }}
        formatYLabel={(v: string) => formatCompactCurrency(Number(v))}
        maxValue={maxVal}
        hideRules
        scrollAnimation={false}
        roundedTop
        noOfSectionsBelowXAxis={hasNegativeNet ? 2 : 0}
        lineData={netData}
        lineConfig={{
          color: colors.income,
          thickness: 2,
          curvature: 0.3,
          dataPointsColor: colors.income,
          dataPointsRadius: 3,
          hideDataPoints: false,
        }}
      />
      <View className="mt-3 flex-row justify-center gap-5">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.expense }} />
          <Text className="text-xs text-muted">Expenses</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-0.5 w-4 rounded-full" style={{ backgroundColor: colors.income }} />
          <Text className="text-xs text-muted">Net Savings</Text>
        </View>
      </View>
    </View>
  );
}
