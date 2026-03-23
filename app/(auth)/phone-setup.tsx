import { CountryPickerModal } from '@/components/auth-setup/country-picker-modal';
import { UsernameStatus } from '@/components/auth-setup/username-status';
import { Text } from '@/components/ui/text';
import { usePhoneSetup } from '@/hooks/use-phone-setup';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import { cn } from '@/lib/utils';
import * as Haptics from 'expo-haptics';
import {
  AlertTriangle,
  ArrowRight,
  AtSign,
  Camera,
  ChevronDown,
  ChevronLeft,
  Shield,
  User,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PhoneSetupScreen() {
  // 🛡️ ROUTE PROTECTION
  const { isAuthenticated, isLoading: authGuardLoading } = useProtectedRoute();

  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  const {
    phoneNumber,
    setPhoneNumber,
    selectedCountry,
    showCountryPicker,
    setShowCountryPicker,
    countrySearch,
    setCountrySearch,
    isLoading,
    name,
    setName,
    username,
    avatarUri,
    isUploadingAvatar,
    profileCompletion,
    isCheckingUsername,
    isUsernameAvailable,
    usernameError,
    filteredCountries,
    isFormValid,

    handleUsernameChange,
    handleCountrySelect,
    pickAvatar,
    handleContinue,
    handleBack,
    openCountryPicker,
  } = usePhoneSetup();

  // Computed Icon Colors
  const atSignColor = usernameError
    ? '#ef4444'
    : isUsernameAvailable === true
      ? '#22c55e'
      : isDark
        ? '#52525b'
        : '#a1a1aa';

  if (authGuardLoading || !isAuthenticated) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <Animated.ScrollView
          entering={FadeIn.duration(300)}
          contentContainerStyle={{
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 32,
          }}
          className="flex-1 px-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Header Row */}
          <Animated.View
            entering={FadeIn.duration(300)}
            className="mb-6 flex-row items-center gap-3">
            <Pressable
              onPress={handleBack}
              hitSlop={16}
              className="h-10 w-10 items-center justify-center rounded-xl bg-secondary active:opacity-70">
              <ChevronLeft size={20} color={isDark ? '#a1a1aa' : '#52525b'} strokeWidth={2.5} />
            </Pressable>
            <RNText className="text-lg font-bold text-foreground">Profile Setup</RNText>
          </Animated.View>

          {/* Title + Subtitle */}
          <Animated.View entering={FadeInDown.delay(80).duration(400).springify()} className="mb-6">
            <RNText className="text-2xl font-extrabold tracking-tight text-foreground">
              Complete your profile
            </RNText>
            <Text className="mt-1 text-sm leading-5 text-muted-foreground">
              Set up your identity so your friends can find you
            </Text>
            {profileCompletion?.isArchived && (
              <View className="mt-4 rounded-xl border border-primary/25 bg-primary/10 px-3.5 py-3 dark:bg-primary/15">
                <Text className="text-[13px] font-semibold leading-[20px] text-foreground">
                  Your account was deleted before. Confirm your details below to turn it back on.
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Profile Picture */}
          <Animated.View
            entering={FadeInDown.delay(120).duration(400).springify()}
            className="mb-6 items-center">
            <Pressable
              onPress={pickAvatar}
              disabled={isUploadingAvatar}
              className="active:opacity-80">
              <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[3px] border-primary/20 bg-secondary">
                {isUploadingAvatar ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : avatarUri ? (
                  <Image source={{ uri: avatarUri }} className="h-24 w-24" />
                ) : (
                  <User size={36} color={isDark ? '#52525b' : '#a1a1aa'} strokeWidth={1.5} />
                )}
              </View>
              <View className="absolute -bottom-0.5 -right-0.5 h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-brand">
                <Camera size={13} color="#fff" strokeWidth={2.5} />
              </View>
            </Pressable>
            <Text className="mt-2 text-xs text-muted-foreground">Tap to change photo</Text>
          </Animated.View>

          {/* Full Name */}
          <Animated.View
            entering={FadeInDown.delay(160).duration(400).springify()}
            className="mb-4">
            <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Full Name
            </Text>
            <View className="flex-row items-center gap-2.5 rounded-xl border border-input bg-secondary/50 px-3.5 opacity-60 dark:bg-input/30">
              <User size={16} color={isDark ? '#52525b' : '#a1a1aa'} strokeWidth={2} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
                className="h-12 flex-1 text-[15px] text-foreground"
                editable={false}
              />
            </View>
          </Animated.View>

          {/* Username */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400).springify()}
            className="mb-4">
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Username
              </Text>
              <UsernameStatus
                username={username}
                isCheckingUsername={isCheckingUsername}
                usernameError={usernameError}
                isUsernameAvailable={isUsernameAvailable}
              />
            </View>
            <View
              className={cn(
                'flex-row items-center gap-2.5 rounded-xl border px-3.5 dark:bg-input/30',
                usernameError
                  ? 'border-red-500/40 bg-red-500/5'
                  : isUsernameAvailable === true
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-input bg-secondary/50'
              )}>
              <AtSign size={16} color={atSignColor} strokeWidth={2} />
              <TextInput
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="Choose a unique username"
                placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
                autoCapitalize="none"
                autoCorrect={false}
                className="h-12 flex-1 text-[15px] text-foreground"
                editable={!isLoading}
              />
            </View>
            <Text className="ml-1 mt-1 text-[11px] text-muted-foreground/70">
              Letters, numbers, and underscores only
            </Text>
          </Animated.View>

          {/* Phone Number */}
          <Animated.View
            entering={FadeInDown.delay(240).duration(400).springify()}
            className="mb-4">
            <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Phone Number
            </Text>
            <View className="flex-row items-center overflow-hidden rounded-xl border border-input bg-secondary/50 dark:bg-input/30">
              <Pressable
                onPress={openCountryPicker}
                className="h-12 flex-row items-center gap-1.5 px-3 active:bg-foreground/5">
                <RNText className="text-base">{selectedCountry.flag}</RNText>
                <Text className="text-sm font-semibold text-foreground">
                  {selectedCountry.code}
                </Text>
                <ChevronDown size={14} color={isDark ? '#71717a' : '#a1a1aa'} strokeWidth={2} />
              </Pressable>
              <View className="h-6 w-[1px] bg-border" />
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your number"
                placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
                keyboardType="phone-pad"
                className="h-12 flex-1 px-3.5 text-[15px] text-foreground"
                editable={!isLoading}
                maxLength={selectedCountry.max}
              />
            </View>
          </Animated.View>

          {/* Warning Box */}
          <Animated.View
            entering={FadeInDown.delay(280).duration(400).springify()}
            className="mb-4">
            <View className="flex-row gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] p-3.5 dark:border-amber-500/25 dark:bg-amber-500/10">
              <AlertTriangle size={16} color="#f59e0b" className="mt-0.5" />
              <View className="flex-1 gap-1">
                <Text className="text-[13px] font-bold text-amber-600 dark:text-amber-400">
                  Enter your correct number
                </Text>
                <Text className="text-xs leading-[18px] text-amber-700/80 dark:text-amber-300/60">
                  Your friends will find you using this number. Each number can only be linked to
                  one account.
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Security Badge */}
          <Animated.View
            entering={FadeInDown.delay(320).duration(400).springify()}
            className="mb-6 flex-row items-center justify-center gap-2">
            <Shield size={13} color={isDark ? '#4ade80' : '#16a34a'} />
            <Text className="text-xs font-medium text-green-500 dark:text-green-400">
              Your data is encrypted and secure
            </Text>
          </Animated.View>

          <View className="min-h-[20px] flex-1" />

          {/* Continue Button */}
          <Animated.View entering={FadeInUp.delay(350).duration(400).springify()} className="mb-2">
            <Pressable
              onPress={handleContinue}
              disabled={!isFormValid}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              {({ pressed }) => (
                <View
                  className={cn(
                    'elevation-12 h-[60px] flex-row items-center rounded-full bg-foreground pl-6 pr-1.5 shadow-2xl transition-all',
                    !isFormValid
                      ? 'elevation-0 opacity-50'
                      : isDark
                        ? 'shadow-brand/40'
                        : 'shadow-black/18'
                  )}
                  style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}>
                  <View className="flex-1 items-center">
                    <Text className="text-base font-extrabold tracking-wide text-background">
                      {isLoading ? 'Setting up...' : 'Continue'}
                    </Text>
                  </View>
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-brand">
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <ArrowRight size={20} color="#ffffff" strokeWidth={3} />
                    )}
                  </View>
                </View>
              )}
            </Pressable>
          </Animated.View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      <CountryPickerModal
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        search={countrySearch}
        onSearchChange={setCountrySearch}
        countries={filteredCountries}
        selectedCode={selectedCountry.code}
        onSelect={handleCountrySelect}
        isDark={isDark}
      />
    </View>
  );
}
