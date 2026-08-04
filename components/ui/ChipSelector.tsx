import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

export interface ChipItem {
  key: string;
  label: string;
  icon?: any;
}

interface Props {
  items: ChipItem[];
  selected: string[];
  onToggle: (key: string) => void;
}

export function ChipSelector({ items, selected, onToggle }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {items.map((item) => {
        const active = selected.includes(item.key);
        return (
          <TouchableOpacity
            key={item.key}
            onPress={() => onToggle(item.key)}
            activeOpacity={0.75}
            className={`flex-row items-center gap-2 rounded-xl border px-4 py-2.5 ${
              active
                ? 'border-primary bg-primary/10 dark:bg-primary/15'
                : 'border-border bg-surface'
            }`}>
            {item.icon && (
              <Icon as={item.icon} size={16} className={active ? 'text-primary' : 'text-muted'} />
            )}
            <Text className={`text-sm font-semibold ${active ? 'text-primary' : 'text-foreground'}`}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
