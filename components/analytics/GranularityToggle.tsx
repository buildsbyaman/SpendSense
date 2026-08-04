import React from 'react';
import { View } from 'react-native';
import AnimatedSegment from '@/components/ui/animated-segment';

interface GranularityToggleProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function GranularityToggle({ options, value, onChange }: GranularityToggleProps) {
  return (
    <View style={{ width: 130 }}>
      <AnimatedSegment
        options={options}
        selectedValue={value}
        onChange={onChange}
        borderRadius={9999}
        paddingVertical={4}
        fontSize={12}
      />
    </View>
  );
}
