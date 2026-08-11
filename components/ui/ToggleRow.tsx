import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';

interface Props {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function ToggleRow({ label, hint, value, onChange, disabled }: Props) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-1 pr-4">
        <Text className={`text-sm font-medium ${disabled ? 'text-muted' : 'text-foreground'}`}>
          {label}
        </Text>
        {hint ? <Text className="mt-0.5 text-xs text-muted">{hint}</Text> : null}
      </View>
      <TouchableOpacity
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        disabled={disabled}
        onPress={() => onChange(!value)}>
        <View
          className={`h-5 w-9 justify-center rounded-full p-0.5 transition-colors duration-200 ${
            disabled
              ? 'bg-gray-200 dark:bg-gray-800'
              : value
                ? 'bg-income'
                : 'bg-gray-200 dark:bg-gray-800'
          }`}>
          <View
            className={`h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-200 dark:bg-black ${
              value && !disabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}
