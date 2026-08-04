import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { DATA_TYPES, type ImportType } from '@/lib/import/constants';

interface Props {
  selected: ImportType[];
  onToggle: (t: ImportType) => void;
}

export function DataTypeChips({ selected, onToggle }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {DATA_TYPES.map((dt) => {
        const active = selected.includes(dt.key);
        return (
          <TouchableOpacity
            key={dt.key}
            onPress={() => onToggle(dt.key)}
            activeOpacity={0.75}
            className={`flex-row items-center gap-2 rounded-xl border px-4 py-2.5 ${
              active ? 'bg-primary/10 dark:bg-primary/15 border-primary' : 'border-border bg-surface'
            }`}>
            <Icon as={dt.icon} size={16} className={active ? 'text-primary' : 'text-muted'} />
            <Text
              className={`text-sm font-semibold ${
                active ? 'text-primary' : 'text-foreground'
              }`}>
              {dt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
