import React, { useState, useEffect, useRef } from 'react';
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
  borderRadius?: number;
  paddingVertical?: number;
  fontSize?: number;
}

export default function AnimatedSegment<T extends string>({
  options,
  selectedValue,
  onChange,
  borderRadius = 12,
  paddingVertical = 10,
  fontSize = 13,
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

  const hasInitialized = useRef(false);

  useEffect(() => {
    if (toggleWidth > 0 && options.length > 0) {
      if (!hasInitialized.current) {
        toggleX.value = (toggleWidth / options.length) * activeIndex;
        hasInitialized.current = true;
      } else {
        toggleX.value = withSpring((toggleWidth / options.length) * activeIndex, SPRING_CONFIG);
      }
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
    backgroundColor: withTiming(
      isDark ? 'rgba(255, 255, 255, 0.16)' : '#ffffff',
      { duration: 250 }
    ),
    borderColor: withTiming(
      isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)',
      { duration: 250 }
    ),
    borderWidth: 1,
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
        className="w-full p-1"
        style={{
          borderRadius: borderRadius,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        }}
        onLayout={(e: LayoutChangeEvent) => {
          const w = e.nativeEvent.layout.width - 8;
          setToggleWidth(w);
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
                  borderRadius: borderRadius === 9999 ? 9999 : borderRadius - 4,
                  zIndex: 0,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.08,
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
              style={{ flex: 1, alignItems: 'center', paddingVertical: paddingVertical, zIndex: 1 }}
              activeOpacity={0.9}>
              <Text
                style={{
                  fontWeight: '600',
                  fontSize: fontSize,
                  color:
                    selectedValue === option.value
                      ? isDark
                        ? '#ffffff'
                        : '#000000'
                      : isDark
                        ? '#a1a1aa'
                        : '#71717a',
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
