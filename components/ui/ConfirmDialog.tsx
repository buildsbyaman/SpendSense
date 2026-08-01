import { View, TouchableOpacity, Modal } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { useModalAnimation } from '@/hooks/useModalAnimation';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { isRendered, animatedStyle, backdropStyle } = useModalAnimation({
    visible,
    type: 'scale',
  });

  return (
    <Modal visible={isRendered} transparent animationType="none" onRequestClose={onCancel}>
      <TouchableOpacity
        style={{ zIndex: 9999, elevation: 99 }}
        className="flex-1 items-center justify-center px-6"
        activeOpacity={1}
        onPress={onCancel}>
        <Animated.View style={[{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, backdropStyle]} />
        <Animated.View style={animatedStyle}>
          <View
            className="w-full max-w-sm gap-5 rounded-3xl bg-surface p-6 shadow-2xl"
            onStartShouldSetResponder={() => true}>
          <View className="gap-2">
            <Text className="text-lg font-bold text-foreground">{title}</Text>
            <Text className="text-sm leading-5 text-muted">{message}</Text>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 items-center justify-center rounded-full bg-gray-100 py-3 dark:bg-gray-800"
              activeOpacity={0.8}>
              <Text className="text-sm font-semibold text-foreground">{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              className={`flex-1 items-center justify-center rounded-full py-3 ${destructive ? 'bg-red-500' : 'bg-primary'}`}
              activeOpacity={0.8}>
              <Text
                className={`text-sm font-semibold ${destructive ? 'text-white' : 'text-white dark:text-black'}`}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}
