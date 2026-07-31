import { View, TouchableOpacity } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface MonthNavigatorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  maxYear: number;
  maxMonth: number;
}

export function MonthNavigator({ year, month, onChange, maxYear, maxMonth }: MonthNavigatorProps) {
  const canGoNext = year < maxYear || (year === maxYear && month < maxMonth);

  const goBack = () => {
    if (month === 0) onChange(year - 1, 11);
    else onChange(year, month - 1);
  };

  const goNext = () => {
    if (!canGoNext) return;
    if (month === 11) onChange(year + 1, 0);
    else onChange(year, month + 1);
  };

  return (
    <View className="mb-4 flex-row items-center justify-between">
      <TouchableOpacity
        onPress={goBack}
        className="h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-surface dark:border-gray-900"
        activeOpacity={0.7}>
        <Icon as={ChevronLeft} size={20} className="text-foreground" />
      </TouchableOpacity>

      <Text className="text-lg font-semibold text-foreground">
        {MONTHS[month]} {year}
      </Text>

      <TouchableOpacity
        onPress={goNext}
        disabled={!canGoNext}
        className={`h-10 w-10 items-center justify-center rounded-full border ${canGoNext ? 'border-gray-100 bg-surface dark:border-gray-900' : 'border-transparent bg-gray-50 dark:bg-gray-900'}`}
        activeOpacity={0.7}>
        <Icon
          as={ChevronRight}
          size={20}
          className={canGoNext ? 'text-foreground' : 'text-muted opacity-40'}
        />
      </TouchableOpacity>
    </View>
  );
}
