import { useAuth } from '@/contexts/auth-context';
import { useProfileCompletion } from '@/hooks/use-user';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo, useRef, useState } from 'react';

export function useRootNavigation() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: profileStatus, isLoading: profileLoading } = useProfileCompletion();
  const segments = useSegments();
  const router = useRouter();

  const [isReady, setIsReady] = useState(false);
  const replacedToChatsRef = useRef(false);
  const loggedOutOnboardingLockRef = useRef(false);

  // Derive current location state
  const segmentPath = useMemo(() => segments.join('/'), [segments]);
  const firstSegment = segments[0] as string | undefined;
  const secondSegment = segments[1] as string | undefined;
  
  const inAuthGroup = firstSegment === '(auth)';
  const isPublicAuthRoute = inAuthGroup && (
    secondSegment === 'onboarding' || 
    secondSegment === 'login' || 
    secondSegment === undefined
  );
  const isSetupRoute = inAuthGroup && secondSegment === 'phone-setup';
  const onReactivate = segmentPath.includes('reactivate');

  const isLoading = authLoading || profileLoading;

  useEffect(() => {
    if (isLoading) return;

    // 1. GUEST FLOW
    if (!isAuthenticated) {
      replacedToChatsRef.current = false;
      
      if (!isPublicAuthRoute && !loggedOutOnboardingLockRef.current) {
        loggedOutOnboardingLockRef.current = true;
        router.replace('/(auth)/onboarding');
      }
      setIsReady(true);
      return;
    }

    // 2. AUTHENTICATED FLOW
    loggedOutOnboardingLockRef.current = false;

    // A. Archived/Reactivation Flow
    if (profileStatus?.isArchived) {
      replacedToChatsRef.current = false;
      if (!onReactivate) {
        router.replace('/(settings)/account-center/reactivate');
      }
      setIsReady(true);
      return;
    }

    // B. Onboarding/Completion Flow (Phone Setup)
    if (!profileStatus?.isComplete) {
      replacedToChatsRef.current = false;
      if (secondSegment !== 'phone-setup') {
        router.replace('/(auth)/phone-setup');
      }
      setIsReady(true);
      return;
    }

    // C. Main App Access (Tabs)
    const isRootOrAuth = isPublicAuthRoute || isSetupRoute || firstSegment === 'index' || !firstSegment;
    
    if (isRootOrAuth) {
      if (!replacedToChatsRef.current && firstSegment !== '(tabs)') {
        replacedToChatsRef.current = true;
        router.replace('/(tabs)/chats');
      }
    }

    setIsReady(true);
  }, [isAuthenticated, isLoading, profileStatus, segmentPath, firstSegment, secondSegment, isPublicAuthRoute, isSetupRoute, onReactivate, router]);

  // Handle Splash Screen Logic
  useEffect(() => {
    if (isReady && !isLoading) {
      // Small delay to ensure navigation has settled
      const timer = setTimeout(() => {
        SplashScreen.hideAsync();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isReady, isLoading]);

  return { 
    isReady: isReady && !isLoading,
    isAuthenticated,
    profileStatus
  };
}
