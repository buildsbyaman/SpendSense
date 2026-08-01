import React from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { PieChart } from 'react-native-gifted-charts';
import { Text } from '@/components/ui/text';
import { CHART_COLORS, type ColorScheme } from '@/lib/chart-theme';
import { useApp } from '@/context/AppContext';

interface CategoryDonutProps {
  data: { name: string; amount: number; color: string; count: number }[];
  totalLabel: string;
}

const MAX_LEGEND = 5;

export function CategoryDonut({ data, totalLabel }: CategoryDonutProps) {
  const { colorScheme } = useColorScheme();
  const scheme = (colorScheme ?? 'light') as ColorScheme;
  const colors = CHART_COLORS[scheme];
  const { userProfile } = useApp();

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  if (data.length === 0 || total === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-sm text-muted">No data for this period</Text>
      </View>
    );
  }

  const pieData = data.map((d) => ({ value: d.amount, color: d.color, text: '' }));

  const renderLegendItem = (d: any) => {
    const pct = total > 0 ? ((d.amount / total) * 100).toFixed(0) : '0';
    return (
      <View key={d.name} className="mb-3 flex-row items-center w-full">
        <View
          className="mr-3 h-3 w-3 rounded-full"
          style={{ backgroundColor: d.color }}
        />
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-foreground pr-1" numberOfLines={1}>
              {d.name}
            </Text>
            <Text className="ml-1 text-sm text-muted shrink-0">{pct}%</Text>
          </View>
          <Text className="text-sm font-semibold text-foreground">
            {userProfile.currencySymbol}{d.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-col w-full">
      <View className="w-full items-center justify-center py-6">
        <PieChart
          donut
          radius={90}
          innerRadius={65}
          innerCircleColor={colors.surface}
          data={pieData}
          centerLabelComponent={() => (
            <View className="items-center">
              <Text className="text-md text-muted mb-1">{totalLabel}</Text>
              <Text className="text-xl font-bold text-foreground">
                {userProfile.currencySymbol}{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}
        />
      </View>
      
      <View className="mt-2 flex-col w-full px-2">
        {data.map(renderLegendItem)}
      </View>
    </View>
  );
}
