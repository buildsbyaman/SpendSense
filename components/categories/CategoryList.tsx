import React from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
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
      <View className="mt-20 items-center justify-center px-6">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-secondary">
          <Icon as={Tag} size={40} className="text-muted opacity-50" />
        </View>
        <Text variant="h3" className="mb-2 text-center text-foreground">
          No Categories Yet
        </Text>
        <Text className="mb-8 text-center text-muted">
          Add your first custom category to organize your spending.
        </Text>
        <TouchableOpacity
          className="flex-row items-center gap-2 rounded-[6px] bg-primary px-6 py-4"
          onPress={onAddFirstCategory}
          activeOpacity={0.7}>
          <Icon as={Plus} size={20} className="text-white dark:text-black" />
          <Text className="text-base font-medium text-white dark:text-black">Add Category</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ItemSeparator = () => <View className="h-[1px] bg-divider" />;

  const renderCategory = (item: CategoryItemData, drag?: () => void, isActive = false) => (
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
  );

  const listStyle = maxHeight && maxHeight > 0 ? { maxHeight } : undefined;

  return (
    <View
      className="overflow-hidden rounded-xl border border-border bg-surface"
      style={{
        marginHorizontal: 20,
        flexShrink: 1,
        ...(maxHeight && maxHeight > 0 ? { maxHeight } : {}),
      }}>
      {reorderMode ? (
        // Drag-and-drop is only mounted during reordering, so normal browsing
        // does not pay for its gesture handlers.
        <DraggableFlatList
          ref={listRef}
          data={categories}
          keyExtractor={(item) => item.name}
          onDragEnd={({ data }) => onReorderEnd?.(data)}
          renderItem={({ item, drag, isActive }) => (
            <ScaleDecorator>{renderCategory(item, drag, isActive)}</ScaleDecorator>
          )}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={ItemSeparator}
          showsVerticalScrollIndicator={false}
          style={listStyle}
          containerStyle={{ flexShrink: 1 }}
        />
      ) : (
        <FlatList
          ref={listRef}
          data={categories}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => renderCategory(item)}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={ItemSeparator}
          showsVerticalScrollIndicator={false}
          style={listStyle}
          removeClippedSubviews={false}
        />
      )}
    </View>
  );
}
