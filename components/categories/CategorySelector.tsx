import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { getCategoryIcon, getCategoryColor } from '@/utils/transaction';

interface Props {
  categories: Array<{ name: string; icon?: string; color?: string }>;
  selected: string;
  onSelect: (name: string) => void;
  withMeta?: boolean;
}

export function CategorySelector({ categories, selected, onSelect, withMeta }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2.5 py-1">
        {categories.map((cat) => {
          const isSelected = selected === cat.name;
          const CatIcon = withMeta
            ? getCategoryIcon(cat.name, undefined, cat.icon)
            : undefined;
          const color = withMeta ? getCategoryColor(cat.name, cat.color) : undefined;
          return (
            <TouchableOpacity
              key={cat.name}
              onPress={() => onSelect(cat.name)}
              className={`flex-row items-center gap-2 rounded-xl border px-3 py-2.5 ${
                isSelected
                  ? 'bg-primary/10 dark:bg-primary/15 border-primary'
                  : 'border-border bg-surface'
              }`}>
              {withMeta && color && CatIcon && (
                <View
                  className="h-7 w-7 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${color}15` }}>
                  <Icon as={CatIcon} size={12} color={color} />
                </View>
              )}
              <Text
                className={`text-sm font-semibold ${
                  isSelected ? 'text-primary' : 'text-foreground'
                }`}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
