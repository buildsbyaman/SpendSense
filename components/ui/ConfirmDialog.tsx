import { View, TouchableOpacity, Modal } from 'react-native';
import { Text } from '@/components/ui/text';

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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity
        className="flex-1 items-center justify-center bg-black/50 px-6"
        activeOpacity={1}
        onPress={onCancel}>
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
      </TouchableOpacity>
    </Modal>
  );
}
