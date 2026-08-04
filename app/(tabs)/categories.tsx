import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Plus, X, Check, GripVertical } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { type TransactionType, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/utils/transaction';
import CategoryTypeToggle from '@/components/ui/CategoryTypeToggle';
import Toast from 'react-native-toast-message';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { CategoryList } from '@/components/categories/CategoryList';
import { CategoryFormModal } from '@/components/categories/CategoryFormModal';
import { type CategoryItemData } from '@/components/categories/CategoryItem';

export default function CategoriesScreen({ referrer }: { referrer?: string }) {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab, addListener } = useTabNavigation();

  const {
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    deleteDefaultCategory,
    getSortedCategories,
    updateCategoryOrder,
  } = useApp();

  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draftOrder, setDraftOrder] = useState<CategoryItemData[]>([]);
  const [availableHeight, setAvailableHeight] = useState(0);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItemData | null>(null);

  // Delete Dialog state
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id?: string;
    name: string;
    isCustom: boolean;
  } | null>(null);

  const sortedCategories = getSortedCategories(activeTab) as CategoryItemData[];

  const listRef = useRef<any>(null);
  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'categories') {
        listRef.current?.scrollToOffset?.({ offset: 0, animated: false });
      }
    });
  }, [addListener]);

  const toggleCategoryExpand = (name: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategoryId(expandedCategoryId === name ? null : name);
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (cat: CategoryItemData) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (cat: CategoryItemData) => {
    setCategoryToDelete({ id: cat.id, name: cat.name, isCustom: !cat.isDefault });
    setDeleteDialogVisible(true);
  };

  const executeDelete = async () => {
    if (!categoryToDelete) return;

    if (categoryToDelete.isCustom && categoryToDelete.id) {
      await deleteCustomCategory(categoryToDelete.id);
    } else {
      await deleteDefaultCategory(categoryToDelete.name);
    }

    Toast.show({
      type: 'success',
      text1: 'Category Deleted',
      text2: `"${categoryToDelete.name}" has been removed.`,
    });

    setDeleteDialogVisible(false);
    setCategoryToDelete(null);
    setExpandedCategoryId(null);
  };

  const enterReorderMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDraftOrder(sortedCategories);
    setExpandedCategoryId(null);
    setIsReorderMode(true);
  };

  const cancelReorder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsReorderMode(false);
    setDraftOrder([]);
  };

  const commitReorder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    updateCategoryOrder(
      activeTab,
      draftOrder.map((c) => c.name)
    );
    setIsReorderMode(false);
    setDraftOrder([]);
    Toast.show({
      type: 'success',
      text1: 'Order Saved',
      text2: 'Your category order has been updated.',
    });
  };

  const resetOrder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const defaultCats = activeTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    updateCategoryOrder(activeTab, []);
    setDraftOrder(getSortedCategories(activeTab) as CategoryItemData[]);
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      {/* Header */}
      <View className="px-5">
        <Header
          title="Categories"
          showBack={!isReorderMode}
          leftIcon={isReorderMode ? X : undefined}
          onLeftPress={isReorderMode ? cancelReorder : () => navigateTab(referrer === 'home' ? 'index' : 'profile')}
          rightIcon={isReorderMode ? Check : Plus}
          onRightPress={isReorderMode ? commitReorder : openAddModal}
        />
      </View>

      {/* Type Toggle & Reorder Button */}
      <View className="mb-4 flex-row items-center justify-between pl-7 pr-5">
        {!isReorderMode && (
          <TouchableOpacity
            onPress={enterReorderMode}
            className="mr-3 h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-xs"
            activeOpacity={0.7}>
            <Icon as={GripVertical} size={18} className="text-foreground" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <CategoryTypeToggle
            type={activeTab}
            onChange={(type) => {
              if (isReorderMode) cancelReorder();
              setExpandedCategoryId(null);
              setActiveTab(type);
            }}
          />
        </View>
      </View>

      {/* Reorder Mode Guidance */}
      {isReorderMode && (
        <>
          <Text className="mb-2 text-center text-xs text-muted">
            Hold the grip or long-press to reorder
          </Text>
          <TouchableOpacity
            onPress={resetOrder}
            activeOpacity={0.7}
            className="mb-3 self-center rounded-full bg-secondary px-4 py-2 border border-border shadow-xs">
            <Text className="text-xs font-semibold text-primary">
              Reset to default order
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Category List */}
      <View
        className="flex-1"
        style={{
          marginBottom: (insets.bottom > 0 ? insets.bottom + 8 : 20) + 76,
        }}
        onLayout={(e) => {
          const { height } = e.nativeEvent.layout;
          if (height > 0) setAvailableHeight(height);
        }}>
        <CategoryList
          listRef={listRef}
          categories={isReorderMode ? draftOrder : sortedCategories}
          expandedCategoryId={isReorderMode ? null : expandedCategoryId}
          onToggleExpand={isReorderMode ? () => {} : toggleCategoryExpand}
          onEditClick={isReorderMode ? () => {} : handleEditClick}
          onDeleteClick={isReorderMode ? () => {} : handleDeleteClick}
          onAddFirstCategory={openAddModal}
          reorderMode={isReorderMode}
          onReorderEnd={setDraftOrder}
          maxHeight={availableHeight}
        />
      </View>

      {/* Add / Edit Category Modal */}
      <CategoryFormModal
        visible={isModalOpen}
        editingCategory={editingCategory}
        activeTab={activeTab}
        onRequestClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"?\n\nAll existing transactions under this category will be automatically moved to "Others".`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        onConfirm={executeDelete}
        onCancel={() => {
          setDeleteDialogVisible(false);
          setCategoryToDelete(null);
        }}
      />
    </View>
  );
}
