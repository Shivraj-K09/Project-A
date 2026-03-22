import '@/global.css';
import { Platform, View } from 'react-native';

// 🛡️ Universal Pro-Grade Crypto
// Web has built-in SubtleCrypto. Mobile needs high-performance JSI polyfill.
if (Platform.OS !== 'web') {
  const { install } = require('react-native-quick-crypto');
  install();
}


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

import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';

import { DeactivatedAccountBanner } from '@/components/account/deactivated-account-banner';
import { useProfileCompletion } from '@/hooks/use-user';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { data: profileStatus, isLoading: profileLoading } = useProfileCompletion();
  const segments = useSegments();
  const router = useRouter();
  const segmentPath = useMemo(() => segments.join('/'), [segments]);
  /** Single navigation to main tabs — avoids double replace with index route + this effect. */
  const replacedToChatsRef = useRef(false);
  /**
   * Avoid two router.replace('/') → onboarding: (1) segments often show (auth) with no 2nd slice before the child is resolved;
   * (2) two effect runs on the same pre-auth segmentPath. Reset lock once the URL enters the (auth) group.
   * See Expo redirects: https://docs.expo.dev/router/reference/redirects
   */
  const loggedOutOnboardingReplaceLockRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      loggedOutOnboardingReplaceLockRef.current = false;
      return;
    }

    if (segmentPath.includes('(auth)')) {
      loggedOutOnboardingReplaceLockRef.current = false;
    }

    const firstSegment = segments[0] as string | undefined;
    const secondSegment = segments[1] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)';
    const isPublicAuthRoute =
      inAuthGroup &&
      (secondSegment === 'onboarding' ||
        secondSegment === 'login' ||
        secondSegment === undefined);

    if (isPublicAuthRoute) return;

    if (loggedOutOnboardingReplaceLockRef.current) return;
    loggedOutOnboardingReplaceLockRef.current = true;
    router.replace('/(auth)/onboarding');
  }, [isAuthenticated, isLoading, segmentPath, router, segments]);

  useEffect(() => {
    if (!isAuthenticated) {
      replacedToChatsRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading || profileLoading) return;
    if (!isAuthenticated) return;

    const firstSegment = segments[0] as string | undefined;
    const secondSegment = segments[1] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)';
    const isPublicAuthRoute = inAuthGroup && (secondSegment === 'onboarding' || secondSegment === 'login');
    const isSetupRoute = inAuthGroup && secondSegment === 'phone-setup';
    const shouldGoToTabs =
      isPublicAuthRoute ||
      isSetupRoute ||
      firstSegment === 'index' ||
      !firstSegment ||
      firstSegment === undefined;

    if (!profileStatus?.isComplete) {
      replacedToChatsRef.current = false;
      if (secondSegment !== 'phone-setup') {
        router.replace('/(auth)/phone-setup');
      }
    } else if (shouldGoToTabs) {
      if (replacedToChatsRef.current) return;
      if (firstSegment === '(tabs)') return;
      replacedToChatsRef.current = true;
      router.replace('/(tabs)/chats');
    }
  }, [isAuthenticated, segmentPath, isLoading, profileLoading, profileStatus, router, segments]);

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
