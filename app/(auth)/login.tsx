import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Haptic } from '@/lib/haptic-utils';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowRight, ChevronLeft, Lock, Shield, Zap } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { ActivityIndicator, Dimensions, Pressable, Text as RNText, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleIcon } from '@/components/shared/icons';
import { useLogin } from '@/hooks/use-login';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FEATURES = [
  { icon: Lock, label: 'Private by default' },
  { icon: Shield, label: 'No data collection' },
  { icon: Zap, label: 'Blazing fast' },
] as const;

export default function LoginScreen() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const { handleGoogleLogin, isLoading } = useLogin();

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
          className="absolute inset-0"
        />
        <LinearGradient
          colors={
            isDark
              ? ['rgba(99,102,241,0.14)', 'transparent', 'rgba(139,92,246,0.08)']
              : ['rgba(99,102,241,0.1)', 'transparent', 'rgba(139,92,246,0.05)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={{ height: SCREEN_HEIGHT * 0.5 }}
          className="absolute inset-x-0 top-0"
        />
      </View>

      {/* Back button */}
      <Animated.View
        entering={FadeIn.duration(300)}
        className="absolute z-20"
        style={{ top: insets.top + 12, left: 16 }}>
        <Pressable
          onPress={() => {
            Haptic.impact(Haptics.ImpactFeedbackStyle.Light);
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
        className={cn(
          'elevation-16 absolute bottom-0 left-0 right-0 rounded-t-[28px] border-t border-border px-6 pt-8 shadow-2xl',
          isDark ? 'bg-[#141414] shadow-black/30' : 'bg-white shadow-black/10'
        )}
        style={{
          paddingBottom: insets.bottom + 20,
          minHeight: SCREEN_HEIGHT * 0.52,
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
          className="font-semibol mb-2.5 text-[40px] leading-[46px] tracking-tight text-foreground"
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
          onPressIn={() => Haptic.impact(Haptics.ImpactFeedbackStyle.Light)}
          disabled={isLoading}>
          {({ pressed }) => (
            <View
              className={cn(
                'elevation-12 h-[60px] flex-row items-center rounded-full bg-foreground pl-6 pr-1.5 shadow-2xl transition-transform',
                isDark ? 'shadow-brand/40' : 'shadow-black/20'
              )}
              style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}>
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
