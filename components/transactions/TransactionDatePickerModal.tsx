import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { InAppModal } from '@/components/ui/InAppModal';

interface TransactionDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  date?: Date;
  onSelectDate?: (date: Date) => void;
  calendarMonth: Date;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  mode?: 'single' | 'range';
  initialFrom?: Date | null;
  initialTo?: Date | null;
  onSelectRange?: (range: { from: Date | null; to: Date | null }) => void;
}

export default function TransactionDatePickerModal({
  visible,
  onClose,
  date,
  onSelectDate,
  calendarMonth,
  onNavigateMonth,
  mode = 'single',
  initialFrom = null,
  initialTo = null,
  onSelectRange,
}: TransactionDatePickerModalProps) {
  const [rangeFrom, setRangeFrom] = useState<Date | null>(null);
  const [rangeTo, setRangeTo] = useState<Date | null>(null);
  const [rangeStep, setRangeStep] = useState<'from' | 'to'>('from');

  useEffect(() => {
    if (visible && mode === 'range') {
      setRangeFrom(initialFrom);
      setRangeTo(initialTo);
      setRangeStep('from');
    }
  }, [visible, initialFrom, initialTo, mode]);

  const handleDayPress = (day: Date) => {
    if (mode === 'single') {
      if (onSelectDate) onSelectDate(day);
    } else {
      if (rangeStep === 'from') {
        setRangeFrom(day);
        setRangeTo(null);
        setRangeStep('to');
      } else {
        if (rangeFrom && day < rangeFrom) {
          setRangeTo(rangeFrom);
          setRangeFrom(day);
        } else {
          setRangeTo(day);
        }
        setRangeStep('from');
      }
    }
  };

  const handleConfirm = () => {
    if (mode === 'range' && onSelectRange && (rangeFrom || rangeTo)) {
      onSelectRange({ from: rangeFrom, to: rangeTo });
    }
    onClose();
  };

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const currentYear = calendarMonth.getFullYear();
  const currentMonth = calendarMonth.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(new Date(currentYear, currentMonth, i));
  }

  const isWholeMonth = rangeFrom?.getTime() === new Date(currentYear, currentMonth, 1).getTime() && 
                       rangeTo?.getTime() === new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();
                       
  const isWholeYear = rangeFrom?.getTime() === new Date(currentYear, 0, 1).getTime() && 
                      rangeTo?.getTime() === new Date(currentYear, 11, 31, 23, 59, 59, 999).getTime();

  const { isRendered, animatedStyle, backdropStyle } = useModalAnimation({
    visible,
    type: 'scale',
  });

  return (
    <InAppModal
      visible={isRendered}
      onRequestClose={onClose}
    >
      <View style={{ zIndex: 9999, elevation: 99 }} className="flex-1 justify-center items-center px-6">
        <Animated.View style={[{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, backdropStyle]} />
        <Animated.View style={[animatedStyle, { width: '100%', alignItems: 'center' }]}>
          <View className="bg-surface rounded-2xl border border-border w-full p-6 gap-4 max-w-[340px] shadow-2xl">
          {/* Calendar Header */}
          <View className="flex-row justify-between items-center pb-2">
            <TouchableOpacity onPress={() => onNavigateMonth('prev')} className="p-2.5" hitSlop={{top:6,bottom:6,left:4,right:4}}>
              <Icon as={ChevronLeft} size={20} className="text-foreground" />
            </TouchableOpacity>
            <Text className="font-bold text-base text-foreground">
              {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => onNavigateMonth('next')} className="p-2.5" hitSlop={{top:6,bottom:6,left:4,right:4}}>
              <Icon as={ChevronRight} size={20} className="text-foreground" />
            </TouchableOpacity>
          </View>

          {/* Days of Week */}
          <View className="flex-row mb-1">
            {daysOfWeek.map((day) => (
              <View key={day} className="w-[14.28%] items-center">
                <Text className="text-[10px] text-muted font-bold uppercase">{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Days Grid */}
          <View className="flex-row flex-wrap">
            {daysArray.map((day, idx) => {
              if (!day) {
                return <View key={`empty-${idx}`} className="w-[14.28%] h-9" />;
              }
              let isSelected = false;
              let isRangeStart = false;
              let isRangeEnd = false;
              let isInRange = false;

              if (mode === 'single' && date) {
                isSelected = date.toDateString() === day.toDateString();
              } else if (mode === 'range') {
                if (rangeFrom && rangeFrom.toDateString() === day.toDateString()) {
                  isSelected = true;
                  isRangeStart = true;
                }
                if (rangeTo && rangeTo.toDateString() === day.toDateString()) {
                  isSelected = true;
                  isRangeEnd = true;
                }
                if (rangeFrom && rangeTo && day > rangeFrom && day < rangeTo) {
                  isInRange = true;
                }
              }
              
              const isToday = new Date().toDateString() === day.toDateString();
              
              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  onPress={() => handleDayPress(day)}
                  className="w-[14.28%] h-9 items-center justify-center my-0.5 relative"
                  activeOpacity={0.7}
                >
                  {isInRange && <View className="absolute w-full h-8 bg-primary opacity-20" />}
                  {isRangeStart && rangeTo && <View className="absolute w-1/2 h-8 right-0 bg-primary opacity-20" />}
                  {isRangeEnd && rangeFrom && <View className="absolute w-1/2 h-8 left-0 bg-primary opacity-20" />}

                  <View className={`w-8 h-8 rounded-full items-center justify-center ${isSelected ? 'bg-primary' : isToday && !isInRange ? 'bg-secondary' : ''}`}>
                    <Text className={`text-xs font-semibold ${isSelected ? 'text-white dark:text-black' : isToday && !isInRange ? 'text-primary' : 'text-foreground'}`}>
                      {day.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Modal Actions */}
          {mode === 'range' && (
            <View className="items-center pt-2 pb-1">
              <Text className="text-xs text-muted mb-3">
                Select two dates to act as a range
              </Text>
              <View className="flex-row items-center justify-center gap-4">
                <TouchableOpacity
                  onPress={() => {
                    setRangeFrom(new Date(currentYear, currentMonth, 1));
                    setRangeTo(new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
                  }}
                  className={`py-2 px-4 rounded-xl ${isWholeMonth ? 'bg-primary/20' : ''}`}
                >
                  <Text className={`text-xs ${isWholeMonth ? 'font-bold text-primary' : 'font-medium text-muted'}`}>Whole Month</Text>
                </TouchableOpacity>
                <View className="w-[1px] h-3 bg-border" />
                <TouchableOpacity
                  onPress={() => {
                    setRangeFrom(new Date(currentYear, 0, 1));
                    setRangeTo(new Date(currentYear, 11, 31, 23, 59, 59, 999));
                  }}
                  className={`py-2 px-4 rounded-xl ${isWholeYear ? 'bg-primary/20' : ''}`}
                >
                  <Text className={`text-xs ${isWholeYear ? 'font-bold text-primary' : 'font-medium text-muted'}`}>Whole Year</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View className="flex-row gap-3 pt-2">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 bg-secondary rounded-[6px] items-center"
            >
              <Text className="font-bold text-xs text-foreground">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              className="flex-1 py-3 bg-primary rounded-[6px] items-center"
            >
              <Text className="font-medium text-xs text-white dark:text-black">Confirm</Text>
            </TouchableOpacity>
          </View>
          </View>
        </Animated.View>
      </View>
    </InAppModal>
  );
}
