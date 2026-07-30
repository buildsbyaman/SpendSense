import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Search, Calendar, X } from 'lucide-react-native';

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
  return (
    <View className="flex-row items-center gap-2 mb-4">
      <View className="flex-1 flex-row items-center bg-gray-50 dark:bg-gray-900 px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-800 focus-within:border-primary">
        <Icon as={Search} size={16} className="text-muted mr-2" />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search transactions..."
          placeholderTextColor="#9ca3af"
          className="flex-1 text-sm text-foreground font-medium p-0 h-[20px]"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} className="ml-2 p-1">
            <Icon as={X} size={14} className="text-muted" />
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity
        onPress={onDatePress}
        className={`flex-row items-center gap-1.5 px-4 py-2.5 rounded-full border ${dateLabel !== 'Any Date' ? 'bg-primary border-primary' : 'bg-transparent border-gray-200 dark:border-gray-800'}`}
      >
        <Icon as={Calendar} size={14} className={dateLabel !== 'Any Date' ? 'text-white dark:text-black' : 'text-foreground'} />
        <Text className={`text-xs font-semibold ${dateLabel !== 'Any Date' ? 'text-white dark:text-black' : 'text-foreground'}`}>
          {dateLabel}
        </Text>
      </TouchableOpacity>
      
      {hasActiveFilter && (
        <TouchableOpacity
          onPress={onClearAll}
          className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800"
        >
          <Icon as={X} size={14} className="text-foreground" />
        </TouchableOpacity>
      )}
    </View>
  );
}
