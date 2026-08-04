import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Tag, Plus } from 'lucide-react-native';
import { CategoryItem, type CategoryItemData } from './CategoryItem';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';

interface CategoryListProps {
  categories: CategoryItemData[];
  expandedCategoryId: string | null;
  onToggleExpand: (name: string) => void;
  onEditClick: (category: CategoryItemData) => void;
  onDeleteClick: (category: CategoryItemData) => void;
  onAddFirstCategory: () => void;
  reorderMode?: boolean;
  onReorderEnd?: (order: CategoryItemData[]) => void;
  listHeader?: React.ReactElement | null;
  listRef?: React.Ref<any>;
  maxHeight?: number;
}

export function CategoryList({
  categories,
  expandedCategoryId,
  onToggleExpand,
  onEditClick,
  onDeleteClick,
  onAddFirstCategory,
  reorderMode = false,
  onReorderEnd,
  listHeader,
  listRef,
  maxHeight,
}: CategoryListProps) {

  if (categories.length === 0) {
    return (
      <View className="items-center justify-center mt-20 px-6">
        <View className="w-24 h-24 bg-secondary rounded-full items-center justify-center mb-6">
          <Icon as={Tag} size={40} className="text-muted opacity-50" />
        </View>
        <Text variant="h3" className="text-center mb-2 text-foreground">
          No Categories Yet
        </Text>
        <Text className="text-muted text-center mb-8">
          Add your first custom category to organize your spending.
        </Text>
        <TouchableOpacity
          className="bg-primary px-6 py-3.5 rounded-[6px] flex-row items-center gap-2"
          onPress={onAddFirstCategory}
          activeOpacity={0.7}>
          <Icon as={Plus} size={20} className="text-white dark:text-black" />
          <Text className="text-white dark:text-black font-semibold text-base">
            Add Category
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ItemSeparator = () => <View className="h-[1px] bg-divider" />;

  return (
    <View
      className="overflow-hidden rounded-xl border border-border bg-surface"
      style={{
        marginHorizontal: 20,
        flexShrink: 1,
        ...(maxHeight && maxHeight > 0 ? { maxHeight } : {}),
      }}>
      <DraggableFlatList
        ref={listRef}
        data={categories}
        keyExtractor={(item) => item.name}
        onDragEnd={({ data }) => onReorderEnd?.(data)}
        renderItem={({ item, drag, isActive }) => {
          return (
            <ScaleDecorator>
              <CategoryItem
                category={item}
                isExpanded={!reorderMode && expandedCategoryId === item.name}
                onToggleExpand={() => onToggleExpand(item.name)}
                onEdit={() => onEditClick(item)}
                onDelete={() => onDeleteClick(item)}
                drag={reorderMode ? drag : undefined}
                isDragging={isActive}
                reorderMode={reorderMode}
              />
            </ScaleDecorator>
          );
        }}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        style={maxHeight && maxHeight > 0 ? { maxHeight } : undefined}
        containerStyle={{ flexShrink: 1 }}
      />
    </View>
  );
}
