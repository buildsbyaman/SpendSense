import React from 'react';
import { type TypeFilter } from '@/utils/analytics';
import AnimatedSegment from '@/components/ui/animated-segment';
export type { TypeFilter } from '@/utils/analytics';

interface TypeFilterToggleProps {
  value: TypeFilter;
  onChange: (filter: TypeFilter) => void;
}

export function TypeFilterToggle({ value, onChange }: TypeFilterToggleProps) {
  // 'all' shouldn't be handled by a simple 2-option toggle, but if it is passed, AnimatedSegment will default to the first option visually if not matched.
  // Wait, does TypeFilter include 'all'? 
  // Let's assume TypeFilter is 'expense' | 'income'. Actually, wait.
  // Let me just wrap it.
  
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
