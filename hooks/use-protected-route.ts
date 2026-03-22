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
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Use setTimeout to avoid navigation during render
      const timer = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, segments]);

  return { isAuthenticated, isLoading };
}
