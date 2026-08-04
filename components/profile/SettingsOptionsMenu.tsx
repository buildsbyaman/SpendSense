import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Plus, Trash2, Edit2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useApp } from '@/context/AppContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useState, useEffect } from 'react';
import Animated from 'react-native-reanimated';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { InAppModal } from '@/components/ui/InAppModal';

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
      <InAppModal visible={isRendered} onRequestClose={onClose}>
        <TouchableOpacity
          className="flex-1 items-end justify-start bg-transparent px-6 pt-20"
          activeOpacity={1}
          onPress={onClose}>
          <Animated.View style={animatedStyle}>
            <View className="w-64 gap-1 overflow-hidden rounded-xl border border-border bg-surface p-2 shadow-2xl">
              <TouchableOpacity
                className="flex-row items-center rounded-xl p-3 active:bg-secondary"
                onPress={() => {
                  onClose();
                  onEditProfile();
                }}>
                <Icon as={Edit2} size={20} className="mr-3 text-foreground" />
                <Text className="text-base font-medium text-foreground">Edit Profile</Text>
              </TouchableOpacity>

              <View className="mx-2 my-1 h-[1px] bg-divider" />

              <TouchableOpacity
                className="flex-row items-center rounded-xl p-3 active:bg-secondary"
                onPress={handleDeleteAll}>
                <Icon as={Trash2} size={20} className="mr-3 text-red-500" />
                <Text className="text-base font-medium text-red-500">Delete All Data</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </InAppModal>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete All Data"
        message="Are you sure you want to delete all wallets and transactions? This action is permanent and cannot be undone."
        confirmText="Delete Everything"
        destructive
        onConfirm={async () => {
          try {
            await clearAllData();
            Toast.show({
              type: 'success',
              text1: 'Data Cleared',
              text2: 'All wallets and transactions have been deleted.',
            });
          } catch {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Failed to clear data. Please try again.',
            });
          } finally {
            setConfirmVisible(false);
          }
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </>
  );
}
