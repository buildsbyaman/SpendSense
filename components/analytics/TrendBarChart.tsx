import React from 'react';
import { useColorScheme } from 'nativewind';
import { BarChart } from 'react-native-gifted-charts';
import { CHART_COLORS, type ColorScheme } from '@/lib/chart-theme';
import { View, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { type TypeFilter } from '@/utils/analytics';
import { niceCeil, formatCompactCurrency } from '@/utils/analytics';
import { useApp } from '@/context/AppContext';

interface TrendBarChartProps {
  data: { day: number; label?: string; income: number; expense: number }[];
  type: TypeFilter;
}

export function TrendBarChart({ data, type }: TrendBarChartProps) {
  const { colorScheme } = useColorScheme();
  const scheme = (colorScheme ?? 'light') as ColorScheme;
  const colors = CHART_COLORS[scheme];

  const { userProfile } = useApp();
  const currencySymbol = userProfile.currencySymbol;

  const showIncome = type === 'income';
  const showExpense = type === 'expense';

  const barColor = showExpense ? colors.expense : colors.income;

  const barData = data.map((d) => ({
    value: showExpense ? d.expense : d.income,
    frontColor: barColor,
    label: d.label || '',
    barWidth: 16,
    barBorderRadius: 6,
  }));

  const maxVal = niceCeil(
    Math.max(...data.map((d) => (showExpense ? d.expense : d.income)), 1)
  );

  const screenWidth = Dimensions.get('window').width;
  const fitWidth = screenWidth - 100;
  const initialSpacing = 10;
  const endSpacing = 10;
  const MIN_SPACING = 20;

  const n = data.length;
  const barWidth = 16;
  const isScrollable =
    n * barWidth + Math.max(n - 1, 0) * MIN_SPACING + initialSpacing + endSpacing > fitWidth;
  const spacing = isScrollable
    ? MIN_SPACING
    : Math.max(
        (fitWidth - initialSpacing - endSpacing - n * barWidth) / Math.max(n - 1, 1),
        2
      );

  return (
    <View style={{ marginLeft: -10 }}>
      <BarChart
        data={barData}
        barWidth={barWidth}
        spacing={spacing}
        width={fitWidth}
        initialSpacing={initialSpacing}
        endSpacing={endSpacing}
        noOfSections={4}
        xAxisColor={colors.grid}
        yAxisColor={colors.grid}
        xAxisLabelTextStyle={{ color: colors.axisLabel, fontSize: 10 }}
        yAxisTextStyle={{ color: colors.axisLabel, fontSize: 10 }}
        formatYLabel={(v: string) => formatCompactCurrency(Number(v), currencySymbol)}
        maxValue={maxVal}
        hideRules
        scrollAnimation={false}
        roundedTop
        pointerConfig={{
          pointerStripHeight: 160,
          pointerStripColor: scheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
          pointerStripWidth: 2,
          pointerStripUptoDataPoint: true,
          pointerColor: barColor,
          radius: 5,
          pointerLabelWidth: 80,
          pointerLabelHeight: 40,
          activatePointersOnLongPress: true,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: any) => {
            const item = items?.[0];
            if (!item) return null;
            const val = item.value;
            return (
              <View className="items-center justify-center rounded-xl border border-black/5 bg-surface px-3 py-1.5 shadow-md dark:border-white/5">
                <Text className="text-sm font-bold text-foreground">
                  {formatCompactCurrency(val, currencySymbol)}
                </Text>
              </View>
            );
          },
        }}
      />
    </View>
  );
}
