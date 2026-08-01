import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const DURATION = 280;
const EASING = Easing.out(Easing.cubic);

export function useExpandAnimation(isExpanded: boolean) {
  const progress = useSharedValue(isExpanded ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isExpanded ? 1 : 0, { duration: DURATION, easing: EASING });
  }, [isExpanded]);

  const actionsStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(progress.value, [0, 1], [0, 70]),
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]),
    overflow: 'hidden' as const,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }));

  return { actionsStyle, chevronStyle };
}
