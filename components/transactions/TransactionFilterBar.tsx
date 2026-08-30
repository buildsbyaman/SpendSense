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
          className="items-center justify-center rounded-full bg-secondary p-3 aspect-square h-[44px] w-[44px]">
          <Icon as={Search} size={18} className="text-foreground" />
        </TouchableOpacity>
      ) : (
        <View className="flex-1 flex-row items-center rounded-full border border-border bg-surface px-4 h-[44px] focus-within:border-primary">
          <Icon as={Search} size={16} className="mr-2 text-muted" />
          <TextInput
            autoFocus
            value={searchQuery}
            onChangeText={onSearchChange}
            onBlur={handleBlur}
            placeholder="Search transactions..."
            placeholderTextColor={placeholderColor}
            className="flex-1 p-0 text-sm font-medium text-foreground h-full"
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

      {/* Date Filter Button - takes remaining width */}
      <TouchableOpacity
        onPress={onDatePress}
        className={`flex-row items-center justify-center rounded-full bg-secondary h-[44px] ${
          !isSearchExpanded ? 'flex-1 gap-2 px-4' : 'aspect-square w-[44px]'
        }`}>
        <Icon
          as={Calendar}
          size={16}
          className={dateLabel !== 'Any Date' ? 'text-foreground' : 'text-muted'}
        />
        {!isSearchExpanded && (
          <Text
            numberOfLines={1}
            className={`text-sm font-semibold ${
              dateLabel !== 'Any Date' ? 'text-foreground' : 'text-muted'
            }`}>
            {dateLabel}
          </Text>
        )}
      </TouchableOpacity>

      {/* Filter Options Button */}
      <TouchableOpacity
        ref={filterBtnRef}
        onPress={handleFilterPress}
        className={`relative items-center justify-center rounded-full bg-secondary h-[44px] px-4 ${
          !isSearchExpanded && !hasActiveFilter ? '' : 'aspect-square w-[44px] px-0'
        }`}>
        <Icon
          as={SlidersHorizontal}
          size={18}
          className={activeFilterCount > 0 ? 'text-foreground' : 'text-muted'}
        />
        {activeFilterCount > 0 && (
          <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 border-2 border-background">
            <Text className="text-[10px] font-bold text-primary-foreground">{activeFilterCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Clear All Button */}
      {hasActiveFilter && (
        <TouchableOpacity 
          onPress={onClearAll} 
          className="items-center justify-center rounded-full bg-secondary aspect-square h-[44px] w-[44px]">
          <Icon as={X} size={18} className="text-foreground" />
        </TouchableOpacity>
      )}
    </View>
  );
}
