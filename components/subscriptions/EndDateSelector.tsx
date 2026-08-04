import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Calendar } from 'lucide-react-native';
import AnimatedSegment from '@/components/ui/animated-segment';
import { formatDatePickerDate } from '@/utils/transaction';

interface Props {
  hasEndDate: boolean;
  endDate: Date;
  nextDate: Date;
  onChangeHasEndDate: (has: boolean) => void;
  onChangeEndDate: (d: Date) => void;
  onOpenPicker: () => void;
}

export function EndDateSelector({
  hasEndDate,
  endDate,
  nextDate,
  onChangeHasEndDate,
  onChangeEndDate,
  onOpenPicker,
}: Props) {
  return (
    <View>
      <Text className="mb-2 ml-1 text-sm text-muted">Expiration Date</Text>
      <AnimatedSegment<'never' | 'set'>
        options={[
          { label: 'Never Expires', value: 'never' },
          { label: 'Set End Date', value: 'set' },
        ]}
        selectedValue={hasEndDate ? 'set' : 'never'}
        onChange={(val) => {
          const isSet = val === 'set';
          onChangeHasEndDate(isSet);
          if (isSet && endDate < nextDate) {
            const d = new Date(nextDate);
            d.setMonth(d.getMonth() + 1);
            onChangeEndDate(d);
          }
        }}
      />
      {hasEndDate && (
        <View className="mt-4 flex-row justify-center">
          <TouchableOpacity
            onPress={onOpenPicker}
            className="bg-primary/10 flex-row items-center gap-1.5 rounded-xl border border-primary px-5 py-2.5">
            <Icon as={Calendar} size={14} className="text-primary" />
            <Text className="text-sm font-semibold text-primary">
              {formatDatePickerDate(endDate)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
