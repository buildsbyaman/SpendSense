import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Search, Calendar, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';

interface TransactionFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateLabel: string;
  onDatePress: () => void;
  hasActiveFilter: boolean;
  onClearAll: () => void;
}

export default function TransactionFilterBar({
  searchQuery,
  onSearchChange,
  dateLabel,
  onDatePress,
  hasActiveFilter,
  onClearAll,
}: TransactionFilterBarProps) {
  const { colorScheme } = useColorScheme();
  const placeholderColor =
    colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;

  return (
    <View className="mb-4 flex-row items-center gap-2">
      <View className="flex-1 flex-row items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 focus-within:border-primary dark:border-gray-800 dark:bg-gray-900">
        <Icon as={Search} size={16} className="mr-2 text-muted" />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search transactions..."
          placeholderTextColor={placeholderColor}
          className="text-foreground h-[20px] flex-1 p-0 text-sm font-medium"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} className="ml-2 p-1">
            <Icon as={X} size={14} className="text-muted" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={onDatePress}
        className={`flex-row items-center gap-1.5 rounded-full border px-4 py-2.5 ${dateLabel !== 'Any Date' ? 'border-primary bg-primary' : 'border-gray-200 bg-transparent dark:border-gray-800'}`}>
        <Icon
          as={Calendar}
          size={14}
          className={dateLabel !== 'Any Date' ? 'text-white dark:text-black' : 'text-foreground'}
        />
        <Text
          className={`text-xs font-semibold ${dateLabel !== 'Any Date' ? 'text-white dark:text-black' : 'text-foreground'}`}>
          {dateLabel}
        </Text>
      </TouchableOpacity>

      {hasActiveFilter && (
        <TouchableOpacity onPress={onClearAll} className="rounded-full bg-secondary p-2.5">
          <Icon as={X} size={14} className="text-foreground" />
        </TouchableOpacity>
      )}
    </View>
  );
}
