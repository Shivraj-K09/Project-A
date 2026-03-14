import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/query-client';
import type { Session, User } from '@supabase/supabase-js';
import * as React from 'react';
import { AppState, type AppStateStatus } from 'react-native';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresTwoStepVerification: boolean;
  isTwoStepVerified: boolean;
  signOut: () => Promise<void>;
  validateSession: () => Promise<void>;
  markTwoStepVerified: () => void;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const SESSION_VALIDATION_INTERVAL = 60 * 1000; // 1 minute

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [requiresTwoStepVerification, setRequiresTwoStepVerification] = React.useState(false);
  const [isTwoStepVerified, setIsTwoStepVerified] = React.useState(false);
  const [isTwoStepStatusLoading, setIsTwoStepStatusLoading] = React.useState(false);
  const appState = React.useRef(AppState.currentState);
  const validationTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const syncTwoStepState = React.useCallback(async (userId: string) => {
    setIsTwoStepStatusLoading(true);
    try {
      const { data, error } = await supabase
        .from('security_settings')
        .select('two_step_verification')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Failed to load 2FA status:', error);
        setRequiresTwoStepVerification(false);
        setIsTwoStepVerified(true);
        return;
      }

      const requires = !!data?.two_step_verification;
      setRequiresTwoStepVerification(requires);
      // Each sign-in/session restore requires one 2FA verification in this app session.
      setIsTwoStepVerified(!requires);
    } catch (error) {
      console.error('[Auth] Failed to sync 2FA state:', error);
      setRequiresTwoStepVerification(false);
      setIsTwoStepVerified(true);
    } finally {
      setIsTwoStepStatusLoading(false);
    }
  }, []);

  const forceSignOut = React.useCallback(async () => {
    console.log('[Auth] Forcing sign out - session invalid');
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore errors during sign out when session is already invalid.
    }
    setSession(null);
    setRequiresTwoStepVerification(false);
    setIsTwoStepVerified(false);
    setIsTwoStepStatusLoading(false);
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
      console.error('[Auth] Session validation error:', err);
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
          console.log('[Auth] Cached session invalid - clearing');
          try {
            await supabase.auth.signOut();
          } catch {
            // Ignore cleanup error.
          }
          if (isMounted) {
            setSession(null);
            setRequiresTwoStepVerification(false);
            setIsTwoStepVerified(false);
            setIsTwoStepStatusLoading(false);
            queryClient.clear();
          }
        } else if (isMounted) {
          setSession(cachedSession);
          await syncTwoStepState(cachedSession.user.id);
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
        setRequiresTwoStepVerification(false);
        setIsTwoStepVerified(false);
        setIsTwoStepStatusLoading(false);
        queryClient.clear();
        return;
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        void syncTwoStepState(newSession.user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncTwoStepState]);

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
    await supabase.auth.signOut();
    setSession(null);
    setRequiresTwoStepVerification(false);
    setIsTwoStepVerified(false);
    setIsTwoStepStatusLoading(false);
    queryClient.clear();
  }, []);

  const markTwoStepVerified = React.useCallback(() => {
    setIsTwoStepVerified(true);
  }, []);

  const value = React.useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoading: isLoading || (!!session && isTwoStepStatusLoading),
      requiresTwoStepVerification,
      isTwoStepVerified,
      signOut,
      validateSession,
      markTwoStepVerified,
    }),
    [
      session,
      isLoading,
      isTwoStepStatusLoading,
      requiresTwoStepVerification,
      isTwoStepVerified,
      signOut,
      validateSession,
      markTwoStepVerified,
    ]
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
