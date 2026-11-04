import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Triggers a light, crisp haptic feedback tick that simulates a native keyboard keypress.
 */
export const triggerKeypadHaptic = () => {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(10);
      }
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {
    // Ignore environments where haptics are not supported
  }
};

/**
 * Triggers a success haptic notification for form completion/save.
 */
export const triggerSuccessHaptic = () => {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([15, 30, 15]);
      }
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {
    // Ignore environments where haptics are not supported
  }
};

