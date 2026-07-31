import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';

interface MonthYearPickerModalProps {
  visible: boolean;
  onClose: () => void;
  currentYear: number;
  currentMonth: number | null;
  maxYear: number;
  maxMonth: number;
  onSelect: (year: number, month: number | null) => void;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function MonthYearPickerModal({
  visible,
  onClose,
  currentYear,
  currentMonth,
  maxYear,
  maxMonth,
  onSelect,
}: MonthYearPickerModalProps) {
  const [viewYear, setViewYear] = useState(currentYear);

  // Reset viewYear when modal opens
  useEffect(() => {
    if (visible) {
      setViewYear(currentYear);
    }
  }, [visible, currentYear]);

  const canGoNextYear = viewYear < maxYear;

  const handleMonthSelect = (m: number | null) => {
    onSelect(viewYear, m);
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-center bg-black/50 px-6">
          <TouchableWithoutFeedback>
            <View className="rounded-[32px] bg-surface p-6 shadow-sm border border-gray-100 dark:border-gray-900">
              {/* Header */}
              <View className="mb-6 flex-row items-center justify-between">
                <Text className="text-xl font-bold text-foreground">Select Month</Text>
                <TouchableOpacity onPress={onClose} className="rounded-full bg-gray-50 dark:bg-gray-900 p-2">
                  <Icon as={X} size={20} className="text-foreground" />
                </TouchableOpacity>
              </View>

              {/* Year Selector */}
              <View className="mb-6 flex-row items-center justify-between rounded-full bg-secondary p-1">
                <TouchableOpacity
                  onPress={() => setViewYear(y => y - 1)}
                  className="p-3"
                  activeOpacity={0.7}
                >
                  <Icon as={ChevronLeft} size={20} className="text-foreground" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-foreground">{viewYear}</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (canGoNextYear) setViewYear(y => y + 1);
                  }}
                  disabled={!canGoNextYear}
                  className="p-3"
                  activeOpacity={0.7}
                >
                  <Icon as={ChevronRight} size={20} className={canGoNextYear ? "text-foreground" : "text-muted opacity-40"} />
                </TouchableOpacity>
              </View>

              {/* Months Grid */}
              <View className="flex-row flex-wrap justify-between gap-y-4">
                {SHORT_MONTHS.map((monthName, index) => {
                  const isFuture = viewYear === maxYear && index > maxMonth;
                  const isSelected = viewYear === currentYear && index === currentMonth;

                  return (
                    <TouchableOpacity
                      key={monthName}
                      disabled={isFuture}
                      onPress={() => handleMonthSelect(index)}
                      className={`w-[30%] items-center justify-center rounded-full py-3 ${
                        isSelected
                          ? 'bg-primary'
                          : isFuture
                            ? 'bg-transparent'
                            : 'bg-gray-50 dark:bg-gray-900'
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          isSelected
                            ? 'text-[--primary-foreground]'
                            : isFuture
                              ? 'text-muted opacity-40'
                              : 'text-foreground'
                        }`}
                      >
                        {monthName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Entire Year Option */}
              <TouchableOpacity
                onPress={() => handleMonthSelect(null)}
                className={`mt-4 items-center justify-center rounded-full py-4 ${
                  viewYear === currentYear && currentMonth === null
                    ? 'bg-primary'
                    : 'bg-gray-50 dark:bg-gray-900'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-sm font-semibold ${
                    viewYear === currentYear && currentMonth === null
                      ? 'text-[--primary-foreground]'
                      : 'text-foreground'
                  }`}
                >
                  Entire Year {viewYear}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
