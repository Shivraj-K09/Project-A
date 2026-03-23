import { useAuth } from '@/contexts/auth-context';
import { useProfileCompletion } from '@/hooks/use-user';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function BootstrapScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isLoading: profileLoading } = useProfileCompletion();

  const [isReady, setIsReady] = useState(false);

  // We only care about profileLoading if we are already authenticated.
  // The layout handles redirecting unauthenticated users to onboarding.
  const appLoading = authLoading || (isAuthenticated && profileLoading);

  useEffect(() => {
    if (!appLoading) {
      setIsReady(true);
      // Coordinate splash screen hide once the initial state is determined.
      // A small delay ensures the navigation system is ready to render the next target.
      const timer = setTimeout(() => {
        SplashScreen.hideAsync();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [appLoading]);

  // While bootstrapping or transitioning (e.g. while RootLayoutNav replaces this screen),
  // we show a clean themed background with a subtle loader to prevent a blank 'flash'.
  return (
    <View className="flex-1 items-center justify-center bg-background">
      {(!isReady || appLoading) && (
        <ActivityIndicator size="small" color="#6366f1" className="opacity-30" />
      )}
    </View>
  );
}
