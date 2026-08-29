import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  LayoutAnimation,
  type View as ViewType,
} from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Search, Calendar, X, SlidersHorizontal } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';

interface TransactionFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateLabel: string;
  onDatePress: () => void;
  hasActiveFilter: boolean;
  onClearAll: () => void;
  onFilterPress: (rect: { x: number; y: number; width: number; height: number }) => void;
  activeFilterCount: number;
}

export default function TransactionFilterBar({
  searchQuery,
  onSearchChange,
  dateLabel,
  onDatePress,
  hasActiveFilter,
  onClearAll,
  onFilterPress,
  activeFilterCount,
}: TransactionFilterBarProps) {
  const { colorScheme } = useColorScheme();
  const placeholderColor =
    colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;

  const filterBtnRef = useRef<ViewType>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(searchQuery.length > 0);

  useEffect(() => {
    if (searchQuery.length > 0 && !isSearchExpanded) {
      setIsSearchExpanded(true);
    }
  }, [searchQuery]);

  const handleToggleSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearchExpanded(true);
  };

  const handleBlur = () => {
    if (searchQuery.length === 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsSearchExpanded(false);
    }
  };

  const handleFilterPress = () => {
    filterBtnRef.current?.measureInWindow((x, y, width, height) => {
      onFilterPress({ x, y, width, height });
    });
  };

  return (
    <View className="mb-4 flex-row items-center gap-2">
      {!isSearchExpanded ? (
        <TouchableOpacity
          onPress={handleToggleSearch}
          className="rounded-[6px] bg-secondary px-3 py-2.5">
          <Icon as={Search} size={16} className="text-foreground" />
        </TouchableOpacity>
      ) : (
        <View className="flex-1 flex-row items-center rounded-[6px] border border-border bg-surface px-4 py-2 focus-within:border-primary">
          <Icon as={Search} size={16} className="mr-2 text-muted" />
          <TextInput
            autoFocus
            value={searchQuery}
            onChangeText={onSearchChange}
            onBlur={handleBlur}
            placeholder="Search transactions..."
            placeholderTextColor={placeholderColor}
            className="h-[24px] flex-1 p-0 text-sm font-medium text-foreground"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              className="ml-2 p-1"
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <Icon as={X} size={14} className="text-muted" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity
        onPress={onDatePress}
        className={`flex-row items-center gap-1.5 rounded-[6px] px-4 py-2.5 ${
          dateLabel !== 'Any Date' ? 'bg-primary' : 'bg-secondary'
        }`}>
        <Icon
          as={Calendar}
          size={14}
          className={dateLabel !== 'Any Date' ? 'text-primary-foreground' : 'text-foreground'}
        />
        <Text
          className={`text-xs font-semibold ${
            dateLabel !== 'Any Date' ? 'text-primary-foreground' : 'text-foreground'
          }`}>
          {dateLabel}
        </Text>
      </TouchableOpacity>

      {/* Filter button */}
      <TouchableOpacity
        ref={filterBtnRef}
        onPress={handleFilterPress}
        className={`relative flex-row items-center gap-1.5 rounded-[6px] px-3 py-2.5 ${
          activeFilterCount > 0 ? 'bg-primary' : 'bg-secondary'
        }`}>
        <Icon
          as={SlidersHorizontal}
          size={16}
          className={activeFilterCount > 0 ? 'text-primary-foreground' : 'text-foreground'}
        />
        {activeFilterCount > 0 && (
          <View className="h-4 min-w-[16px] items-center justify-center rounded-full bg-white px-1">
            <Text className="text-[10px] font-bold text-black">{activeFilterCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {hasActiveFilter && (
        <TouchableOpacity onPress={onClearAll} className="rounded-[6px] bg-secondary p-2.5">
          <Icon as={X} size={14} className="text-foreground" />
        </TouchableOpacity>
      )}
    </View>
  );
}
