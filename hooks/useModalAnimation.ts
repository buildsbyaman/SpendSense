import { useState, useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
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
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      progress.value = withSpring(1, { damping, stiffness, mass });
    } else if (isRendered) {
      progress.value = withSpring(0, { damping, stiffness, mass }, (finished) => {
        if (finished) {
          runOnJS(setIsRendered)(false);
        }
      });
    }
  }, [visible, isRendered, progress, damping, stiffness, mass]);

  // Animated style for the backdrop (bg-black/50)
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  // Animated style for the modal content
  const animatedStyle = useAnimatedStyle(() => {
    if (type === 'scale') {
      return {
        opacity: progress.value,
        transform: [
          { scale: interpolate(progress.value, [0, 1], [0.85, 1]) },
          { translateY: interpolate(progress.value, [0, 1], [15, 0]) }, // Slightly up
        ],
      };
    } else if (type === 'scale-origin') {
      return {
        opacity: progress.value,
        transform: [
          { scale: interpolate(progress.value, [0, 1], [0.85, 1]) },
          { translateY: interpolate(progress.value, [0, 1], [-15, 0]) }, // slightly down
          { translateX: interpolate(progress.value, [0, 1], [15, 0]) },  // slightly left
        ],
      };
    } else {
      // slide (bottom sheet)
      return {
        opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]),
        transform: [
          { translateY: interpolate(progress.value, [0, 1], [500, 0]) },
        ],
      };
    }
  });

  return { isRendered, backdropStyle, animatedStyle };
}
