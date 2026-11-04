import React from 'react';
import { type DimensionValue } from 'react-native';
import AnimatedSegment from '@/components/ui/animated-segment';
import { type TransactionType } from '@/utils/transaction';

interface CategoryTypeToggleProps {
  type: TransactionType;
  onChange: (type: TransactionType) => void;
  width?: DimensionValue;
}

export default function CategoryTypeToggle({
  type,
  onChange,
  width = 132,
}: CategoryTypeToggleProps) {
  return (
    <AnimatedSegment<TransactionType>
      width={width}
      options={[
        { label: 'Expense', value: 'expense' },
        { label: 'Income', value: 'income' },
      ]}
      selectedValue={type}
      onChange={onChange}
    />
  );
}
