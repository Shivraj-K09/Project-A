import { ChatMarqueeBackground } from '@/components/shared/chat-marquee-bg';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
import { ArrowRight, Lock } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type OnboardingIntroProps = {
  onGetStarted: () => void;
  isReturning?: boolean;
};

export function OnboardingIntro({ onGetStarted, isReturning = false }: OnboardingIntroProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const bg = isDark ? '#0a0a0a' : '#ffffff';

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onGetStarted();
  };

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ChatMarqueeBackground
        isDark={isDark}
        insetTop={insets.top}
        animated={!isReturning}
      />

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}>
        <Animated.View entering={isReturning ? FadeInDown.duration(700).springify() : FadeInDown.delay(300).duration(700).springify()}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'flex-start',
              marginBottom: 16,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)',
              backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.1)',
            }}>
            <Lock size={14} color="#818cf8" />
            <RNText
              style={{
                fontSize: 11,
                fontWeight: '800',
                letterSpacing: 1.2,
                color: isDark ? '#a5b4fc' : '#4f46e5',
              }}>
              END-TO-END ENCRYPTED
            </RNText>
          </View>

          <RNText
            style={{
              color: isDark ? '#ffffff' : '#09090b',
              fontSize: 52,
              fontWeight: '600',
              letterSpacing: -1,
              lineHeight: 56,
              marginBottom: 12,
            }}>
            Your space.{'\n'}
            <RNText style={{ color: '#818cf8' }}>Your rules.</RNText>
          </RNText>

          <RNText
            style={{
              color: isDark ? '#a1a1aa' : '#52525b',
              fontSize: 18,
              lineHeight: 26,
              marginBottom: 28,
            }}>
            Message your people. Send photos, voice notes, whatever. We can't read it — and neither can anyone else.
          </RNText>

          <Pressable onPress={handleGetStarted} onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            {({ pressed }) => (
              <Animated.View
                style={{
                  height: 60,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 9999,
                  backgroundColor: isDark ? '#ffffff' : '#09090b',
                  paddingLeft: 28,
                  paddingRight: 6,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: isDark ? 0.15 : 0.2,
                  shadowRadius: 16,
                  elevation: 10,
                }}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <RNText
                    style={{
                      fontSize: 16,
                      fontWeight: '800',
                      letterSpacing: 1,
                      color: isDark ? '#09090b' : '#ffffff',
                    }}>
                    Join now
                  </RNText>
                </View>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#4f46e5',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
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
