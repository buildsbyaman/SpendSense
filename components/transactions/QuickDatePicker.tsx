import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Calendar } from 'lucide-react-native';
import { formatDatePickerDate } from '@/utils/transaction';

interface Props {
  date: Date;
  onSelectToday: () => void;
  onSelectYesterday?: () => void;
  onOpenCalendar: () => void;
}

export function QuickDatePicker({
  date,
  onSelectToday,
  onSelectYesterday,
  onOpenCalendar,
}: Props) {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const isYesterday = onSelectYesterday ? date.toDateString() === yesterdayStr : false;
  const isCustom = !isToday && !isYesterday;

  const quickBtn = (active: boolean, onPress: () => void, label: string) => (
    <TouchableOpacity
      onPress={onPress}
      className={`h-9 flex-1 items-center justify-center rounded-lg border px-2 ${
        active ? 'border-primary bg-primary/10 dark:bg-primary/15' : 'border-border bg-surface'
      }`}>
      <Text className={`text-xs font-semibold ${active ? 'text-primary' : 'text-foreground'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-row gap-2">
      {quickBtn(isToday, onSelectToday, 'Today')}
      {onSelectYesterday && quickBtn(isYesterday, onSelectYesterday, 'Yesterday')}
      <TouchableOpacity
        onPress={onOpenCalendar}
        className={`h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border px-2 ${
          isCustom ? 'border-primary bg-primary/10 dark:bg-primary/15' : 'border-border bg-surface'
        }`}>
        <Icon as={Calendar} size={12} className={isCustom ? 'text-primary' : 'text-foreground'} />
        <Text
          className={`text-xs font-semibold ${isCustom ? 'text-primary' : 'text-foreground'}`}
          numberOfLines={1}>
          {formatDatePickerDate(date)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
