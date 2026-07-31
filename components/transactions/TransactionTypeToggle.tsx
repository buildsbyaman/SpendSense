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
import { type TransactionType } from '@/utils/transaction';

interface TransactionTypeToggleProps {
  type: TransactionType;
  onChange: (type: TransactionType) => void;
}

export default function TransactionTypeToggle({ type, onChange }: TransactionTypeToggleProps) {
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

  // Primary color: black in light mode, white in dark mode
  const thumbColor = useAnimatedStyle(() => ({
    backgroundColor: withTiming(isDark ? '#ffffff' : '#000000', { duration: 300 }),
  }));

  const handleTypeChange = (newType: TransactionType) => {
    onChange(newType);
    toggleX.value = newType === 'expense' ? 0 : toggleWidth / 2;
  };

  const activeTextColor = isDark ? '#000000' : '#ffffff';
  const inactiveTextColor = isDark ? '#6b7280' : '#9ca3af';

  return (
    <View
      className="rounded-full bg-gray-100 p-1.5 dark:bg-gray-900"
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - 12;
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
                borderRadius: 999,
                zIndex: 0,
              },
              thumbStyle,
              thumbColor,
            ]}
          />
        )}
        <TouchableOpacity
          onPress={() => handleTypeChange('expense')}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 12, zIndex: 1 }}
          activeOpacity={0.9}>
          <Text
            style={{
              fontWeight: '600',
              fontSize: 13,
              color: type === 'expense' ? activeTextColor : inactiveTextColor,
            }}>
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleTypeChange('income')}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 12, zIndex: 1 }}
          activeOpacity={0.9}>
          <Text
            style={{
              fontWeight: '600',
              fontSize: 13,
              color: type === 'income' ? activeTextColor : inactiveTextColor,
            }}>
            Income
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
