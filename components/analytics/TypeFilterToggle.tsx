import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { type TypeFilter } from '@/utils/analytics';
export type { TypeFilter } from '@/utils/analytics';

interface TypeFilterToggleProps {
  value: TypeFilter;
  onChange: (filter: TypeFilter) => void;
}

const OPTIONS: { key: TypeFilter; label: string }[] = [
  { key: 'expense', label: 'Expense' },
  { key: 'income', label: 'Income' },
];

export function TypeFilterToggle({ value, onChange }: TypeFilterToggleProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [toggleWidth, setToggleWidth] = useState(0);
  const toggleX = useSharedValue(0);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(toggleX.value, {
          damping: 20,
          stiffness: 250,
          mass: 0.8,
        }),
      },
    ],
  }));

  const thumbColor = useAnimatedStyle(() => ({
    backgroundColor: withTiming(isDark ? '#4a4a52' : '#ffffff', { duration: 300 }),
  }));

  const handlePress = (filter: TypeFilter, index: number) => {
    onChange(filter);
    if (toggleWidth > 0) toggleX.value = (toggleWidth / 2) * index;
  };

  return (
    <View
      className="rounded-full bg-secondary p-1"
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - 8;
        setToggleWidth(w);
        const idx = OPTIONS.findIndex((o) => o.key === value);
        toggleX.value = (w / 2) * idx;
      }}>
      <View style={{ flexDirection: 'row', position: 'relative' }}>
        {toggleWidth > 0 && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: toggleWidth / 2,
                borderRadius: 9999,
                zIndex: 0,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 2,
              },
              thumbStyle,
              thumbColor,
            ]}
          />
        )}
        {OPTIONS.map((opt, i) => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => handlePress(opt.key, i)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 6, zIndex: 1 }}
            activeOpacity={0.9}>
            <Text
              style={{
                fontWeight: '600',
                fontSize: 12,
                color:
                  value === opt.key
                    ? isDark
                      ? '#ffffff'
                      : '#000000'
                    : isDark
                      ? '#8a8a94'
                      : '#9b9b9b',
              }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
