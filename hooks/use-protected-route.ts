import { useAuth } from '@/contexts/auth-context';
import { router, useSegments } from 'expo-router';
import { useEffect } from 'react';

/**
 * Protects a route by redirecting to login if user is not authenticated.
 * Place this at the top of any screen that requires auth.
 *
 * When the user's session is invalidated (e.g., deleted from backend),
 * the auth context updates → this hook fires → redirects to login.
 */
export function useProtectedRoute() {
  const { isAuthenticated, isLoading, requiresTwoStepVerification, isTwoStepVerified } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const isTwoStepScreen = inAuthGroup && segments[1] === 'two-step-verify';

    if (!isAuthenticated) {
      // Use setTimeout to avoid navigation during render
      const timer = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
      return () => clearTimeout(timer);
    }

    if (requiresTwoStepVerification && !isTwoStepVerified && !isTwoStepScreen) {
      const timer = setTimeout(() => {
        router.replace('/(auth)/two-step-verify');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, requiresTwoStepVerification, isTwoStepVerified, segments]);

  return { isAuthenticated, isLoading, requiresTwoStepVerification, isTwoStepVerified };
}
