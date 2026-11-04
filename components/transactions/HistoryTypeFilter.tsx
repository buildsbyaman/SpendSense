import React from 'react';
import AnimatedSegment from '@/components/ui/animated-segment';

export type HistoryType = 'all' | 'expense' | 'income' | 'transfer';

interface HistoryTypeFilterProps {
  value: HistoryType;
  onChange: (type: HistoryType) => void;
  maxWidth?: number;
}

const OPTIONS: { label: string; value: HistoryType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Transfer', value: 'transfer' },
];

export default function HistoryTypeFilter({
  value,
  onChange,
  maxWidth = 340,
}: HistoryTypeFilterProps) {
  return (
    <AnimatedSegment<HistoryType>
      maxWidth={maxWidth}
      options={OPTIONS}
      selectedValue={value}
      onChange={onChange}
    />
  );
}
