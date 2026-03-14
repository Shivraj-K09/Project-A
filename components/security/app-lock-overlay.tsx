import { View, ActivityIndicator, TouchableOpacity, AppState, type AppStateStatus } from 'react-native';
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
  const appState = useRef(AppState.currentState);

  const refreshLockState = useCallback(async () => {
    const enabled = await getAppLockEnabled();
    setIsEnabled(enabled);
    if (!enabled) {
      setIsUnlocked(true);
    }
  }, []);

  useEffect(() => {
    void refreshLockState();

    const unsubscribe = subscribeToAppLockChanges((enabled) => {
      setIsEnabled(enabled);
      setIsUnlocked(!enabled);
    });

    return unsubscribe;
  }, [refreshLockState]);

  const handleAuthenticate = useCallback(async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Gravity',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        setIsUnlocked(true);
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating]);

  useEffect(() => {
    if (isEnabled && !isUnlocked && !isAuthenticating) {
      void handleAuthenticate();
    }
  }, [handleAuthenticate, isAuthenticating, isEnabled, isUnlocked]);

  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      const wasInBackground =
        appState.current.match(/inactive|background/) && nextState === 'active';
      const movedToBackground = /inactive|background/.test(nextState);

      if (wasInBackground) {
        const enabled = await getAppLockEnabled();
        setIsEnabled(enabled);
        setIsUnlocked(!enabled);
      } else if (movedToBackground && isEnabled) {
        setIsUnlocked(false);
      }

      appState.current = nextState;
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [isEnabled]);

  const brandColor = useThemeStore((state) => state.accentColor);

  if (isEnabled === null) return children;
  if (!isEnabled || isUnlocked) return children;

  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <View className="mb-10 items-center">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-[32px] border border-brand/20 bg-brand/5 shadow-sm">
          <Lock size={48} color={brandColor} strokeWidth={2.5} />
        </View>
        <Text className="text-center text-3xl font-bold tracking-tight text-foreground">App Locked</Text>
        <Text className="mt-4 px-6 text-center text-[15px] leading-6 text-muted-foreground/80">
          Biometric authentication is required to access your account.
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => void handleAuthenticate()}
        className="h-16 w-full items-center justify-center rounded-2xl bg-brand shadow-lg">
        {isAuthenticating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-lg font-bold text-white">Unlock App</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
