import { View, TouchableOpacity, Modal, Alert } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Plus, Trash2, Edit2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useApp } from '@/context/AppContext';

interface SettingsOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onEditProfile: () => void;
}

export function SettingsOptionsMenu({ visible, onClose, onEditProfile }: SettingsOptionsMenuProps) {
  const { clearAllData } = useApp();

  const handleDeleteAll = () => {
    onClose();
    Alert.alert(
      'Delete All Data',
      'Are you sure you want to delete all wallets and transactions? This action is permanent and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Everything', 
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Toast.show({
              type: 'success',
              text1: 'Data Cleared',
              text2: 'All wallets and transactions have been deleted.',
            });
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        className="flex-1 bg-black/50 justify-start items-end pt-20 px-6"
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="bg-surface w-64 rounded-2xl overflow-hidden shadow-2xl p-2 gap-1">
          <TouchableOpacity 
            className="flex-row items-center p-3 active:bg-gray-50 dark:active:bg-gray-800 rounded-xl"
            onPress={() => {
              onClose();
              onEditProfile();
            }}
          >
            <Icon as={Edit2} size={20} className="text-foreground mr-3" />
            <Text className="text-base text-foreground font-medium">Edit Profile</Text>
          </TouchableOpacity>

          <View className="h-[1px] bg-divider my-1 mx-2" />

          <TouchableOpacity 
            className="flex-row items-center p-3 active:bg-gray-50 dark:active:bg-gray-800 rounded-xl"
            onPress={handleDeleteAll}
          >
            <Icon as={Trash2} size={20} className="text-red-500 mr-3" />
            <Text className="text-base text-red-500 font-medium">Delete All Data</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
