import { View, TouchableOpacity, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { AlertTriangle } from 'lucide-react-native';
import { useModalAnimation } from '@/hooks/useModalAnimation';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  hideCancel?: boolean;
  icon?: any;
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
  hideCancel = false,
  icon,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Freeze content so it doesn't change visually while animating out
  const [content, setContent] = useState({
    title,
    message,
    confirmText,
    cancelText,
    destructive,
    hideCancel,
    icon,
  });

  useEffect(() => {
    if (visible) {
      setContent({ title, message, confirmText, cancelText, destructive, hideCancel, icon });
    }
  }, [visible, title, message, confirmText, cancelText, destructive, hideCancel, icon]);

  const { isRendered, animatedStyle, backdropStyle } = useModalAnimation({
    visible,
    type: 'scale',
  });

  const displayIcon = content.icon || AlertTriangle;

  return (
    <Modal visible={isRendered} transparent animationType="none" onRequestClose={onCancel}>
      <TouchableOpacity
        style={{ zIndex: 9999, elevation: 99 }}
        className="flex-1 items-center justify-center px-6"
        activeOpacity={1}
        onPress={onCancel}>
        <Animated.View style={[{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, backdropStyle]} />
        <Animated.View style={[animatedStyle, { width: '100%', alignItems: 'center' }]}>
          <View
            className="w-full rounded-2xl border border-border bg-surface p-6 items-center shadow-2xl"
            onStartShouldSetResponder={() => true}>
            
            <View className="w-16 h-16 rounded-full items-center justify-center mb-5 bg-red-50 dark:bg-red-900/20">
              <Icon as={displayIcon} size={28} className="text-red-500" />
            </View>

            <Text variant="h3" className="mb-2 text-center text-foreground">{content.title}</Text>
            <Text className="text-muted text-center mb-8 px-2">{content.message}</Text>

            <View className="flex-row gap-3 w-full">
              {!content.hideCancel && (
                <TouchableOpacity
                  onPress={onCancel}
                  className="flex-1 items-center justify-center rounded-xl bg-secondary py-3.5"
                  activeOpacity={0.8}>
                  <Text className="text-sm font-semibold text-foreground">{content.cancelText}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onConfirm}
                className={`flex-1 items-center justify-center rounded-xl py-3.5 ${content.destructive && !content.hideCancel ? 'bg-red-500' : 'bg-primary'}`}
                activeOpacity={0.8}>
                <Text
                  className={`text-sm font-semibold ${content.destructive && !content.hideCancel ? 'text-white' : 'text-white dark:text-black'}`}>
                  {content.confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}
