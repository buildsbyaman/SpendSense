import { View, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Plus } from 'lucide-react-native';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { InAppModal } from '@/components/ui/InAppModal';

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
    <InAppModal
      visible={isRendered}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        className="flex-1 bg-transparent justify-start items-end pt-20 px-6"
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View style={animatedStyle}>
          <View className="w-64 overflow-hidden rounded-xl border border-border bg-surface p-2 shadow-2xl">
          <TouchableOpacity 
            className="flex-row items-center rounded-xl p-3 active:bg-secondary"
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
    </InAppModal>
  );
}
