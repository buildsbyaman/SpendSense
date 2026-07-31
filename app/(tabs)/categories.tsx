import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, TextInput, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Plus, Trash2, X, Tag, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { getCategoryColor, getCategoryIcon, type TransactionType, AVAILABLE_ICONS, AVAILABLE_PALETTE } from '@/utils/transaction';
import CategoryTypeToggle from '@/components/ui/CategoryTypeToggle';
import Toast from 'react-native-toast-message';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTabNavigation } from '@/context/TabNavigationContext';

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { navigate: navigateTab } = useTabNavigation();
  const {
    addCustomCategory,
    deleteCustomCategory,
    deleteDefaultCategory,
    getSortedCategories,
    updateCategoryOrder,
  } = useApp();

  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIconName, setSelectedIconName] = useState('Tag');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_PALETTE[0]);
  
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id?: string; name: string; isCustom: boolean } | null>(null);

  const categories = getSortedCategories(activeTab);

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...categories.map((c) => c.name)];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newOrder.length) return;
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    updateCategoryOrder(activeTab, newOrder);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim().length === 0) return;
    addCustomCategory({
      name: newCategoryName.trim(),
      type: activeTab,
      icon: selectedIconName,
      color: selectedColor,
    });
    Toast.show({
      type: 'success',
      text1: 'Category added!',
      text2: `${newCategoryName.trim()} is now available for your transactions.`,
    });
    setNewCategoryName('');
    setSelectedIconName('Tag');
    setSelectedColor(AVAILABLE_PALETTE[0]);
    setIsModalOpen(false);
  };

  const handleDeleteCustom = (id: string, name: string) => {
    setCategoryToDelete({ id, name, isCustom: true });
    setDeleteDialogVisible(true);
  };

  const handleDeleteDefault = (name: string) => {
    setCategoryToDelete({ name, isCustom: false });
    setDeleteDialogVisible(true);
  };

  const executeDelete = () => {
    if (!categoryToDelete) return;
    
    if (categoryToDelete.isCustom && categoryToDelete.id) {
      deleteCustomCategory(categoryToDelete.id);
    } else {
      deleteDefaultCategory(categoryToDelete.name);
    }
    
    Toast.show({
      type: 'success',
      text1: 'Category deleted',
      text2: `${categoryToDelete.name} has been removed.`,
    });
    
    setDeleteDialogVisible(false);
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header
          title="Categories"
          showBack={true}
          onLeftPress={() => navigateTab('profile')}
          rightIcon={Plus}
          onRightPress={() => setIsModalOpen(true)}
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}>

        {/* Segmented Control */}
        <View className="mt-4 mb-6">
          <CategoryTypeToggle type={activeTab} onChange={setActiveTab} />
        </View>

        {/* Category List */}
        <View className="overflow-hidden rounded-[32px] border border-gray-100 bg-surface dark:border-gray-900">
          {categories.length === 0 && (
            <View className="p-8 items-center justify-center">
              <Text className="text-muted text-sm">No categories found.</Text>
            </View>
          )}
          {categories.map((category, index) => {
            const isCustom = !('isDefault' in category);
            const name = category.name;
            const id = 'id' in category ? category.id : undefined;
            const icon = getCategoryIcon(name, undefined, 'icon' in category ? category.icon : undefined);
            const color = getCategoryColor(name, 'color' in category ? category.color : undefined);
            const isFirst = index === 0;
            const isLast = index === categories.length - 1;

            return (
              <React.Fragment key={name}>
                <View className="flex-row items-center justify-between px-5 py-4">
                  {/* Icon + Name */}
                  <View className="flex-row items-center gap-3 flex-1">
                    <View
                      className="h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}20` }}>
                      <Icon as={icon} size={18} color={color} />
                    </View>
                    <Text className="text-base font-semibold text-foreground">{name}</Text>
                  </View>

                  {/* Controls */}
                  <View className="flex-row items-center gap-2">
                    {/* Up button */}
                    <TouchableOpacity
                      onPress={() => moveCategory(index, 'up')}
                      disabled={isFirst}
                      activeOpacity={0.6}
                      className={`h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 ${isFirst ? 'opacity-30' : 'opacity-100'}`}>
                      <Icon as={ChevronUp} size={16} className="text-foreground" />
                    </TouchableOpacity>

                    {/* Down button */}
                    <TouchableOpacity
                      onPress={() => moveCategory(index, 'down')}
                      disabled={isLast}
                      activeOpacity={0.6}
                      className={`h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 ${isLast ? 'opacity-30' : 'opacity-100'}`}>
                      <Icon as={ChevronDown} size={16} className="text-foreground" />
                    </TouchableOpacity>

                    {/* Delete button */}
                    <TouchableOpacity
                      onPress={() => isCustom && id ? handleDeleteCustom(id, name) : handleDeleteDefault(name)}
                      activeOpacity={0.6}
                      className="h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
                      <Icon as={Trash2} size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                {!isLast && <View className="h-[1px] bg-divider" />}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      {/* Add Category Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/50">
          <View className="flex gap-5 rounded-t-[32px] bg-background p-6" style={{ maxHeight: '85%' }}>
            <View className="flex-row items-center justify-between">
              <Text variant="h3">New {activeTab === 'expense' ? 'Expense' : 'Income'} Category</Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-surface">
                <Icon as={X} size={20} className="text-muted" />
              </TouchableOpacity>
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-muted">Category Name</Text>
              <View className="flex-row items-center rounded-full bg-surface px-5 py-4">
                <TextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="e.g. Dog Food, Water Bill"
                  placeholderTextColor="#9ca3af"
                  className="flex-1 font-inter text-base text-foreground"
                  autoFocus
                />
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-muted">Category Color</Text>
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

            <View className="shrink">
              <Text className="mb-2 text-sm font-medium text-muted">Category Icon</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View className="flex-row flex-wrap justify-center gap-4">
                  {AVAILABLE_ICONS.map((iconObj) => (
                    <TouchableOpacity
                      key={iconObj.name}
                      onPress={() => setSelectedIconName(iconObj.name)}
                      style={{
                        backgroundColor: selectedIconName === iconObj.name ? `${selectedColor}1A` : undefined,
                      }}
                      className={`h-12 w-12 items-center justify-center rounded-full ${
                        selectedIconName === iconObj.name ? '' : 'bg-surface dark:bg-surface'
                      }`}>
                      <Icon
                        as={iconObj.icon}
                        size={20}
                        color={selectedIconName === iconObj.name ? selectedColor : undefined}
                        className={selectedIconName === iconObj.name ? undefined : 'text-foreground opacity-60'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <TouchableOpacity
              onPress={handleAddCategory}
              disabled={newCategoryName.trim().length === 0}
              className={`items-center justify-center rounded-full py-4 ${
                newCategoryName.trim().length > 0 ? 'bg-primary' : 'bg-surface'
              }`}>
              <Text
                className={`text-lg font-semibold ${
                  newCategoryName.trim().length > 0 ? 'text-white dark:text-black' : 'text-muted'
                }`}>
                Create Category
              </Text>
            </TouchableOpacity>

            {/* Safe area spacing for iOS */}
            <View style={{ height: insets.bottom }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
        }}
      />
    </View>
  );
}
