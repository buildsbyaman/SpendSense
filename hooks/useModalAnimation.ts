import { useState, useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

export type ModalAnimationType = 'scale' | 'slide' | 'scale-origin';

interface UseModalAnimationProps {
  visible: boolean;
  type?: ModalAnimationType;
  damping?: number;
  stiffness?: number;
  mass?: number;
}

export function useModalAnimation({
  visible,
  type = 'scale',
  damping = 25, // Default smooth, no-bounce
  stiffness = 250,
  mass = 0.6,
}: UseModalAnimationProps) {
  const [isRendered, setIsRendered] = useState(visible);

  // Progress goes from 0 (hidden) to 1 (visible)
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (visible) {
      setIsRendered(true);
      progress.value = withSpring(1, { damping, stiffness, mass });
    } else {
      // For exit transitions, NEVER use spring physics: springs have a long asymptotic tail
      // and sub-pixel oscillations that cause hardware-accelerated views on Android to jitter
      // and linger as ghost boxes before unmounting. A linear/quad timing exit guarantees a
      // monotonic, crisp, jitter-free fade-out in exactly 150ms.
      progress.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.quad) }, () => {
        runOnJS(setIsRendered)(false);
      });

      // Safety fallback to guarantee cleanup on Android even if the frame callback is interrupted
      timeoutId = setTimeout(() => {
        setIsRendered(false);
      }, 190);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [visible, progress, damping, stiffness, mass]);

  // Animated style for the backdrop (bg-black/50)
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));

  // Animated style for the modal content
  const animatedStyle = useAnimatedStyle(() => {
    const clampedOpacity = interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP);

    if (type === 'scale') {
      return {
        opacity: clampedOpacity,
        transform: [
          { scale: interpolate(progress.value, [0, 1], [0.85, 1], Extrapolation.CLAMP) },
          { translateY: interpolate(progress.value, [0, 1], [15, 0], Extrapolation.CLAMP) },
        ],
      };
    } else if (type === 'scale-origin') {
      return {
        opacity: clampedOpacity,
        transform: [
          { scale: interpolate(progress.value, [0, 1], [0.85, 1], Extrapolation.CLAMP) },
          { translateY: interpolate(progress.value, [0, 1], [-15, 0], Extrapolation.CLAMP) },
          { translateX: interpolate(progress.value, [0, 1], [15, 0], Extrapolation.CLAMP) },
        ],
      };
    } else {
      // slide (bottom sheet)
      return {
        opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1], Extrapolation.CLAMP),
        transform: [
          { translateY: interpolate(progress.value, [0, 1], [500, 0], Extrapolation.CLAMP) },
        ],
      };
    }
  });

  return { isRendered, backdropStyle, animatedStyle };
}
