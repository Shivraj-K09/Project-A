import '@/global.css';
import { Platform, View } from 'react-native';

if (Platform.OS !== 'web') {
  const { install } = require('react-native-quick-crypto');
  install();
}

import AppLockOverlay from '@/components/security/app-lock-overlay';
import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider } from '@/contexts/auth-context';
import { queryClient } from '@/lib/query-client';
import { NAV_THEME } from '@/lib/theme';
import { AppThemeProvider } from '@/store/theme-store';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export { ErrorBoundary } from 'expo-router';

// Keep splash visible until routing decision is made
SplashScreen.preventAutoHideAsync();

import { DeactivatedAccountBanner } from '@/components/account/deactivated-account-banner';
import { useRootNavigation } from '@/hooks/use-root-navigation';

function RootLayoutNav() {
  const { isReady } = useRootNavigation();


  return (
    <View className="flex-1">
      <DeactivatedAccountBanner />
      <View className="flex-1">
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
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <ToastProvider>
              <AuthProvider>
                <AppLayoutContent />
              </AuthProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </AppThemeProvider>
  );
}

function AppLayoutContent() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AppLockOverlay>
        <RootLayoutNav />
        <PortalHost />
      </AppLockOverlay>
    </ThemeProvider>
  );
}
