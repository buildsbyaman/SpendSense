import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react-native';
import { MonthYearPickerModal } from './MonthYearPickerModal';

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthNavigatorProps {
  year: number;
  month: number | null;
  onChange: (year: number, month: number | null) => void;
  maxYear: number;
  maxMonth: number;
  allowAllYear?: boolean;
}

export function MonthNavigator({ year, month, onChange, maxYear, maxMonth, allowAllYear = true }: MonthNavigatorProps) {
  const canGoNext = month !== null 
    ? (year < maxYear || (year === maxYear && month < maxMonth))
    : year < maxYear;

  const goBack = () => {
    if (month !== null) {
      if (month === 0) onChange(year - 1, 11);
      else onChange(year, month - 1);
    } else {
      if (allowAllYear) onChange(year - 1, null);
    }
  };

  const goNext = () => {
    if (!canGoNext) return;
    if (month !== null) {
      if (month === 11) onChange(year + 1, 0);
      else onChange(year, month + 1);
    } else {
      if (allowAllYear) onChange(year + 1, null);
    }
  };

  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <View className="flex-row items-center rounded-full border border-border bg-surface px-1 py-0.5">
      <TouchableOpacity
        onPress={goBack}
        style={{ outline: 'none' } as any}
        className="p-2 focus:outline-none"
        hitSlop={{top:6,bottom:6,left:4,right:4}}
        activeOpacity={0.7}>
        <Icon as={ChevronLeft} size={18} className="text-foreground" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={{ outline: 'none' } as any}
        className="flex-row items-center justify-center min-w-[96px] px-2 py-1.5 gap-1 focus:outline-none"
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text className="text-sm font-bold text-foreground">
          {month !== null ? `${SHORT_MONTHS[month]} '${year.toString().slice(-2)}` : `${year}`}
        </Text>
        <Icon as={ChevronDown} size={14} className="text-foreground opacity-50" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={goNext}
        disabled={!canGoNext}
        style={{ outline: 'none' } as any}
        className="p-2 focus:outline-none"
        hitSlop={{top:6,bottom:6,left:4,right:4}}
        activeOpacity={0.7}>
        <Icon
          as={ChevronRight}
          size={18}
          className={canGoNext ? 'text-foreground' : 'text-muted opacity-40'}
        />
      </TouchableOpacity>
    </View>

    <MonthYearPickerModal
      visible={isModalVisible}
      onClose={() => setIsModalVisible(false)}
      currentYear={year}
      currentMonth={month}
      maxYear={maxYear}
      maxMonth={maxMonth}
      allowAllYear={allowAllYear}
      onSelect={(y, m) => {
        onChange(y, m);
      }}
    />
    </>
  );
}
