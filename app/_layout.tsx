import '@/global.css';

// Polyfill TextDecoder in React Native (Hermes) to support latin1 encoding required by jsPDF
if (typeof globalThis !== 'undefined' && (globalThis as any).TextDecoder) {
  const NativeTextDecoder = (globalThis as any).TextDecoder;
  // @ts-ignore
  (globalThis as any).TextDecoder = class TextDecoder extends NativeTextDecoder {
    constructor(label?: string, options?: any) {
      const normalizedLabel = (label || 'utf-8').toLowerCase().replace(/_/g, '-');
      if (normalizedLabel === 'latin1' || normalizedLabel === 'latin-1') {
        super('utf-8', options); // Fallback constructor to avoid Hermes throwing on initialization
        // @ts-ignore
        this._isLatin1 = true;
      } else {
        super(label, options);
      }
    }

    decode(input?: BufferSource, options?: any): string {
      // @ts-ignore
      if (this._isLatin1 && input) {
        let bytes: Uint8Array;
        if (input instanceof ArrayBuffer) {
          bytes = new Uint8Array(input);
        } else if (ArrayBuffer.isView(input)) {
          bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
        } else {
          return '';
        }
        let str = '';
        for (let i = 0; i < bytes.length; i++) {
          str += String.fromCharCode(bytes[i]);
        }
        return str;
      }
      return super.decode(input, options);
    }
  };
}

// Document libraries (xlsx/jsPDF) are intentionally NOT imported here. They are
// loaded lazily on first export/import via `lib/heavy-modules.ts`; importing
// them at the app root made every cold start parse ~1MB of JS for a feature most
// sessions never use.

import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Strict mode surfaces accidental reads of shared values during render, which
// is useful while developing but noisy in release (and it can be triggered by
// third-party chart/drag-list internals we do not control). Dev builds only.
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: __DEV__,
});

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useCallback, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { markAppReady } from '@/lib/app-ready';

export { ErrorBoundary } from 'expo-router';

// Keep the native splash up until the first frame is fully hydrated. Called at
// module scope (not in an effect) so it applies before the first render.
SplashScreen.preventAutoHideAsync().catch(() => {});

import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ui/toast-config';
import { AppProvider } from '@/context/AppContext';
import { useAppSelector } from '@/context/store';
import { AppLockProvider } from '@/context/AppLockContext';
import { loadThemePreference } from '@/lib/theme-persistence';
import { AppLockScreen } from '@/components/AppLockScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

function ThemeInit({ onReady }: { onReady: () => void }) {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync('transparent').catch(() => {});
    loadThemePreference()
      .then((scheme) => {
        setColorScheme(scheme ?? 'light');
      })
      .catch(() => {})
      // Wait one painted frame so the new color scheme is committed before the
      // splash is allowed to hide (avoids a light->dark flash on cold start).
      .finally(() => {
        requestAnimationFrame(() => requestAnimationFrame(onReady));
      });
  }, [setColorScheme, onReady]);

  return null;
}

/**
 * Holds the native splash screen until both the persisted theme and the initial
 * data snapshot are ready, so the first visible frame is already correct.
 * Rendered inside AppProvider so it can read `ready`.
 */
function SplashGate({ themeReady }: { themeReady: boolean }) {
  const ready = useAppSelector((state) => state.ready);

  useEffect(() => {
    if (!ready || !themeReady) return;
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => markAppReady());
  }, [ready, themeReady]);

  return null;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const [themeReady, setThemeReady] = useState(false);
  const handleThemeReady = useCallback(() => setThemeReady(true), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <SplashGate themeReady={themeReady} />
        <AppLockProvider>
          <ThemeProvider value={colorScheme === 'dark' ? NAV_THEME.dark : NAV_THEME.light}>
            <ThemeInit onReady={handleThemeReady} />
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <Stack>
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  animationTypeForReplace: 'push',
                }}
              />
              <Stack.Screen
                name="onboarding"
                options={{
                  headerShown: false,
                  animation: 'slide_from_left',
                }}
              />
              <Stack.Screen
                name="add-transaction"
                options={{
                  presentation: 'transparentModal',
                  headerShown: false,
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="add-subscription"
                options={{
                  presentation: 'transparentModal',
                  headerShown: false,
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="add-wallet"
                options={{
                  presentation: 'transparentModal',
                  headerShown: false,
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen
                name="add-budget"
                options={{
                  presentation: 'transparentModal',
                  headerShown: false,
                  animation: 'slide_from_bottom',
                }}
              />
            </Stack>
            <PortalHost />
            <Toast
              config={toastConfig}
              topOffset={insets.top + 12}
              bottomOffset={insets.bottom + 40}
            />
            <AppLockScreen />
          </ThemeProvider>
        </AppLockProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
