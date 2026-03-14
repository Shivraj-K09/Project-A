import { OnboardingIntro } from '@/components/onboarding/onboarding-intro';
import { useColorScheme } from 'nativewind';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function OnboardingScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = isDark ? '#0a0a0a' : '#ffffff';

  return (
    <View className="flex-1 bg-background">
      <OnboardingIntro onGetStarted={() => router.push('/(auth)/login')} />
    </View>
  );
}
