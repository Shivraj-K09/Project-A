import { useAuth } from '@/contexts/auth-context';
import { useProfileCompletion } from '@/hooks/use-user';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function Screen() {
  const {
    isAuthenticated,
    isLoading: authLoading,
    requiresTwoStepVerification,
    isTwoStepVerified,
  } = useAuth();
  const { data: profileStatus, isLoading: profileLoading } = useProfileCompletion();
  
  const [isReady, setIsReady] = useState(false);

  const shouldWaitForProfile = isAuthenticated && (!requiresTwoStepVerification || isTwoStepVerified);
  const isLoading = authLoading || (shouldWaitForProfile && profileLoading);

  useEffect(() => {
    let isMounted = true;
    if (!isLoading && isMounted) {
      setIsReady(true);
    }
    return () => { isMounted = false; }
  }, [isLoading]);

  // Hide splash screen once we've decided where to go
  useEffect(() => {
    let isMounted = true;
    if (isReady && isMounted) {
      SplashScreen.hideAsync();
    }
    return () => { isMounted = false; }
  }, [isReady]);

  // Splash screen covers everything while loading
  if (!isReady) {
    return <View className="flex-1 bg-background" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (requiresTwoStepVerification && !isTwoStepVerified) {
    return <Redirect href="/(auth)/two-step-verify" />;
  }

  if (!profileStatus?.isComplete) {
    return <Redirect href="/(auth)/phone-setup" />;
  }

  // Redirect to the new tab navigator
  return <Redirect href="/(tabs)/chats" />;
}
