import { View, TouchableOpacity, Modal } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Wallet } from 'lucide-react-native';

interface DeleteWalletModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteWalletModal({ visible, onCancel, onConfirm }: DeleteWalletModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-surface w-full rounded-3xl p-6 items-center shadow-2xl">
          <View className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center mb-5">
            <Icon as={Wallet} size={28} className="text-red-500" />
          </View>
          <Text variant="h3" className="mb-2 text-center">Delete Wallet?</Text>
          <Text className="text-muted text-center mb-8 px-2">
            Are you sure you want to delete this wallet? All associated transactions may be affected.
          </Text>
          
          <View className="flex-row gap-3 w-full">
            <TouchableOpacity 
              className="flex-1 py-3.5 items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full"
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text className="text-foreground font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1 py-3.5 items-center justify-center bg-red-500 rounded-full"
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
