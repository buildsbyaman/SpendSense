import React from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { PieChart } from 'react-native-gifted-charts';
import { Text } from '@/components/ui/text';
import { CHART_COLORS, type ColorScheme } from '@/lib/chart-theme';

interface CategoryDonutProps {
  data: { name: string; amount: number; color: string; count: number }[];
  totalLabel: string;
}

export function CategoryDonut({ data, totalLabel }: CategoryDonutProps) {
  const { colorScheme } = useColorScheme();
  const scheme = (colorScheme ?? 'light') as ColorScheme;
  const colors = CHART_COLORS[scheme];

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  const pieData = data.map((d) => ({
    value: d.amount,
    color: d.color,
    text: '',
  }));

  if (data.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-sm text-muted">No data for this period</Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center">
      <View className="w-[180px] items-center justify-center">
        <PieChart
          donut
          radius={80}
          innerRadius={55}
          data={pieData}
          centerLabelComponent={() => (
            <View className="items-center">
              <Text className="text-xs text-muted">{totalLabel}</Text>
              <Text className="text-base font-bold text-foreground">
                ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}
        />
      </View>
      <View className="ml-2 flex-1">
        {data.slice(0, 5).map((d) => (
          <View key={d.name} className="mb-2 flex-row items-center">
            <View className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <Text className="flex-1 text-sm text-foreground">{d.name}</Text>
            <Text className="ml-1 text-sm font-semibold text-foreground">
              ${d.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
