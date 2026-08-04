import { useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Portal } from '@rn-primitives/portal';

interface InAppModalProps {
  visible: boolean;
  onRequestClose: () => void;
  animation?: 'none' | 'slide';
  children: React.ReactNode;
}

export function InAppModal({
  visible,
  onRequestClose,
  animation = 'none',
  children,
}: InAppModalProps) {
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onRequestClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onRequestClose]);

  if (!visible) return null;

  return (
    <Portal name="in-app-modal">
      <View style={[StyleSheet.absoluteFill, styles.layer]}>
        {animation === 'slide' ? (
          <Animated.View
            style={styles.fill}
            entering={SlideInDown.duration(320)}
            exiting={SlideOutDown.duration(260)}>
            {children}
          </Animated.View>
        ) : (
          children
        )}
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  layer: {
    zIndex: 9999,
    elevation: 99,
  },
  fill: {
    flex: 1,
  },
});
