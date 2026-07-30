import React, { useState } from 'react';
import { View, TouchableOpacity, useColorScheme } from 'react-native';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [toggleWidth, setToggleWidth] = useState(0);
  const toggleX = useSharedValue(0);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(toggleX.value, { duration: 300, easing: Easing.out(Easing.cubic) }) }],
  }));

  const thumbColor = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      type === 'expense'
        ? (isDark ? '#fca5a5' : '#f87171')
        : (isDark ? '#86efac' : '#4ade80'),
      { duration: 300 }
    ),
  }));

  const handleTypeChange = (newType: TransactionType) => {
    onChange(newType);
    toggleX.value = newType === 'expense' ? 0 : toggleWidth / 2;
  };

  return (
    <View
      className="bg-gray-50 dark:bg-gray-900 p-1.5 rounded-2xl"
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - 12;
        setToggleWidth(w);
        toggleX.value = type === 'expense' ? 0 : w / 2;
      }}
    >
      <View style={{ flexDirection: 'row', position: 'relative' }}>
        {toggleWidth > 0 && (
          <Animated.View
            style={[{
              position: 'absolute',
              top: 0, bottom: 0,
              width: toggleWidth / 2,
              borderRadius: 10,
              zIndex: 0,
            }, thumbStyle, thumbColor]}
          />
        )}
        <TouchableOpacity
          onPress={() => handleTypeChange('expense')}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 12, zIndex: 1 }}
          activeOpacity={0.9}
        >
          <Text
            style={{
              fontWeight: '600',
              fontSize: 13,
              color: type === 'expense' ? '#7f1d1d' : (isDark ? '#707070' : '#9ca3af'),
            }}
          >
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleTypeChange('income')}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 12, zIndex: 1 }}
          activeOpacity={0.9}
        >
          <Text
            style={{
              fontWeight: '600',
              fontSize: 13,
              color: type === 'income' ? '#14532d' : (isDark ? '#707070' : '#9ca3af'),
            }}
          >
            Income
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
