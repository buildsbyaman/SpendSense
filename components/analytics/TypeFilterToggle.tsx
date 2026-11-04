import React from 'react';
import { type DimensionValue } from 'react-native';
import { type TypeFilter } from '@/utils/analytics';
import AnimatedSegment from '@/components/ui/animated-segment';
export type { TypeFilter } from '@/utils/analytics';

interface TypeFilterToggleProps {
  value: TypeFilter;
  onChange: (filter: TypeFilter) => void;
  width?: DimensionValue;
}

export function TypeFilterToggle({ value, onChange, width = 132 }: TypeFilterToggleProps) {
  return (
    <AnimatedSegment<TypeFilter>
      width={width}
      options={[
        { label: 'Expense', value: 'expense' as TypeFilter },
        { label: 'Income', value: 'income' as TypeFilter },
      ]}
      selectedValue={value}
      onChange={onChange}
    />
  );
}
