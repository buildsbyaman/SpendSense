import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Calls `onBackground` when the app moves out of the `active` state and
 * `onActive` when it returns to `active`. Both callbacks are kept in refs so
 * changing them across renders does not re-register the listener.
 */
export function useAppState(onBackground?: () => void, onActive?: () => void) {
  const onBackgroundRef = useRef(onBackground);
  const onActiveRef = useRef(onActive);
  useEffect(() => {
    onBackgroundRef.current = onBackground;
    onActiveRef.current = onActive;
  }, [onBackground, onActive]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        onActiveRef.current?.();
      } else {
        onBackgroundRef.current?.();
      }
    });
    return () => sub.remove();
  }, []);
}