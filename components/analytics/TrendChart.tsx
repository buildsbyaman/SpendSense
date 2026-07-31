import React from 'react';
import { useColorScheme } from 'nativewind';
import { LineChart } from 'react-native-gifted-charts';
import { View, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { CHART_COLORS, type ColorScheme } from '@/lib/chart-theme';
import { type TypeFilter } from '@/utils/analytics';
import { niceCeil, formatCompactCurrency } from '@/utils/analytics';

interface TrendChartProps {
  data: { day: number; label?: string; income: number; expense: number }[];
  type: TypeFilter;
}



export function TrendChart({ data, type }: TrendChartProps) {
  const { colorScheme } = useColorScheme();
  const scheme = (colorScheme ?? 'light') as ColorScheme;
  const isDark = scheme === 'dark';
  const colors = CHART_COLORS[scheme];

  const showIncome = type === 'income';
  const showExpense = type === 'expense' || type === 'all';

  const expenseData = data.map((d) => ({
    value: d.expense,
    frontColor: colors.expense,
    label: d.label || '',
  }));

  const incomeData = data.map((d) => ({
    value: d.income,
    frontColor: colors.income,
    label: d.label || '',
  }));

  const maxRaw = Math.max(
    ...data.map((d) => (showIncome && !showExpense ? d.income : d.expense)),
    1
  );
  const maxVal = niceCeil(maxRaw);
  const visualOffset = maxVal * 0.01; // 5% floor lift

  const chartColor = showIncome ? colors.income : colors.expense;
  
  const lineData = data.map((d) => {
    const rawVal = showIncome ? d.income : d.expense;
    return {
      value: rawVal + visualOffset,
      customData: { rawValue: rawVal },
      label: d.label || '',
    };
  });
  
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 100;
  const initialSpacing = 10;
  const endSpacing = 10;
  const computedSpacing = (chartWidth - initialSpacing - endSpacing) / Math.max(data.length - 1, 1);
  const spacing = Math.max(computedSpacing, 45); // Guarantee enough space between points

  return (
    <View style={{ marginLeft: -10 }}>
      <LineChart
        areaChart
        data={lineData}
        width={chartWidth}
        hideDataPoints
        spacing={spacing}
        color={chartColor}
        thickness={2.5}
        startFillColor={chartColor}
        startOpacity={isDark ? 0.7 : 0.5}
        endFillColor={chartColor}
        endOpacity={0.05}
        initialSpacing={initialSpacing}
        endSpacing={endSpacing}
        noOfSections={4}
        maxValue={maxVal + visualOffset}
        yAxisColor="transparent"
        xAxisColor="transparent"
        yAxisTextStyle={{ color: colors.axisLabel, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.axisLabel, fontSize: 10 }}
        formatYLabel={(v: string) => formatCompactCurrency(Math.max(0, Number(v) - visualOffset))}
        hideRules
        pointerConfig={{
          pointerStripHeight: 160,
          pointerStripColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
          pointerStripWidth: 2,
          pointerStripUptoDataPoint: true,
          pointerColor: chartColor,
          radius: 5,
          pointerLabelWidth: 80,
          pointerLabelHeight: 40,
          activatePointersOnLongPress: true,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: any) => {
            const item = items[0];
            const val = item.customData?.rawValue ?? item.value;
            return (
              <View className="items-center justify-center bg-surface px-3 py-1.5 rounded-xl shadow-md border border-black/5 dark:border-white/5">
                <Text className="text-foreground font-bold text-sm">
                  {formatCompactCurrency(val)}
                </Text>
              </View>
            );
          },
        }}
      />
    </View>
  );
}
