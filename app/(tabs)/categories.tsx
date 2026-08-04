import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Plus, X, Check, GripVertical } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import {
  type TransactionType,
  AVAILABLE_ICONS,
  AVAILABLE_PALETTE,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '@/utils/transaction';
import CategoryTypeToggle from '@/components/ui/CategoryTypeToggle';
import Toast from 'react-native-toast-message';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { CategoryList } from '@/components/categories/CategoryList';
import { type CategoryItemData } from '@/components/categories/CategoryItem';

export default function CategoriesScreen() {
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
  const [categoryName, setCategoryName] = useState('');
  const [selectedIconName, setSelectedIconName] = useState('Tag');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_PALETTE[0]);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

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
    setCategoryName('');
    setSelectedIconName('Tag');
    setSelectedColor(AVAILABLE_PALETTE[0]);
    setIsModalOpen(true);
  };

  const handleEditClick = (cat: CategoryItemData) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setSelectedIconName(cat.icon || 'Tag');
    setSelectedColor(cat.color || AVAILABLE_PALETTE[0]);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (categoryName.trim().length === 0) return;
    const trimmed = categoryName.trim();

    if (editingCategory) {
      if (editingCategory.id) {
        // Update custom category
        await updateCustomCategory(
          {
            id: editingCategory.id,
            name: trimmed,
            type: activeTab,
            icon: selectedIconName,
            color: selectedColor,
          },
          editingCategory.name
        );
        Toast.show({
          type: 'success',
          text1: 'Category Updated',
          text2: `"${trimmed}" has been updated.`,
        });
      } else {
        // If default category was edited, add as custom category
        addCustomCategory({
          name: trimmed,
          type: activeTab,
          icon: selectedIconName,
          color: selectedColor,
        });
        Toast.show({
          type: 'success',
          text1: 'Category Created',
          text2: `"${trimmed}" has been saved.`,
        });
      }
    } else {
      // Add new custom category
      addCustomCategory({
        name: trimmed,
        type: activeTab,
        icon: selectedIconName,
        color: selectedColor,
      });
      Toast.show({
        type: 'success',
        text1: 'Category Added',
        text2: `"${trimmed}" is now available for your transactions.`,
      });
    }

    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setSelectedIconName('Tag');
    setSelectedColor(AVAILABLE_PALETTE[0]);
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
          onLeftPress={isReorderMode ? cancelReorder : () => navigateTab('profile')}
          rightIcon={isReorderMode ? Check : Plus}
          onRightPress={isReorderMode ? commitReorder : openAddModal}
        />
      </View>

      {/* Type Toggle & Reorder Button */}
      <View className="mb-4 flex-row items-center justify-between px-5">
        <View className="flex-1 mr-3">
          <CategoryTypeToggle
            type={activeTab}
            onChange={(type) => {
              if (isReorderMode) cancelReorder();
              setExpandedCategoryId(null);
              setActiveTab(type);
            }}
          />
        </View>
        {!isReorderMode && (
          <TouchableOpacity
            onPress={enterReorderMode}
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-xs"
            activeOpacity={0.7}>
            <Icon as={GripVertical} size={18} className="text-foreground" />
          </TouchableOpacity>
        )}
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
      <Modal visible={isModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/50 dark:bg-black/70">
          {/* Background touch area to close */}
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={() => setIsModalOpen(false)}
          />

          <View className="rounded-t-[32px] bg-background p-6 pb-12" style={{ maxHeight: '90%' }}>
            <View className="mb-6 flex-row items-center justify-between">
              <Text variant="h2">
                {editingCategory
                  ? 'Edit Category'
                  : `New ${activeTab === 'expense' ? 'Expense' : 'Income'} Category`}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="rounded-full bg-secondary p-2.5">
                <Icon as={X} size={20} className="text-foreground" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View className="gap-5">
                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Category Name</Text>
                  <TextInput
                    value={categoryName}
                    onChangeText={setCategoryName}
                    placeholder="e.g. Dog Food, Water Bill"
                    placeholderTextColor="#9ca3af"
                    className={`text-foreground rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base dark:bg-gray-900 ${
                      focusedInput === 'name' ? 'border-primary' : 'border-transparent'
                    }`}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>

                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Category Color</Text>
                  <View className="flex-row flex-wrap justify-center gap-4">
                    {AVAILABLE_PALETTE.map((hex) => (
                      <TouchableOpacity
                        key={hex}
                        onPress={() => setSelectedColor(hex)}
                        style={{ backgroundColor: hex }}
                        className={`h-10 w-10 items-center justify-center rounded-full border ${
                          selectedColor === hex
                            ? 'border-[3px] border-white shadow-md'
                            : 'border-gray-200/50 dark:border-gray-800/50 opacity-80'
                        }`}
                      />
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="mb-2 ml-1 text-sm text-muted">Category Icon</Text>
                  <View className="flex-row flex-wrap justify-center gap-4">
                    {AVAILABLE_ICONS.map((iconObj) => (
                      <TouchableOpacity
                        key={iconObj.name}
                        onPress={() => setSelectedIconName(iconObj.name)}
                        style={{
                          backgroundColor:
                            selectedIconName === iconObj.name ? `${selectedColor}1A` : undefined,
                        }}
                        className={`h-12 w-12 items-center justify-center rounded-full ${
                          selectedIconName === iconObj.name ? '' : 'bg-surface dark:bg-surface'
                        }`}>
                        <Icon
                          as={iconObj.icon}
                          size={20}
                          color={selectedIconName === iconObj.name ? selectedColor : undefined}
                          className={
                            selectedIconName === iconObj.name
                              ? undefined
                              : 'text-foreground opacity-60'
                          }
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSaveCategory}
                  disabled={categoryName.trim().length === 0}
                  className={`mt-8 items-center justify-center rounded-full bg-primary py-3.5 ${
                    categoryName.trim().length > 0 ? 'opacity-100' : 'opacity-40'
                  }`}
                  activeOpacity={0.7}>
                  <Text className="text-base font-medium text-white dark:text-black">
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Safe area spacing for iOS */}
            <View style={{ height: insets.bottom }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
