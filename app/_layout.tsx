import '@/global.css';
import './global.css';

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
import { loadThemePreference } from '@/lib/theme-persistence';

function ThemeInit() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    loadThemePreference().then((scheme) => {
      if (scheme) setColorScheme(scheme);
    });
  }, [setColorScheme]);

  return null;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'dark' ? NAV_THEME.dark : NAV_THEME.light}>
        <ThemeInit />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
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
    </AppProvider>
  );
}
