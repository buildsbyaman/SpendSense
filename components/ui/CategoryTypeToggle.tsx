import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { type TransactionType } from '@/utils/transaction';
import { useColorScheme } from 'nativewind';

interface CategoryTypeToggleProps {
  type: TransactionType;
  onChange: (type: TransactionType) => void;
}

export default function CategoryTypeToggle({ type, onChange }: CategoryTypeToggleProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [toggleWidth, setToggleWidth] = useState(0);
  const toggleX = useSharedValue(0);

  useEffect(() => {
    if (toggleWidth > 0) {
      toggleX.value = type === 'expense' ? 0 : toggleWidth / 2;
    }
  }, [type, toggleWidth]);

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

  const handleTypeChange = (newType: TransactionType) => {
    onChange(newType);
    if (toggleWidth > 0) {
      toggleX.value = newType === 'expense' ? 0 : toggleWidth / 2;
    }
  };

  return (
    <View className="items-center w-full">
      <View
        className="w-[280px] rounded-full bg-secondary p-1"
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width - 8;
          setToggleWidth(w);
          toggleX.value = type === 'expense' ? 0 : w / 2;
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
          
          <TouchableOpacity
            onPress={() => handleTypeChange('expense')}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 6, zIndex: 1 }}
            activeOpacity={0.9}>
            <Text
              style={{
                fontWeight: '600',
                fontSize: 12,
                color: type === 'expense' ? (isDark ? '#ffffff' : '#000000') : (isDark ? '#8a8a94' : '#9b9b9b'),
              }}>
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleTypeChange('income')}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 6, zIndex: 1 }}
            activeOpacity={0.9}>
            <Text
              style={{
                fontWeight: '600',
                fontSize: 12,
                color: type === 'income' ? (isDark ? '#ffffff' : '#000000') : (isDark ? '#8a8a94' : '#9b9b9b'),
              }}>
              Income
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
