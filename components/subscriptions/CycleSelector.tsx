import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { type SubscriptionCycle } from '@/utils/subscription';

const CYCLES: SubscriptionCycle[] = ['weekly', 'monthly', 'quarterly', 'yearly'];

interface Props {
  value: SubscriptionCycle;
  onChange: (c: SubscriptionCycle) => void;
}

export function CycleSelector({ value, onChange }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {CYCLES.map((c) => (
        <TouchableOpacity
          key={c}
          onPress={() => onChange(c)}
          className={`min-w-[70px] flex-1 items-center justify-center rounded-xl border px-2 py-2.5 ${
            value === c ? 'bg-primary/10 dark:bg-primary/15 border-primary' : 'border-border bg-surface'
          }`}>
          <Text
            className={`text-xs font-semibold capitalize ${value === c ? 'text-primary' : 'text-foreground'}`}>
            {c}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
