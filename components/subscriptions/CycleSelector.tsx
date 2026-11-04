import React from 'react';
import { type SubscriptionCycle } from '@/utils/subscription';
import AnimatedSegment from '@/components/ui/animated-segment';

const CYCLES: SubscriptionCycle[] = ['weekly', 'monthly', 'quarterly', 'yearly'];

interface Props {
  value: SubscriptionCycle;
  onChange: (c: SubscriptionCycle) => void;
}

export function CycleSelector({ value, onChange }: Props) {
  return (
    <AnimatedSegment<SubscriptionCycle>
      options={CYCLES.map((c) => ({
        label: c.charAt(0).toUpperCase() + c.slice(1),
        value: c,
      }))}
      selectedValue={value}
      onChange={onChange}
      paddingVertical={6}
      fontSize={12}
    />
  );
}
