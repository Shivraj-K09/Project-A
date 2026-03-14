import '@/global.css';

import { AuthProvider } from '@/contexts/auth-context';
import { queryClient } from '@/lib/query-client';
import { NAV_THEME } from '@/lib/theme';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/components/ui/toast';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppLockOverlay from '@/components/security/app-lock-overlay';
import { AppThemeProvider } from '@/store/theme-store';

export { ErrorBoundary } from 'expo-router';

// Keep splash visible until routing decision is made
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <AppThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <ToastProvider>
              <AuthProvider>
                <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
                  <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                  <AppLockOverlay>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        headerShadowVisible: false,
                        animation: 'slide_from_right',
                      }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="(auth)" />
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="(settings)" />
                      <Stack.Screen name="profile-details" />
                      <Stack.Screen
                        name="camera"
                        options={{
                          animation: 'none',
                          presentation: 'fullScreenModal',
                        }}
                      />
                    </Stack>
                    <PortalHost />
                  </AppLockOverlay>
                </ThemeProvider>
              </AuthProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </AppThemeProvider>
  );
}
