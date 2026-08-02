import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { useColorScheme } from 'nativewind';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface AnimatedSegmentProps<T extends string> {
  options: SegmentOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
}

export default function AnimatedSegment<T extends string>({
  options,
  selectedValue,
  onChange,
}: AnimatedSegmentProps<T>) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [toggleWidth, setToggleWidth] = useState(0);
  const toggleX = useSharedValue(0);

  const activeIndex = (() => {
    const idx = options.findIndex((o) => o.value === selectedValue);
    return idx === -1 ? 0 : idx;
  })();

  const SPRING_CONFIG = {
    damping: 20,
    stiffness: 250,
    mass: 0.8,
  };

  useEffect(() => {
    if (toggleWidth > 0 && options.length > 0) {
      toggleX.value = withSpring((toggleWidth / options.length) * activeIndex, SPRING_CONFIG);
    }
  }, [activeIndex, toggleWidth, options.length]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: toggleX.value,
      },
    ],
  }));

  const thumbColor = useAnimatedStyle(() => ({
    backgroundColor: withTiming(isDark ? '#4a4a52' : '#ffffff', { duration: 300 }),
  }));

  const handleSelect = (index: number) => {
    onChange(options[index].value);
    if (toggleWidth > 0 && options.length > 0) {
      toggleX.value = withSpring((toggleWidth / options.length) * index, SPRING_CONFIG);
    }
  };

  return (
    <View className="w-full items-center">
      <View
        className="w-full rounded-full bg-secondary p-1"
        onLayout={(e: LayoutChangeEvent) => {
          const w = e.nativeEvent.layout.width - 8;
          setToggleWidth(w);
          if (options.length > 0) {
            toggleX.value = withSpring((w / options.length) * activeIndex, SPRING_CONFIG);
          }
        }}>
        <View style={{ flexDirection: 'row', position: 'relative' }}>
          {toggleWidth > 0 && (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: toggleWidth / options.length,
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
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleSelect(index)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 10, zIndex: 1 }}
              activeOpacity={0.9}>
              <Text
                style={{
                  fontWeight: '600',
                  fontSize: 13,
                  color:
                    selectedValue === option.value
                      ? isDark
                        ? '#ffffff'
                        : '#000000'
                      : isDark
                        ? '#8a8a94'
                        : '#9b9b9b',
                }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
