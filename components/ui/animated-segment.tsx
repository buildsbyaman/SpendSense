import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, LayoutChangeEvent, type DimensionValue } from 'react-native';
import { useColorScheme } from 'nativewind';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
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
  padding?: number;
  fontSize?: number;
  width?: DimensionValue;
  maxWidth?: DimensionValue;
}

export default function AnimatedSegment<T extends string>({
  options,
  selectedValue,
  onChange,
  borderRadius = 9999,
  paddingVertical = 4.5,
  padding = 2.5,
  fontSize = 11.5,
  width,
  maxWidth,
}: AnimatedSegmentProps<T>) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [containerWidth, setContainerWidth] = useState<number>(
    typeof width === 'number' ? width : 0
  );

  const count = options.length;
  const tabWidth = containerWidth > 0 && count > 0
    ? (containerWidth - padding * 2) / count
    : 0;

  const activeIndex = options.findIndex((o) => o.value === selectedValue);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  const translateX = useSharedValue(0);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (tabWidth > 0) {
      if (!hasInitialized.current) {
        translateX.value = safeIndex * tabWidth;
        hasInitialized.current = true;
      } else {
        translateX.value = withSpring(safeIndex * tabWidth, {
          damping: 24,
          stiffness: 280,
          mass: 0.6,
        });
      }
    }
  }, [safeIndex, tabWidth]);

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const activeTextColor = isDark ? '#000000' : '#FFFFFF';
  const inactiveTextColor = isDark ? '#A1A1AA' : '#71717A';

  return (
    <View
      style={{
        width: width ?? '100%',
        maxWidth,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        onLayout={(e: LayoutChangeEvent) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setContainerWidth(w);
        }}
        style={{
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          position: 'relative',
          padding: padding,
          borderRadius: 9999,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F2F2F5',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E4E4E8',
        }}>
        {/* Animated Sliding Solid Thumb */}
        {tabWidth > 0 && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: padding,
                bottom: padding,
                left: padding,
                width: tabWidth,
                borderRadius: 9999,
                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1.5 },
                shadowOpacity: isDark ? 0.3 : 0.18,
                shadowRadius: 2.5,
                elevation: 2,
              },
              thumbAnimatedStyle,
            ]}
          />
        )}

        {options.map((opt) => {
          const isSelected = opt.value === selectedValue;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.7}
              style={[
                { outline: 'none' } as any,
                {
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical,
                  zIndex: 1,
                },
              ]}
              className="z-10 focus:outline-none">
              <Text
                style={{
                  color: isSelected ? activeTextColor : inactiveTextColor,
                  fontSize,
                  fontWeight: '600',
                }}
                numberOfLines={1}
                className="text-center font-semibold">
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
