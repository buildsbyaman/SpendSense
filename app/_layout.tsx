import '@/global.css';
import './global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

export {
  ErrorBoundary,
} from 'expo-router';

import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ui/toast-config';

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme('light');
  }, []);

  return (
    <ThemeProvider value={NAV_THEME.light}>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-transaction"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <PortalHost />
      <Toast config={toastConfig} topOffset={25} />
    </ThemeProvider>
  );
}
