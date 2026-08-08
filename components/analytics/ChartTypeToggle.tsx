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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TouchableOpacity
      onPress={() => onChange(value === 'line' ? 'bar' : 'line')}
      className="mr-1 rounded-[10px] p-2"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      }}
      activeOpacity={0.7}>
      <Icon
        as={value === 'line' ? BarChart3 : LineChart}
        size={18}
        className="text-foreground"
      />
    </TouchableOpacity>
  );
}
