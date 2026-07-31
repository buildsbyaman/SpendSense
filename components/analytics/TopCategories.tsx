import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getCategoryIcon } from '@/utils/transaction';

interface TopCategoriesProps {
  data: { name: string; amount: number; color: string; count: number }[];
  maxAmount: number;
}

export function TopCategories({ data, maxAmount }: TopCategoriesProps) {
  if (data.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-sm text-muted">No data for this period</Text>
      </View>
    );
  }

  return (
    <View>
      {data.slice(0, 5).map((cat, i) => {
        const IconComp = getCategoryIcon(cat.name);
        const pct = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0;
        return (
          <View key={cat.name} className="mb-3 flex-row items-center">
            <View
              className="mr-3 h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: cat.color + '18' }}>
              <Icon as={IconComp} size={16} className="text-foreground" />
            </View>
            <View className="flex-1">
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-sm font-medium text-foreground">{cat.name}</Text>
                <Text className="text-sm font-semibold text-foreground">
                  ${cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: cat.color }}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
