import React from 'react';
import { useColorScheme } from 'nativewind';
import { LineChart } from 'react-native-gifted-charts';
import { View, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { CHART_COLORS, type ColorScheme } from '@/lib/chart-theme';
import { type TypeFilter } from '@/utils/analytics';
import { niceCeil, formatCompactCurrency } from '@/utils/analytics';
import { useApp } from '@/context/AppContext';

interface TrendChartProps {
  data: { day: number; label?: string; income: number; expense: number }[];
  type: TypeFilter;
}

export function TrendChart({ data, type }: TrendChartProps) {
  const { colorScheme } = useColorScheme();
  const scheme = (colorScheme ?? 'light') as ColorScheme;
  const isDark = scheme === 'dark';
  const colors = CHART_COLORS[scheme];
  const { userProfile } = useApp();
  const currencySymbol = userProfile.currencySymbol;

  const showIncome = type === 'income';
  const showExpense = type === 'expense';

  const maxRaw = Math.max(
    ...data.map((d) => Math.max(showIncome ? d.income : 0, showExpense ? d.expense : 0)),
    1
  );
  const maxVal = niceCeil(maxRaw);
  const visualOffset = maxVal * 0.02; // 2% floor lift

  const chartColor = showExpense ? colors.expense : colors.income;

  const lineData = data.map((d) => {
    const rawVal = showExpense ? d.expense : d.income;
    return {
      value: rawVal + visualOffset,
      customData: { rawValue: rawVal },
      label: d.label || '',
    };
  });

  const screenWidth = Dimensions.get('window').width;
  const fitWidth = screenWidth - 100;
  const initialSpacing = 10;
  const endSpacing = 10;
  const MIN_SPACING = 24;

  const n = data.length;
  const contentWidth =
    n > 1 ? (n - 1) * MIN_SPACING + initialSpacing + endSpacing : fitWidth;
  const isScrollable = contentWidth > fitWidth;
  const spacing = isScrollable
    ? MIN_SPACING
    : Math.max((fitWidth - initialSpacing - endSpacing) / Math.max(n - 1, 1), 20);

  const chart = (
    <LineChart
      areaChart
      data={lineData}
      width={fitWidth}
      hideDataPoints
      spacing={spacing}
      scrollAnimation={false}
      showScrollIndicator={false}
      curved
      curvature={0.0}
      color={chartColor}
      thickness={2}
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
      formatYLabel={(v: string) =>
        formatCompactCurrency(Math.max(0, Number(v) - visualOffset), currencySymbol)
      }
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
          const item = items?.[0];
          if (!item) return null;
          const val = item.customData?.rawValue ?? item.value;
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
  );

  return (
    <View style={{ marginLeft: -10 }}>{chart}</View>
  );
}
