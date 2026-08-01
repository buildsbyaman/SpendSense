import React from 'react';
import { type TransactionType } from '@/utils/transaction';
import AnimatedSegment from '@/components/ui/animated-segment';

interface TransactionTypeToggleProps {
  type: TransactionType;
  onChange: (type: TransactionType) => void;
}

export default function TransactionTypeToggle({ type, onChange }: TransactionTypeToggleProps) {
  return (
    <AnimatedSegment<TransactionType>
      options={[
        { label: 'Expense', value: 'expense' },
        { label: 'Income', value: 'income' },
      ]}
      selectedValue={type}
      onChange={onChange}
    />
  );
}
