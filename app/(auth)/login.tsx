import { supabase } from '@/lib/supabase';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { router } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  Text as RNText,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ChevronLeft, Lock, Shield, Zap } from 'lucide-react-native';
import { Text } from '@/components/ui/text';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Configure Google Sign-In ──────────────────────────────
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

// ─── Google Icon ───────────────────────────────────────────
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </Svg>
  );
}

const FEATURES = [
  { icon: Lock, label: 'Private by default' },
  { icon: Shield, label: 'No data collection' },
  { icon: Zap, label: 'Blazing fast' },
] as const;

export default function LoginScreen() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const [isLoading, setIsLoading] = React.useState(false);

  // ─── Native Google Sign-In Handler ───────────────────────
  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);

    try {
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices();

      // Show native Google Sign-In UI (in-app bottom sheet)
      const signInResult = await GoogleSignin.signIn();

      // Get the ID token from the sign-in result
      const idToken = signInResult?.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      if (__DEV__) {
        console.log('[Auth] Google Sign-In successful, exchanging token with Supabase...');
      }

      // Exchange the Google ID token with Supabase for a session
      // This is the key part — no browser redirect needed!
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;

      if (__DEV__) {
        console.log('[Auth] Supabase session created for:', data.user?.email);
      }

      // ─── CHECK TWO-STEP VERIFICATION ─────────────────────
      const { data: settings } = await supabase
        .from('security_settings')
        .select('two_step_verification')
        .eq('user_id', data.user!.id)
        .maybeSingle();

      if (settings?.two_step_verification) {
        // Redirect to 2FA verification screen
        router.replace('/(auth)/two-step-verify');
      } else {
        // Proceed with normal flow
        router.replace('/(auth)/phone-setup');
      }
    } catch (err: any) {
      // Handle specific Google Sign-In errors
      if (err?.code === 'SIGN_IN_CANCELLED') {
        // User cancelled — not an error
        if (__DEV__) console.log('[Auth] User cancelled Google Sign-In');
      } else if (err?.code === 'IN_PROGRESS') {
        // Sign-in already in progress
        if (__DEV__) console.log('[Auth] Sign-in already in progress');
      } else if (err?.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        Alert.alert(
          'Google Play Services',
          'Google Play Services is not available on this device. Please update or install it.'
        );
      } else {
        console.error('[Auth] Google login error:', err);
        Alert.alert('Sign in failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Gradient background */}
      <View className="absolute inset-0">
        <LinearGradient
          colors={
            isDark
              ? ['#0a0a0a', '#110e28', '#1a1040', '#1e1550', '#1a1040', '#110e28', '#141414']
              : ['#ffffff', '#f5f3ff', '#ede9fe', '#ddd6fe', '#ede9fe', '#f5f3ff', '#ffffff']
          }
          locations={[0, 0.1, 0.22, 0.35, 0.48, 0.6, 0.75]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <LinearGradient
          colors={
            isDark
              ? ['rgba(99,102,241,0.14)', 'transparent', 'rgba(139,92,246,0.08)']
              : ['rgba(99,102,241,0.1)', 'transparent', 'rgba(139,92,246,0.05)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: SCREEN_HEIGHT * 0.5 }}
        />
      </View>

      {/* Back button */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className="absolute z-20"
        style={{ top: insets.top + 12, left: 16 }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(auth)/onboarding');
            }
          }}
          hitSlop={16}
          className="h-11 w-11 items-center justify-center rounded-full bg-foreground/5 dark:bg-foreground/10">
          <ChevronLeft size={22} color={isDark ? '#e4e4e7' : '#09090b'} />
        </Pressable>
      </Animated.View>

      {/* Feature pills over the gradient */}
      <Animated.View
        entering={FadeIn.delay(200).duration(700)}
        className="absolute left-0 right-0 items-center justify-center gap-3"
        style={{ top: insets.top + 80, bottom: SCREEN_HEIGHT * 0.55 }}>
        {FEATURES.map((item, i) => (
          <Animated.View
            key={item.label}
            entering={FadeInUp.delay(300 + i * 120)
              .duration(500)
              .springify()}>
            <View className="flex-row items-center gap-2.5 rounded-full border border-foreground/5 bg-foreground/5 px-5 py-2.5 dark:border-foreground/10 dark:bg-foreground/[0.06]">
              <item.icon size={16} color={isDark ? '#818cf8' : '#6366f1'} strokeWidth={2.5} />
              <Text className="text-sm font-semibold tracking-wide text-brand dark:text-brand">
                {item.label}
              </Text>
            </View>
          </Animated.View>
        ))}
      </Animated.View>

      {/* Card surface */}
      <Animated.View
        entering={FadeInDown.delay(150).duration(600).springify()}
        className="absolute bottom-0 left-0 right-0 rounded-t-[28px] border-t border-border bg-card px-6 pt-8"
        style={{
          paddingBottom: insets.bottom + 20,
          minHeight: SCREEN_HEIGHT * 0.52,
          backgroundColor: isDark ? '#141414' : '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 20,
          elevation: 16,
        }}>
        {/* Encrypted badge */}
        <View className="mb-5 flex-row items-center gap-2 self-start rounded-[10px] border border-brand/30 bg-brand/[0.12] px-3 py-1.5 dark:border-brand/40 dark:bg-brand/[0.18]">
          <Lock size={14} color="#818cf8" />
          <Text className="text-[11px] font-extrabold tracking-widest text-brand dark:text-brand">
            END-TO-END ENCRYPTED
          </Text>
        </View>

        {/* Heading */}
        <RNText
          className="mb-2.5 text-[40px] font-bold leading-[46px] tracking-tight text-foreground"
          style={{ letterSpacing: -0.8 }}>
          Let's get{'\n'}you <RNText className="text-brand">in.</RNText>
        </RNText>

        {/* Subtitle */}
        <Text className="mb-7 text-base leading-6 text-muted-foreground">
          Sign in with Google to continue.
        </Text>

        {/* Google CTA */}
        <Pressable
          onPress={handleGoogleLogin}
          onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          disabled={isLoading}>
          {({ pressed }) => (
            <View
              className="h-[60px] flex-row items-center rounded-full bg-foreground pl-6 pr-1.5"
              style={{
                transform: [{ scale: pressed ? 0.98 : 1 }],
                shadowColor: isDark ? '#6366f1' : '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDark ? 0.35 : 0.18,
                shadowRadius: 20,
                elevation: 12,
              }}>
              <View className="mr-3">
                {isLoading ? (
                  <ActivityIndicator size="small" color={isDark ? '#09090b' : '#ffffff'} />
                ) : (
                  <GoogleIcon size={18} />
                )}
              </View>
              <View className="flex-1 items-center">
                <Text className="text-base font-extrabold tracking-wide text-background">
                  {isLoading ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </View>
              <View className="h-12 w-12 items-center justify-center rounded-full bg-brand">
                <ArrowRight size={20} color="#ffffff" strokeWidth={3} />
              </View>
            </View>
          )}
        </Pressable>

        {/* Terms */}
        <Text className="mt-6 text-center text-xs leading-5 text-muted-foreground/60">
          By continuing, you agree to our{' '}
          <Text className="text-xs text-muted-foreground/60 underline">Terms</Text> and{' '}
          <Text className="text-xs text-muted-foreground/60 underline">Privacy Policy</Text>.
        </Text>
      </Animated.View>
    </View>
  );
}
