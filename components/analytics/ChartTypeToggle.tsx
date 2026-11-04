import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { BarChart3, LineChart } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

interface ChartTypeToggleProps {
  value: 'line' | 'bar';
  onChange: (value: 'line' | 'bar') => void;
}

export function ChartTypeToggle({ value, onChange }: ChartTypeToggleProps) {
  return (
    <TouchableOpacity
      onPress={() => onChange(value === 'line' ? 'bar' : 'line')}
      className="mr-1 h-[30px] w-[30px] items-center justify-center rounded-full border border-border bg-surface shadow-xs active:scale-95 focus:outline-none"
      style={{ outline: 'none' } as any}
      activeOpacity={0.7}>
      <Icon
        as={value === 'line' ? BarChart3 : LineChart}
        size={14}
        className="text-foreground"
      />
    </TouchableOpacity>
  );
}
