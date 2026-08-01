import React from 'react';
import { type TransactionType } from '@/utils/transaction';
import AnimatedSegment from '@/components/ui/animated-segment';

interface CategoryTypeToggleProps {
  type: TransactionType;
  onChange: (type: TransactionType) => void;
}

export default function CategoryTypeToggle({ type, onChange }: CategoryTypeToggleProps) {
  return (
    <View className="w-[280px] self-center">
      <AnimatedSegment<TransactionType>
        options={[
          { label: 'Expense', value: 'expense' },
          { label: 'Income', value: 'income' },
        ]}
        selectedValue={type}
        onChange={onChange}
      />
    </View>
  );
}
