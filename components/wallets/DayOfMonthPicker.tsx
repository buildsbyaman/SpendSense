import { useEffect, useRef } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';

interface DayOfMonthPickerProps {
  value: number;
  onChange: (day: number) => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
// Fixed chip size keeps every day the same width so the auto-scroll offset is
// exact: chip width (40) + gap (8) = 48px per step.
const CHIP_STEP = 48;

export function DayOfMonthPicker({ value, onChange }: DayOfMonthPickerProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const index = DAYS.indexOf(value);
    if (index < 0) return;
    // Keep the selected day roughly a third from the left edge; the native
    // scroll view clamps past the content end automatically.
    scrollRef.current?.scrollTo({ x: Math.max(0, index * CHIP_STEP - 120), animated: true });
  }, [value]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingRight: 8 }}>
      {DAYS.map((day) => {
        const isActive = day === value;
        return (
          <TouchableOpacity
            key={day}
            activeOpacity={0.7}
            onPress={() => onChange(day)}
            className={`h-9 w-10 items-center justify-center rounded-md border ${
              isActive ? 'bg-primary/10 border-primary' : 'border-border bg-surface'
            }`}>
            <Text
              className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
              {day}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
