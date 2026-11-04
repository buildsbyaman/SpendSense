import { useEffect, useRef } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';

interface DayOfMonthPickerProps {
  label: string;
  value: number;
  enabled: boolean;
  onChange: (day: number) => void;
  onToggleEnabled: (enabled: boolean) => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const CHIP_WIDTH = 42;
const CHIP_GAP = 8;
const CHIP_STEP = CHIP_WIDTH + CHIP_GAP; // 50px

export function DayOfMonthPicker({
  label,
  value,
  enabled,
  onChange,
  onToggleEnabled,
}: DayOfMonthPickerProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!enabled) {
      scrollRef.current?.scrollTo({ x: 0, animated: true });
      return;
    }
    const index = DAYS.indexOf(value);
    if (index >= 0) {
      scrollRef.current?.scrollTo({
        x: Math.max(0, (index + 1) * CHIP_STEP - 110),
        animated: true,
      });
    }
  }, [value, enabled]);

  return (
    <View>
      {/* Label Row with generous breathing room */}
      <View className="mb-2 flex-row items-center justify-between px-5">
        <Text className="text-xs font-semibold text-muted">{label}</Text>
        <Text className="text-xs font-bold text-foreground">
          {enabled ? `Day ${value}` : 'Off'}
        </Text>
      </View>

      {/* Horizontal Squarish Day Cards */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 6,
          gap: CHIP_GAP,
          alignItems: 'center',
        }}>
        {/* Off Squarish Card */}
        <TouchableOpacity
          onPress={() => onToggleEnabled(false)}
          activeOpacity={0.7}
          className={`h-[42px] min-w-[50px] items-center justify-center rounded-xl border px-3 active:scale-95 ${
            !enabled
              ? 'border-2 border-black bg-surface dark:border-white'
              : 'border-border bg-surface/60'
          }`}>
          <Text
            className={`text-xs ${
              !enabled ? 'font-bold text-foreground' : 'font-medium text-muted'
            }`}>
            off
          </Text>
        </TouchableOpacity>

        {/* 1..31 Squarish Day Cards */}
        {DAYS.map((day) => {
          const isSelected = enabled && value === day;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => {
                onChange(day);
                if (!enabled) onToggleEnabled(true);
              }}
              activeOpacity={0.7}
              className={`h-[42px] w-[42px] items-center justify-center rounded-xl border active:scale-95 ${
                isSelected
                  ? 'border-2 border-black bg-surface dark:border-white'
                  : 'border-border bg-surface/60'
              }`}>
              <Text
                className={`text-sm ${
                  isSelected ? 'font-bold text-foreground' : 'font-medium text-muted'
                }`}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
