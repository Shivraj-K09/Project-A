import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '@/lib/supabase';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export function useLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);

    try {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult?.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;

      router.replace('/');
    } catch (err: any) {
      if (err?.code === 'SIGN_IN_CANCELLED') {
        // User cancelled — not an error
      } else if (err?.code === 'IN_PROGRESS') {
        // Sign-in already in progress
      } else if (err?.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        Alert.alert(
          'Google Play Services',
          'Google Play Services is not available on this device. Please update or install it.'
        );
      } else {
        console.error('[Auth] Google login error:', err);
        const raw = String(err?.message ?? '');
        if (/phone|23505|unique|duplicate|violat/i.test(raw)) {
          Alert.alert(
            'Sign in blocked',
            'Supabase rejected creating/updating your profile. This usually happens when the phone number is already registered.'
          );
        } else {
          Alert.alert(
            'Sign in failed',
            __DEV__ && raw ? raw : 'Something went wrong. Please try again.'
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return {
    handleGoogleLogin,
    isLoading
  };
}
