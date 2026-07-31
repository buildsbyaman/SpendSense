import React from 'react';
import { useColorScheme } from 'nativewind';
import { BarChart } from 'react-native-gifted-charts';
import { CHART_COLORS, type ColorScheme } from '@/lib/chart-theme';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

interface MonthlyBarChartProps {
  data: { label: string; income: number; expense: number }[];
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const { colorScheme } = useColorScheme();
  const scheme = (colorScheme ?? 'light') as ColorScheme;
  const colors = CHART_COLORS[scheme];

  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);

  const barData = data.flatMap((d) => [
    {
      value: d.income,
      frontColor: colors.income,
      label: d.label,
      barWidth: 10,
      spacing: 2,
      barBorderRadius: 4,
    },
    {
      value: d.expense,
      frontColor: colors.expense,
      barWidth: 10,
      spacing: 14,
      barBorderRadius: 4,
    },
  ]);

  return (
    <View>
      <BarChart
        data={barData}
        barWidth={10}
        spacing={(320 - 60) / (data.length * 2)}
        noOfSections={4}
        xAxisColor={colors.grid}
        yAxisColor={colors.grid}
        xAxisLabelTextStyle={{ color: colors.axisLabel, fontSize: 10 }}
        yAxisTextStyle={{ color: colors.axisLabel, fontSize: 10 }}
        yAxisLabelPrefix="$"
        maxValue={maxVal * 1.15}
        hideRules
        scrollAnimation={false}
        roundedTop
        noOfSectionsBelowXAxis={0}
      />
      <View className="mt-3 flex-row justify-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.income }} />
          <Text className="text-xs text-muted">Income</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.expense }} />
          <Text className="text-xs text-muted">Expenses</Text>
        </View>
      </View>
    </View>
  );
}
