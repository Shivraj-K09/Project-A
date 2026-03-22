import { View, ActivityIndicator, TouchableOpacity, AppState, type AppStateStatus, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { Lock } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAppLockEnabled, subscribeToAppLockChanges } from '@/lib/app-lock';
import { useThemeStore } from '@/store/theme-store';

export default function AppLockOverlay({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState<boolean | null>(null);
  const appState = useRef(AppState.currentState);
  const authTimeoutRef = useRef<any>(null);

  const checkAvailability = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(compatible && enrolled);
      return compatible && enrolled;
    } catch (err) {
      setHasBiometrics(false);
      return false;
    }
  }, []);

  const refreshLockState = useCallback(async () => {
    try {
      const enabled = await getAppLockEnabled();
      setIsEnabled(enabled);
      if (!enabled) setIsUnlocked(true);
      return enabled;
    } catch (err) {
      setIsEnabled(false);
      setIsUnlocked(true);
      return false;
    }
  }, []);

  const handleAuthenticate = useCallback(async () => {
    if (isAuthenticating) return;

    const available = await checkAvailability();
    if (!available) {
      setIsUnlocked(true);
      return;
    }

    setIsAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Social Media',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsUnlocked(true);
      }
    } catch (err) {
      console.error('[AppLock] Auth error:', err);
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, checkAvailability]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const enabled = await refreshLockState();
      await checkAvailability();
      
      if (isMounted && enabled) {
        authTimeoutRef.current = setTimeout(() => {
          if (!isUnlocked) void handleAuthenticate();
        }, 600);
      }
    };

    void init();

    const unsubscribe = subscribeToAppLockChanges((enabled) => {
      if (isMounted) {
        setIsEnabled(enabled);
        setIsUnlocked(!enabled);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      if (authTimeoutRef.current) clearTimeout(authTimeoutRef.current);
    };
  }, [refreshLockState, handleAuthenticate, checkAvailability]);

  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      const wasInBackground =
        appState.current.match(/inactive|background/) && nextState === 'active';
      const movedToBackground = /inactive|background/.test(nextState);

      if (wasInBackground) {
        const enabled = await getAppLockEnabled();
        setIsEnabled(enabled);
        if (enabled) {
          setIsUnlocked(false);
          setTimeout(() => void handleAuthenticate(), 300);
        } else {
          setIsUnlocked(true);
        }
      } else if (movedToBackground && isEnabled) {
        setIsUnlocked(false);
      }

      appState.current = nextState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [isEnabled, handleAuthenticate]);

  const brandColor = useThemeStore((state) => state.accentColor);

  if (isEnabled === null) return children;
  if (!isEnabled || isUnlocked) return children;

  return (
    <View style={StyleSheet.absoluteFill} className="z-[9999] items-center justify-center bg-background px-12">
      <View className="w-full items-center">
        <View className="mb-8 items-center justify-center">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-muted/30">
            <Lock size={32} color={brandColor} strokeWidth={1.5} />
          </View>
        </View>

        <Text className="text-[24px] font-semibold text-foreground">
          App Locked
        </Text>
        
        <Text className="mt-3 text-center text-[15px] leading-6 text-muted-foreground">
          Biometric authentication required to access your account.
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => void handleAuthenticate()}
          disabled={isAuthenticating}
          className="mt-12 h-14 w-full items-center justify-center rounded-2xl bg-brand"
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-[16px] font-semibold text-white">Unlock</Text>
          )}
        </TouchableOpacity>
        
        {!hasBiometrics && hasBiometrics !== null && (
          <Text className="mt-6 text-[13px] text-destructive/80 font-medium">
            Biometrics unavailable. Try device passcode.
          </Text>
        )}
      </View>
    </View>
  );
}

