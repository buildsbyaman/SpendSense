import React from 'react';
import { type ViewProps } from 'react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';

interface ScreenTransitionProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Lean, high-performance entrance animation for modal/edit screens.
 * Provides a subtle 220ms ease-out fade and rise transition across all platforms (iOS, Android, Web).
 */
export function ScreenTransition({ children, style, className, ...props }: ScreenTransitionProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(220).easing(Easing.out(Easing.cubic))}
      style={[{ flex: 1 }, style]}
      className={className}
      {...props}>
      {children}
    </Animated.View>
  );
}

