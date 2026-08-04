import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Check, Plus } from 'lucide-react-native';
import { LayoutAnimation } from 'react-native';

const PRESET_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

const CUSTOM_KEY = '__CUSTOM__';

interface Props {
  selectedCode: string;
  onSelect: (code: string) => void;
  isCustom: boolean;
  currencyCode: string;
  currencySymbol: string;
}

export function CurrencyPresetGrid({ selectedCode, onSelect, isCustom, currencyCode, currencySymbol }: Props) {
  const selectedPreset = PRESET_CURRENCIES.find((c) => c.code === selectedCode);

  return (
    <View className="mb-6 rounded-xl border border-border bg-surface p-6 shadow-xs">
      <Text className="mb-1 text-sm font-medium text-muted">Active Currency</Text>
      <Text className="mb-4 text-lg font-bold text-foreground">
        {currencyCode} · {currencySymbol}
      </Text>

      <Text className="mb-3 text-sm font-medium text-muted">Switch to</Text>

      <View className="flex-row flex-wrap gap-2">
        {PRESET_CURRENCIES.map((c) => {
          const isSelected = selectedCode === c.code;
          return (
            <TouchableOpacity
              key={c.code}
              onPress={() => onSelect(c.code)}
              activeOpacity={0.75}
              className={`flex-row items-center gap-1.5 rounded-xl border px-3.5 py-2.5 ${
                isSelected
                  ? 'border-primary bg-primary/10 dark:bg-primary/15'
                  : 'border-border bg-surface'
              }`}>
              <Text
                className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                {c.symbol}
              </Text>
              <Text
                className={`text-xs font-semibold ${isSelected ? 'text-primary opacity-80' : 'text-muted'}`}>
                {c.code}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            onSelect(CUSTOM_KEY);
          }}
          activeOpacity={0.75}
          className={`flex-row items-center gap-1.5 rounded-xl border px-3.5 py-2.5 ${
            isCustom
              ? 'border-primary bg-primary/10 dark:bg-primary/15'
              : 'border-dashed border-border bg-surface'
          }`}>
          <Icon
            as={isCustom ? Check : Plus}
            size={13}
            className={isCustom ? 'text-primary' : 'text-muted'}
          />
          <Text
            className={`text-xs font-semibold ${isCustom ? 'text-primary' : 'text-muted'}`}>
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {!isCustom && selectedPreset && (
        <View className="mt-4 flex-row items-center gap-3">
          <View className={`h-[1px] flex-1 bg-divider`} />
          <Text className="text-xs text-muted">{selectedPreset.name}</Text>
          <View className={`h-[1px] flex-1 bg-divider`} />
        </View>
      )}
    </View>
  );
}

export { CUSTOM_KEY, PRESET_CURRENCIES };
