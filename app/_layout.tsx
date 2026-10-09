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

// Force document generation packages into the Metro bundle at the root level to prevent dynamic import issues
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Disable Reanimated's strict mode warnings which get triggered on theme changes by third-party chart/drag-list libraries
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

export { ErrorBoundary } from 'expo-router';

import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ui/toast-config';
import { AppProvider } from '@/context/AppContext';
import { AppLockProvider } from '@/context/AppLockContext';
import { loadThemePreference } from '@/lib/theme-persistence';
import { AppLockScreen } from '@/components/AppLockScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

function ThemeInit() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync('transparent');
    loadThemePreference().then((scheme) => {
      setColorScheme(scheme ?? 'light');
    });
  }, [setColorScheme]);

  return null;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <AppLockProvider>
          <ThemeProvider value={colorScheme === 'dark' ? NAV_THEME.dark : NAV_THEME.light}>
          <ThemeInit />
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
