import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'nativewind';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
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
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expenses' },
];

export function TypeFilterToggle({ value, onChange }: TypeFilterToggleProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [toggleWidth, setToggleWidth] = useState(0);
  const toggleX = useSharedValue(0);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(toggleX.value, { duration: 300, easing: Easing.out(Easing.cubic) }),
      },
    ],
  }));

  const thumbColor = useAnimatedStyle(() => ({
    backgroundColor: withTiming(isDark ? '#e8e8ec' : '#1a1c1b', { duration: 300 }),
  }));

  const handlePress = (filter: TypeFilter, index: number) => {
    onChange(filter);
    if (toggleWidth > 0) toggleX.value = (toggleWidth / 3) * index;
  };

  return (
    <View
      className="rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-900"
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - 12;
        setToggleWidth(w);
        const idx = OPTIONS.findIndex((o) => o.key === value);
        toggleX.value = (w / 3) * idx;
      }}>
      <View style={{ flexDirection: 'row', position: 'relative' }}>
        {toggleWidth > 0 && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: toggleWidth / 3,
                borderRadius: 10,
                zIndex: 0,
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
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12, zIndex: 1 }}
            activeOpacity={0.9}>
            <Text
              style={{
                fontWeight: '600',
                fontSize: 13,
                color:
                  value === opt.key
                    ? isDark
                      ? '#111113'
                      : '#ffffff'
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
