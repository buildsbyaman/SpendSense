import { View, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import Animated from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { AlertTriangle } from 'lucide-react-native';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { InAppModal } from '@/components/ui/InAppModal';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  hideCancel?: boolean;
  icon?: any;
  layout?: 'row' | 'column' | 'auto';
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
  layout = 'auto',
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
    layout,
  });

  useEffect(() => {
    if (visible) {
      setContent({ title, message, confirmText, cancelText, destructive, hideCancel, icon, layout });
    }
  }, [visible, title, message, confirmText, cancelText, destructive, hideCancel, icon, layout]);

  const { isRendered, animatedStyle, backdropStyle } = useModalAnimation({
    visible,
    type: 'scale',
  });

  const displayIcon = content.icon || AlertTriangle;
  const isStacked =
    content.layout === 'column' ||
    (content.layout !== 'row' &&
      !content.hideCancel &&
      (content.confirmText.length > 9 || content.cancelText.length > 9));

  return (
    <InAppModal visible={isRendered} onRequestClose={onCancel}>
      <TouchableOpacity
        style={{ zIndex: 9999, elevation: 99 }}
        className="flex-1 items-center justify-center px-6"
        activeOpacity={1}
        onPress={onCancel}>
        <Animated.View
          style={[
            {
              backgroundColor: 'rgba(0,0,0,0.55)',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            },
            backdropStyle,
          ]}
        />
        <Animated.View style={[animatedStyle, { width: '100%', alignItems: 'center' }]}>
          <View
            className="w-full max-w-[340px] items-center rounded-3xl border border-border bg-surface p-6 shadow-2xl"
            onStartShouldSetResponder={() => true}>
            <View
              className={`mb-4 h-14 w-14 items-center justify-center rounded-full border ${
                content.destructive
                  ? 'border-red-500/20 bg-red-500/10 dark:bg-red-500/15'
                  : 'border-black/10 bg-black/5 dark:border-white/15 dark:bg-white/10'
              }`}>
              <Icon
                as={displayIcon}
                size={24}
                className={content.destructive ? 'text-red-500' : 'text-foreground'}
              />
            </View>

            <Text className="mb-2 text-center text-lg font-bold tracking-tight text-foreground">
              {content.title}
            </Text>
            <Text className="mb-6 px-1 text-center text-[13px] leading-5 text-muted">
              {content.message}
            </Text>

            {isStacked ? (
              <View className="w-full flex-col gap-2.5">
                <TouchableOpacity
                  onPress={onConfirm}
                  className={`h-11 w-full items-center justify-center rounded-xl active:scale-[0.99] ${
                    content.destructive
                      ? 'bg-red-500 active:bg-red-600 dark:bg-red-600'
                      : 'bg-primary'
                  }`}
                  activeOpacity={0.85}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                    className={`px-3 text-sm font-bold tracking-wide ${
                      content.destructive ? 'text-white' : 'text-white dark:text-black'
                    }`}>
                    {content.confirmText}
                  </Text>
                </TouchableOpacity>

                {!content.hideCancel && (
                  <TouchableOpacity
                    onPress={onCancel}
                    className="h-11 w-full items-center justify-center rounded-xl border border-border bg-secondary active:scale-[0.99]"
                    activeOpacity={0.85}>
                    <Text className="text-sm font-semibold text-foreground">
                      {content.cancelText}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View className="w-full flex-row gap-2.5">
                {!content.hideCancel && (
                  <TouchableOpacity
                    onPress={onCancel}
                    className="h-11 flex-1 items-center justify-center rounded-xl border border-border bg-secondary active:scale-[0.98]"
                    activeOpacity={0.85}>
                    <Text className="text-sm font-semibold text-foreground">
                      {content.cancelText}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={onConfirm}
                  className={`h-11 flex-1 items-center justify-center rounded-xl active:scale-[0.98] ${
                    content.destructive && !content.hideCancel
                      ? 'bg-red-500 active:bg-red-600 dark:bg-red-600'
                      : 'bg-primary'
                  }`}
                  activeOpacity={0.85}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                    className={`px-2 text-sm font-bold tracking-wide ${
                      content.destructive && !content.hideCancel
                        ? 'text-white'
                        : 'text-white dark:text-black'
                    }`}>
                    {content.confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </InAppModal>
  );
}
