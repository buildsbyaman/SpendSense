import { View, TouchableOpacity, Modal } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Plus } from 'lucide-react-native';
import { useModalAnimation } from '@/hooks/useModalAnimation';

interface WalletOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onAddWallet: () => void;
}

export function WalletOptionsMenu({ visible, onClose, onAddWallet }: WalletOptionsMenuProps) {
  const { isRendered, animatedStyle } = useModalAnimation({
    visible,
    type: 'scale-origin',
  });

  return (
    <Modal
      visible={isRendered}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        className="flex-1 bg-transparent justify-start items-end pt-20 px-6"
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View style={animatedStyle}>
          <View className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 w-64 rounded-2xl overflow-hidden shadow-2xl p-2">
          <TouchableOpacity 
            className="flex-row items-center p-3 active:bg-gray-50 dark:active:bg-gray-800 rounded-xl"
            onPress={() => {
              onClose();
              onAddWallet();
            }}
          >
            <Icon as={Plus} size={20} className="text-foreground mr-3" />
            <Text className="text-base text-foreground font-medium">Add New Wallet</Text>
          </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}
