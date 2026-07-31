import React from 'react';
import { useColorScheme } from 'nativewind';
import { LineChart } from 'react-native-gifted-charts';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { CHART_COLORS, type ColorScheme } from '@/lib/chart-theme';
import { type TypeFilter } from '@/utils/analytics';

interface TrendChartProps {
  data: { day: number; income: number; expense: number }[];
  type: TypeFilter;
}

function getInterval(dataLen: number) {
  if (dataLen <= 10) return 1;
  if (dataLen <= 15) return 3;
  return 7;
}

export function TrendChart({ data, type }: TrendChartProps) {
  const { colorScheme } = useColorScheme();
  const scheme = (colorScheme ?? 'light') as ColorScheme;
  const colors = CHART_COLORS[scheme];

  const incomeData = data
    .filter((d) => (type === 'expense' ? false : true))
    .map((d) => ({
      value: d.income,
      label: d.day % getInterval(data.length) === 1 || d.day === data.length ? `${d.day}` : '',
    }));

  const expenseData = data.map((d) => ({
    value: d.expense,
    label: d.day % getInterval(data.length) === 1 || d.day === data.length ? `${d.day}` : '',
  }));

  const maxVal = Math.max(
    ...data.map((d) =>
      type === 'income' ? d.income : type === 'expense' ? d.expense : Math.max(d.income, d.expense)
    ),
    1
  );

  if (type === 'all') {
    return (
      <LineChart
        data={incomeData}
        data2={expenseData}
        height={180}
        spacing={(320 - 40) / Math.max(data.length - 1, 1)}
        color1={colors.income}
        color2={colors.expense}
        thickness={2}
        dataPointsColor1={colors.income}
        dataPointsColor2={colors.expense}
        dataPointsRadius={0}
        xAxisColor={colors.grid}
        yAxisColor={colors.grid}
        xAxisLabelTextStyle={{ color: colors.axisLabel, fontSize: 10 }}
        yAxisTextStyle={{ color: colors.axisLabel, fontSize: 10 }}
        hideRules
        areaChart
        startFillColor1={colors.income}
        endFillColor1={colors.income + '00'}
        startFillColor2={colors.expense}
        endFillColor2={colors.expense + '00'}
        startOpacity={0.3}
        endOpacity={0.05}
        curved
        yAxisLabelPrefix="$"
        maxValue={maxVal * 1.1}
        noOfSections={4}
        scrollAnimation={false}
        renderTooltip={() => null}
      />
    );
  }

  const color = type === 'income' ? colors.income : colors.expense;
  const lineData = type === 'income' ? incomeData : expenseData;

  return (
    <LineChart
      data={lineData}
      height={180}
      spacing={(320 - 40) / Math.max(data.length - 1, 1)}
      color={color}
      thickness={2}
      dataPointsColor={color}
      dataPointsRadius={0}
      xAxisColor={colors.grid}
      yAxisColor={colors.grid}
      xAxisLabelTextStyle={{ color: colors.axisLabel, fontSize: 10 }}
      yAxisTextStyle={{ color: colors.axisLabel, fontSize: 10 }}
      hideRules
      areaChart
      startFillColor={color}
      endFillColor={color + '00'}
      startOpacity={0.3}
      endOpacity={0.05}
      curved
      yAxisLabelPrefix="$"
      maxValue={maxVal * 1.1}
      noOfSections={4}
      scrollAnimation={false}
      renderTooltip={() => null}
    />
  );
}
