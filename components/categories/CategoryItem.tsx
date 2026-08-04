import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronDown, GripVertical } from 'lucide-react-native';
import { useExpandAnimation } from '@/hooks/useExpandAnimation';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { getCategoryColor, getCategoryIcon } from '@/utils/transaction';

export interface CategoryItemData {
  id?: string;
  name: string;
  type?: 'expense' | 'income';
  icon?: string;
  color?: string;
  isDefault?: boolean;
}

interface CategoryItemProps {
  category: CategoryItemData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  drag?: () => void;
  isDragging?: boolean;
  reorderMode?: boolean;
}

export function CategoryItem({
  category,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  drag,
  isDragging,
  reorderMode = false,
}: CategoryItemProps) {
  const isCustom = !category.isDefault;
  const canDelete =
    isCustom ||
    (category.name.toLowerCase() !== 'others' && category.name.toLowerCase() !== 'other');
  const icon = getCategoryIcon(category.name, undefined, category.icon);
  const color = getCategoryColor(category.name, category.color);

  // Automatically collapse accordion actions when reorderMode is active
  const { actionsStyle, chevronStyle } = useExpandAnimation(reorderMode ? false : isExpanded);

  const dragStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(reorderMode ? 36 : 0, { duration: 250 }),
      opacity: withTiming(reorderMode ? 1 : 0, { duration: 200 }),
      marginRight: withTiming(reorderMode ? 8 : 0, { duration: 250 }),
    };
  });

  const rightActionStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(reorderMode ? 0 : 20, { duration: 250 }),
      opacity: withTiming(reorderMode ? 0 : 1, { duration: 200 }),
    };
  });

  return (
    <View>
      {/* Main row */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={reorderMode ? undefined : onToggleExpand}
        onLongPress={drag}
        disabled={isDragging}
        className="flex-row items-center justify-between px-5 py-6"
        style={{ opacity: isDragging ? 0.9 : 1 }}>
        
        {/* Grip handle wrapper */}
        <Animated.View style={[dragStyle, { overflow: 'hidden', justifyContent: 'center' }]}>
          <TouchableOpacity
            activeOpacity={0.6}
            onPressIn={drag}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center">
            <Icon as={GripVertical} size={16} className="text-muted" />
          </TouchableOpacity>
        </Animated.View>

        <View className="mr-2 flex-1 flex-row items-center gap-3">
          <View
            className="relative h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}20` }}>
            <Icon as={icon} size={18} color={color} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
              {category.name}
            </Text>
            <Text className="mt-0.5 text-sm text-muted">
              {isCustom ? 'Custom Category' : 'Default Category'}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-3">
          {/* Chevron container */}
          <Animated.View style={[rightActionStyle, { overflow: 'hidden' }]}>
            <Animated.View style={chevronStyle} className="shrink-0">
              <Icon as={ChevronDown} size={20} className="text-muted" />
            </Animated.View>
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Actions — always mounted, animated in/out via maxHeight + opacity */}
      <Animated.View style={actionsStyle}>
        <View className="h-[1px] bg-divider" />
        <View className="flex-row gap-2.5 px-4 py-3">
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-[6px] bg-secondary py-3"
            onPress={onEdit}>
            <Text className="text-xs font-bold text-foreground">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 items-center justify-center rounded-[6px] py-3 ${
              canDelete ? 'bg-red-50 dark:bg-red-950/20' : 'bg-secondary opacity-50'
            }`}
            disabled={!canDelete}
            onPress={onDelete}>
            <Text className={`text-xs font-bold ${canDelete ? 'text-red-500' : 'text-muted'}`}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
