import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import Animated, { SlideInDown, SlideOutDown, runOnJS } from 'react-native-reanimated';

export interface SlideSheetHandle {
  close: () => void;
}

interface SlideSheetProps {
  onClosed: () => void;
  children: React.ReactNode;
}

export const SlideSheet = forwardRef<SlideSheetHandle, SlideSheetProps>(
  ({ onClosed, children }, ref) => {
    const [open, setOpen] = useState(true);
    const onClosedRef = useRef(onClosed);
    onClosedRef.current = onClosed;

    const close = () => {
      if (!open) return;
      setOpen(false);
    };

    const handleAnimDone = () => {
      onClosedRef.current();
    };

    useImperativeHandle(ref, () => ({ close }), [close]);

    if (!open) return null;

    return (
      <Animated.View
        style={{ flex: 1 }}
        entering={SlideInDown.duration(320)}
        exiting={SlideOutDown.duration(260).withCallback(() => {
          'worklet';
          runOnJS(handleAnimDone)();
        })}>
        {children}
      </Animated.View>
    );
  },
);
