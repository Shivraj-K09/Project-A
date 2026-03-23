import { ChatMarqueeBackground } from '@/components/shared/chat-marquee-bg';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Lock } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, Text as RNText, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

type OnboardingIntroProps = {
  onGetStarted: () => void;
  isReturning?: boolean;
};

export function OnboardingIntro({ onGetStarted, isReturning = false }: OnboardingIntroProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onGetStarted();
  };

  return (
    <View className="flex-1 bg-background">
      <ChatMarqueeBackground isDark={isDark} insetTop={insets.top} animated={!isReturning} />

      <View
        className="absolute bottom-0 left-0 right-0 px-6"
        style={{ paddingBottom: insets.bottom + 24 }}>
        <Animated.View
          entering={
            isReturning
              ? FadeInDown.duration(700).springify()
              : FadeInDown.delay(300).duration(700).springify()
          }>
          {/* Encryption Badge */}
          <View className="mb-4 flex-row items-center gap-2 self-start rounded-[10px] border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 dark:border-indigo-500/40 dark:bg-indigo-500/18">
            <Lock size={14} color="#818cf8" />
            <RNText className="text-[11px] font-extrabold tracking-[1.2px] text-indigo-600 dark:text-indigo-300">
              END-TO-END ENCRYPTED
            </RNText>
          </View>

          {/* Headline */}
          <RNText className="mb-3 text-[52px] font-semibold leading-[56px] tracking-tight text-foreground">
            Your space.{'\n'}
            <RNText className="text-brand">Your rules.</RNText>
          </RNText>

          {/* Body Description */}
          <RNText className="mb-7 text-[18px] leading-[26px] text-muted-foreground">
            Message your people. Send photos, voice notes, whatever. We can't read it — and neither
            can anyone else.
          </RNText>

          {/* Join Button */}
          <Pressable
            onPress={handleGetStarted}
            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            {({ pressed }) => (
              <Animated.View
                className={cn(
                  'h-[60px] flex-row items-center justify-between rounded-full bg-foreground pl-7 pr-1.5 shadow-xl shadow-black/20 elevation-10 dark:shadow-black/40',
                  pressed && 'scale-[0.98]'
                )}>
                <View className="flex-1 items-center justify-center">
                  <RNText className="text-base font-extrabold tracking-widest text-background">
                    Join now
                  </RNText>
                </View>
                <View className="h-12 w-12 items-center justify-center rounded-full bg-indigo-600">
                  <ArrowRight size={20} color="#ffffff" strokeWidth={3} />
                </View>
              </Animated.View>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
