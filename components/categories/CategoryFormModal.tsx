import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useApp } from '@/context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type TransactionType, AVAILABLE_ICONS, AVAILABLE_PALETTE } from '@/utils/transaction';
import { type CategoryItemData } from '@/components/categories/CategoryItem';

interface Props {
  visible: boolean;
  editingCategory: CategoryItemData | null;
  activeTab: TransactionType;
  onRequestClose: () => void;
}

export function CategoryFormModal({
  visible,
  editingCategory,
  activeTab,
  onRequestClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const { addCustomCategory, updateCustomCategory, getSortedCategories } = useApp();

  const [categoryName, setCategoryName] = useState('');
  const [selectedIconName, setSelectedIconName] = useState('Tag');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_PALETTE[0]);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Re-sync local fields each time the modal opens so edits/creates always
  // start from the target category (or a clean slate for new categories).
  useEffect(() => {
    if (visible) {
      setCategoryName(editingCategory?.name ?? '');
      setSelectedIconName(editingCategory?.icon || 'Tag');
      setSelectedColor(editingCategory?.color || AVAILABLE_PALETTE[0]);
    }
  }, [visible, editingCategory]);

  const handleSaveCategory = async () => {
    if (categoryName.trim().length === 0) return;
    const trimmed = categoryName.trim();

    try {
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
      const exists = getSortedCategories(activeTab).some(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) {
        Toast.show({
          type: 'info',
          text1: 'Category Exists',
          text2: `A category named "${trimmed}" already exists.`,
        });
        return;
      }
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

      onRequestClose();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: err instanceof Error ? err.message : 'Could not save the category.',
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/50 dark:bg-black/70">
        {/* Background touch area to close */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={1}
          onPress={onRequestClose}
        />

        <View className="rounded-t-[32px] bg-background p-6 pb-12" style={{ maxHeight: '90%' }}>
          <View className="mb-6 flex-row items-center justify-between">
            <Text variant="h2">
              {editingCategory
                ? 'Edit Category'
                : `New ${activeTab === 'expense' ? 'Expense' : 'Income'} Category`}
            </Text>
            <TouchableOpacity
              onPress={onRequestClose}
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
                          selectedIconName === iconObj.name ? undefined : 'text-foreground opacity-60'
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
  );
}
