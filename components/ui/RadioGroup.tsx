import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { triggerKeypadHaptic } from '@/utils/haptics';

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  icon?: any;
  description?: string;
}

export interface RadioGroupProps<T extends string> {
  label?: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layout?: 'horizontal' | 'vertical';
  className?: string;
  disabled?: boolean;
}

export function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  layout = 'horizontal',
  className = '',
  disabled = false,
}: RadioGroupProps<T>) {
  const handleSelect = (val: T) => {
    if (disabled || val === value) return;
    triggerKeypadHaptic();
    onChange(val);
  };

  return (
    <View className={className}>
      {label ? (
        <Text className="mb-3 text-sm font-medium text-muted">{label}</Text>
      ) : null}
      <View
        className={
          layout === 'horizontal'
            ? 'flex-row flex-wrap items-center gap-x-7 gap-y-3'
            : 'flex-col gap-3.5'
        }>
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => handleSelect(opt.value)}
              disabled={disabled}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="flex-row items-center gap-2.5 py-1">
              {/* Radio Outer Circle */}
              <View
                className={`h-5 w-5 items-center justify-center rounded-full ${
                  isSelected
                    ? 'border-2 border-primary'
                    : 'border border-black/25 dark:border-white/30'
                }`}>
                {isSelected ? (
                  <View className="h-2.5 w-2.5 rounded-full bg-primary" />
                ) : null}
              </View>

              {/* Optional Icon */}
              {opt.icon ? (
                <Icon
                  as={opt.icon}
                  size={15}
                  className={isSelected ? 'text-foreground' : 'text-muted'}
                />
              ) : null}

              {/* Label & Optional Description */}
              <View>
                <Text
                  className={`text-sm tracking-tight ${
                    isSelected
                      ? 'font-semibold text-foreground'
                      : 'font-medium text-muted'
                  }`}>
                  {opt.label}
                </Text>
                {opt.description ? (
                  <Text className="mt-0.5 text-xs text-muted">
                    {opt.description}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default RadioGroup;

