import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import * as React from 'react';
import { AppState, type AppStateStatus } from 'react-native';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  validateSession: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const SESSION_VALIDATION_INTERVAL = 60 * 1000; // 1 minute

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const appState = React.useRef(AppState.currentState);
  const validationTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const forceSignOut = React.useCallback(async () => {
    if (__DEV__) console.log('[Auth] Forcing sign out - session invalid');
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore errors during sign out when session is already invalid.
    }
    setSession(null);
    queryClient.clear();
  }, []);

  const validateSession = React.useCallback(async () => {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        if (session) await forceSignOut();
        return;
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        await forceSignOut();
      }
    } catch (err) {
      if (__DEV__) console.error('[Auth] Session validation error:', err);
      await forceSignOut();
    }
  }, [session, forceSignOut]);

  React.useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const {
        data: { session: cachedSession },
      } = await supabase.auth.getSession();

      if (cachedSession) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          if (__DEV__) console.log('[Auth] Cached session invalid - clearing');
          try {
            await supabase.auth.signOut();
          } catch {
            // Ignore cleanup error.
          }
          if (isMounted) {
            setSession(null);
            queryClient.clear();
          }
        } else if (isMounted) {
          setSession(cachedSession);
        }
      }

      if (isMounted) setIsLoading(false);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);

      if (!newSession) {
        queryClient.clear();
        return;
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (session) {
      validationTimer.current = setInterval(validateSession, SESSION_VALIDATION_INTERVAL);
    } else if (validationTimer.current) {
      clearInterval(validationTimer.current);
      validationTimer.current = null;
    }

    return () => {
      if (validationTimer.current) clearInterval(validationTimer.current);
    };
  }, [session, validateSession]);

  React.useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active' && session) {
        void validateSession();
      }
      appState.current = nextState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [session, validateSession]);

  const signOut = React.useCallback(async () => {
    // 🚀 Instant Logout: Clear local state before waiting for Supabase to finish network request
    setSession(null);
    queryClient.clear();

    try {
      await supabase.auth.signOut();
    } catch (err) {
      if (__DEV__) console.error('[Auth] Supabase signOut error:', err);
    }
  }, []);

  const value = React.useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoading,
      signOut,
      validateSession,
    }),
    [session, isLoading, signOut, validateSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
