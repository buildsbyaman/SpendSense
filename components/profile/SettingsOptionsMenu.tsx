import { View, TouchableOpacity, Modal } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Plus, Trash2, Edit2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useApp } from '@/context/AppContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useState, useEffect } from 'react';
import Animated from 'react-native-reanimated';
import { useModalAnimation } from '@/hooks/useModalAnimation';

interface SettingsOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onEditProfile: () => void;
}

export function SettingsOptionsMenu({ visible, onClose, onEditProfile }: SettingsOptionsMenuProps) {
  const { clearAllData } = useApp();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleDeleteAll = () => {
    onClose();
    setConfirmVisible(true);
  };

  const { isRendered, animatedStyle } = useModalAnimation({
    visible,
    type: 'scale-origin',
  });

  return (
    <>
      <Modal visible={isRendered} transparent={true} animationType="none" onRequestClose={onClose}>
        <TouchableOpacity
          className="flex-1 items-end justify-start bg-transparent px-6 pt-20"
          activeOpacity={1}
          onPress={onClose}>
          <Animated.View style={animatedStyle}>
            <View className="w-64 gap-1 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
              <TouchableOpacity
              className="flex-row items-center rounded-xl p-3 active:bg-gray-50 dark:active:bg-gray-800"
              onPress={() => {
                onClose();
                onEditProfile();
              }}>
              <Icon as={Edit2} size={20} className="mr-3 text-foreground" />
              <Text className="text-base font-medium text-foreground">Edit Profile</Text>
            </TouchableOpacity>

            <View className="mx-2 my-1 h-[1px] bg-divider" />

            <TouchableOpacity
              className="flex-row items-center rounded-xl p-3 active:bg-gray-50 dark:active:bg-gray-800"
              onPress={handleDeleteAll}>
              <Icon as={Trash2} size={20} className="mr-3 text-red-500" />
              <Text className="text-base font-medium text-red-500">Delete All Data</Text>
            </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete All Data"
        message="Are you sure you want to delete all wallets and transactions? This action is permanent and cannot be undone."
        confirmText="Delete Everything"
        destructive
        onConfirm={() => {
          clearAllData();
          setConfirmVisible(false);
          Toast.show({
            type: 'success',
            text1: 'Data Cleared',
            text2: 'All wallets and transactions have been deleted.',
          });
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </>
  );
}
