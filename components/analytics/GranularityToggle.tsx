import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';

interface GranularityToggleProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function GranularityToggle({ options, value, onChange }: GranularityToggleProps) {
  return (
    <View className="flex-row items-center rounded-full bg-secondary p-0.5">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
            className={`rounded-full px-3 py-1.5 ${
              isActive ? 'border border-border bg-surface shadow-xs' : ''
            }`}>
            <Text
              className={`text-xs font-semibold ${
                isActive ? 'text-foreground' : 'text-muted'
              }`}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
