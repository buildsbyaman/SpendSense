import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X, Trash2, Check } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import {
  type TransactionType,
  AVAILABLE_ICONS,
  AVAILABLE_PALETTE,
} from '@/utils/transaction';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CategoryTypeToggle from '@/components/ui/CategoryTypeToggle';

export default function AddCategoryScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const placeholderColor =
    colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;

  const {
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    deleteDefaultCategory,
    getSortedCategories,
  } = useApp();

  const { editId, type: initialType } = useLocalSearchParams<{
    editId?: string;
    type?: string;
  }>();

  const [categoryType, setCategoryType] = useState<TransactionType>(
    initialType === 'income' ? 'income' : 'expense'
  );
  const [categoryName, setCategoryName] = useState('');
  const [selectedIconName, setSelectedIconName] = useState('Tag');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_PALETTE[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [originalName, setOriginalName] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryId, setCustomCategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) return;

    // Search across both expense and income categories
    const allCategories = [
      ...getSortedCategories('expense'),
      ...getSortedCategories('income'),
    ];

    const match = allCategories.find(
      (c) => ('id' in c && c.id === editId) || c.name.toLowerCase() === editId.toLowerCase()
    );

    if (match) {
      setCategoryName(match.name);
      setOriginalName(match.name);
      if ('icon' in match && match.icon) setSelectedIconName(match.icon);
      if ('color' in match && match.color) setSelectedColor(match.color);
      if ('type' in match && match.type) setCategoryType(match.type as TransactionType);
      const isCustom = 'isDefault' in match ? !match.isDefault : Boolean('id' in match && match.id);
      setIsCustomCategory(isCustom);
      setCustomCategoryId('id' in match ? (match.id as string) : null);
    }
  }, [editId]);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/categories');
    }
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, []);

  const savingRef = useRef(false);

  const handleSaveCategory = async () => {
    if (savingRef.current) return;
    const trimmed = categoryName.trim();
    if (!trimmed) {
      Toast.show({
        type: 'error',
        text1: 'Name Required',
        text2: 'Please enter a category name.',
      });
      return;
    }

    savingRef.current = true;
    try {
      if (editId) {
        if (customCategoryId) {
          await updateCustomCategory(
            {
              id: customCategoryId,
              name: trimmed,
              type: categoryType,
              icon: selectedIconName,
              color: selectedColor,
            },
            originalName || trimmed
          );
          Toast.show({
            type: 'success',
            text1: 'Category Updated',
            text2: `"${trimmed}" has been updated.`,
          });
        } else {
          // Editing a default category converts it into a custom category
          addCustomCategory({
            name: trimmed,
            type: categoryType,
            icon: selectedIconName,
            color: selectedColor,
          });
          Toast.show({
            type: 'success',
            text1: 'Category Updated',
            text2: `"${trimmed}" has been updated.`,
          });
        }
      } else {
        const existing = getSortedCategories(categoryType as 'expense' | 'income').some(
          (c) => c.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (existing) {
          Toast.show({
            type: 'info',
            text1: 'Category Exists',
            text2: `A category named "${trimmed}" already exists.`,
          });
          return;
        }
        addCustomCategory({
          name: trimmed,
          type: categoryType,
          icon: selectedIconName,
          color: selectedColor,
        });
        Toast.show({
          type: 'success',
          text1: 'Category Created',
          text2: `"${trimmed}" is now available.`,
        });
      }

      handleClose();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: err instanceof Error ? err.message : 'Could not save category.',
      });
    } finally {
      savingRef.current = false;
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (customCategoryId) {
        await deleteCustomCategory(customCategoryId);
      } else if (originalName) {
        await deleteDefaultCategory(originalName);
      }
      Toast.show({
        type: 'success',
        text1: 'Category Deleted',
        text2: `"${originalName || categoryName}" has been removed.`,
      });
      setShowDeleteConfirm(false);
      handleClose();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: 'Could not delete category.',
      });
    }
  };

  const currentIconObj =
    AVAILABLE_ICONS.find((i) => i.name === selectedIconName) || AVAILABLE_ICONS[0];

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: Math.max(insets.top, 16) + 16,
        paddingBottom: Math.max(insets.bottom, 16),
      }}>
      {/* ── Top Bar: Close (Left), Heading (Center), Delete / Spacer (Right) ── */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-1">
        <TouchableOpacity
          onPress={handleClose}
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-xs active:scale-95"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon as={X} size={18} className="text-foreground" />
        </TouchableOpacity>

        <Text className="text-xl font-semibold text-foreground">
          {editId ? 'Edit Category' : 'New Category'}
        </Text>

        {editId ? (
          <TouchableOpacity
            onPress={() => setShowDeleteConfirm(true)}
            className="h-11 w-11 items-center justify-center rounded-full border border-red-200 bg-red-50 shadow-xs active:scale-95 dark:border-red-900/40 dark:bg-red-950/20"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon as={Trash2} size={18} className="text-red-500" />
          </TouchableOpacity>
        ) : (
          <View className="h-11 w-11" />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}>
          {/* ── Category Type Segmented Capsule ── */}
          <View className="items-center justify-center px-5 pt-1 pb-2">
            <CategoryTypeToggle
              type={categoryType}
              onChange={setCategoryType}
            />
          </View>

          {/* ── Hero Icon & Direct Category Name Input ── */}
          <View className="items-center justify-center px-6 py-4">
            <View
              className="h-24 w-24 items-center justify-center rounded-3xl border border-black/10 dark:border-white/10"
              style={{ backgroundColor: `${selectedColor}18` }}>
              <Icon as={currentIconObj.icon} size={42} color={selectedColor} />
            </View>
            <TextInput
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="Category Name"
              placeholderTextColor={
                colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
              }
              textAlign="center"
              returnKeyType="done"
              onSubmitEditing={handleSaveCategory}
              className={`mt-3 w-full text-center tracking-tight ${
                categoryName.trim()
                  ? 'text-2xl font-bold text-foreground'
                  : 'text-2xl font-normal text-muted/60'
              }`}
              maxLength={30}
            />
          </View>

          {/* ── Form Details with Proper Spacing ── */}
          <View className="gap-5 pt-2">
            {/* Accent Color Section (Circular palette chips) */}
            <View>
              <View className="mb-2 flex-row items-center justify-between px-5">
                <Text className="text-xs font-semibold text-muted">Accent Color</Text>
                <View
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingVertical: 6,
                  gap: 10,
                  alignItems: 'center',
                }}>
                {AVAILABLE_PALETTE.map((hex) => {
                  const isSelected = selectedColor === hex;
                  return (
                    <TouchableOpacity
                      key={hex}
                      onPress={() => setSelectedColor(hex)}
                      activeOpacity={0.7}
                      style={{ backgroundColor: hex }}
                      className={`h-10 w-10 items-center justify-center rounded-full active:scale-95 ${
                        isSelected
                          ? 'border-[2.5px] border-black dark:border-white'
                          : 'border border-black/10 dark:border-white/15'
                      }`}
                    />
                  );
                })}
              </ScrollView>
            </View>

            {/* Icon Section (Squarish rounded-xl tiles) */}
            <View>
              <View className="mb-2 flex-row items-center justify-between px-5">
                <Text className="text-xs font-semibold text-muted">Icon</Text>
                <Text className="text-xs font-bold text-foreground">
                  {selectedIconName}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingVertical: 6,
                  gap: 8,
                  alignItems: 'center',
                }}>
                {AVAILABLE_ICONS.map((iconObj) => {
                  const isSelected = selectedIconName === iconObj.name;
                  return (
                    <TouchableOpacity
                      key={iconObj.name}
                      onPress={() => setSelectedIconName(iconObj.name)}
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: isSelected ? `${selectedColor}18` : undefined,
                      }}
                      className={`h-12 w-12 items-center justify-center rounded-xl border active:scale-95 ${
                        isSelected
                          ? 'border-2 border-black dark:border-white'
                          : 'border-border bg-surface/60'
                      }`}>
                      <Icon
                        as={iconObj.icon}
                        size={20}
                        color={isSelected ? selectedColor : undefined}
                        className={isSelected ? undefined : 'text-foreground/70'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* ── Bottom Save Action: Circular Tick Button ── */}
          <View className="mt-auto items-center justify-center px-5 pt-8 pb-4">
            <TouchableOpacity
              onPress={handleSaveCategory}
              activeOpacity={0.7}
              className="h-14 w-14 items-center justify-center rounded-full bg-black shadow-lg shadow-black/25 active:scale-95 active:opacity-90 dark:bg-white dark:shadow-white/10"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon
                as={Check}
                size={22}
                strokeWidth={2.4}
                color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${originalName || categoryName}"?\n\nAll existing transactions under this category will be automatically moved to "Others".`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </View>
  );
}

