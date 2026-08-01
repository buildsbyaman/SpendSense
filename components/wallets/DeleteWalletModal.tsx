import { View, TouchableOpacity, Modal } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Wallet } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { useState, useEffect } from 'react';
import { useModalAnimation } from '@/hooks/useModalAnimation';

interface DeleteWalletModalProps {
  visible: boolean;
  walletId: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

interface ModalContent {
  title: string;
  subtitle: string;
  isLastWallet: boolean;
}

function computeContent(walletId: string, accounts: any[]): ModalContent {
  const id = String(walletId);
  const wallet = accounts.find((a) => String(a.id) === id);
  if (!wallet) {
    return {
      title: 'Delete Wallet?',
      subtitle: 'All transactions will be moved to your default wallet.',
      isLastWallet: false,
    };
  }

  const isLastWallet = accounts.length === 1;
  // SQLite stores booleans as 0/1 integers — use !! to coerce
  const isDeletingDefault = !!wallet.isDefault;
  const others = accounts.filter((a) => String(a.id) !== id);

  if (isLastWallet) {
    return {
      title: 'Cannot Delete Wallet',
      subtitle: 'You cannot delete your only wallet. Add another wallet first.',
      isLastWallet: true,
    };
  }

  if (isDeletingDefault) {
    const promoted = others[0];
    return {
      title: 'Delete Wallet?',
      subtitle: `"${promoted.name}" will become your new default wallet. All transactions will be moved there.`,
      isLastWallet: false,
    };
  }

  // Non-default wallet: find the current default among the others
  const currentDefault = others.find((a) => !!a.isDefault) ?? others[0];
  return {
    title: 'Delete Wallet?',
    subtitle: `All transactions will be moved to "${currentDefault.name}".`,
    isLastWallet: false,
  };
}

export function DeleteWalletModal({ visible, walletId, onCancel, onConfirm }: DeleteWalletModalProps) {
  const { accounts } = useApp();

  // Use state so that React re-renders when content changes.
  // We only update state when the modal OPENS (visible=true, walletId!=null),
  // which means the content stays frozen during the close animation.
  const [content, setContent] = useState<ModalContent>({
    title: 'Delete Wallet?',
    subtitle: 'All transactions will be moved to your default wallet.',
    isLastWallet: false,
  });

  useEffect(() => {
    if (!visible || !walletId) return; // Don't recompute on close — keeps content frozen
    setContent(computeContent(walletId, accounts));
  }, [visible, walletId, accounts]);

  const { title, subtitle, isLastWallet } = content;

  const { isRendered, animatedStyle, backdropStyle } = useModalAnimation({
    visible,
    type: 'scale',
  });

  return (
    <Modal
      visible={isRendered}
      transparent={true}
      animationType="none"
      onRequestClose={onCancel}>
      <View style={{ zIndex: 9999, elevation: 99 }} className="flex-1 justify-center items-center px-6">
        <Animated.View style={[{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, backdropStyle]} />
        <Animated.View style={[animatedStyle, { width: '100%', alignItems: 'center' }]}>
          <View className="bg-surface w-full rounded-3xl p-6 items-center shadow-2xl">
          <View className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center mb-5">
            <Icon as={Wallet} size={28} className="text-red-500" />
          </View>

          <Text variant="h3" className="mb-2 text-center">{title}</Text>
          <Text className="text-muted text-center mb-8 px-2">{subtitle}</Text>

          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              className="flex-1 py-3.5 items-center justify-center bg-secondary rounded-full"
              onPress={onCancel}
              activeOpacity={0.7}>
              <Text className="text-foreground font-semibold">
                {isLastWallet ? 'Got It' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            {!isLastWallet && (
              <TouchableOpacity
                className="flex-1 py-3.5 items-center justify-center bg-red-500 rounded-full"
                onPress={onConfirm}
                activeOpacity={0.7}>
                <Text className="text-white font-semibold">Delete</Text>
              </TouchableOpacity>
            )}
          </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
