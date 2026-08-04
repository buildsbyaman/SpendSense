import React from 'react';
import { type TypeFilter } from '@/utils/analytics';
import AnimatedSegment from '@/components/ui/animated-segment';
export type { TypeFilter } from '@/utils/analytics';

interface TypeFilterToggleProps {
  value: TypeFilter;
  onChange: (filter: TypeFilter) => void;
}

export function TypeFilterToggle({ value, onChange }: TypeFilterToggleProps) {
  return (
    <AnimatedSegment<TypeFilter>
      options={[
        { label: 'Expense', value: 'expense' as TypeFilter },
        { label: 'Income', value: 'income' as TypeFilter },
      ]}
      selectedValue={value}
      onChange={onChange}
    />
  );
}
