import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useProtectedRoute } from '@/hooks/use-protected-route';
import {
  useCheckUsername,
  useProfileCompletion,
  useUpdateNotificationSettings,
  useUpdateProfile,
  useUserProfile,
} from '@/hooks/use-user';
import { Text } from '@/components/ui/text';
import { useColorScheme } from 'nativewind';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { isDevice } from 'expo-device';
import Constants from 'expo-constants';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  ArrowRight,
  AtSign,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  Search,
  Shield,
  User,
  X,
} from 'lucide-react-native';

// ─── Country Codes ─────────────────────────────────────────
const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India', min: 10, max: 10 },
  { code: '+1', flag: '🇺🇸', name: 'United States', min: 10, max: 10 },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom', min: 10, max: 11 },
  { code: '+971', flag: '🇦🇪', name: 'UAE', min: 9, max: 9 },
  { code: '+65', flag: '🇸🇬', name: 'Singapore', min: 8, max: 8 },
  { code: '+61', flag: '🇦🇺', name: 'Australia', min: 9, max: 9 },
  { code: '+49', flag: '🇩🇪', name: 'Germany', min: 10, max: 11 },
  { code: '+81', flag: '🇯🇵', name: 'Japan', min: 10, max: 10 },
  { code: '+82', flag: '🇰🇷', name: 'South Korea', min: 9, max: 10 },
  { code: '+86', flag: '🇨🇳', name: 'China', min: 11, max: 11 },
  { code: '+33', flag: '🇫🇷', name: 'France', min: 9, max: 9 },
  { code: '+39', flag: '🇮🇹', name: 'Italy', min: 9, max: 10 },
  { code: '+55', flag: '🇧🇷', name: 'Brazil', min: 10, max: 11 },
  { code: '+7', flag: '🇷🇺', name: 'Russia', min: 10, max: 10 },
  { code: '+62', flag: '🇮🇩', name: 'Indonesia', min: 9, max: 13 },
  { code: '+63', flag: '🇵🇭', name: 'Philippines', min: 10, max: 10 },
  { code: '+66', flag: '🇹🇭', name: 'Thailand', min: 9, max: 9 },
  { code: '+84', flag: '🇻🇳', name: 'Vietnam', min: 9, max: 10 },
  { code: '+90', flag: '🇹🇷', name: 'Turkey', min: 10, max: 10 },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria', min: 10, max: 11 },
  { code: '+27', flag: '🇿🇦', name: 'South Africa', min: 9, max: 9 },
  { code: '+52', flag: '🇲🇽', name: 'Mexico', min: 10, max: 10 },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia', min: 9, max: 10 },
  { code: '+64', flag: '🇳🇿', name: 'New Zealand', min: 8, max: 10 },
  { code: '+48', flag: '🇵🇱', name: 'Poland', min: 9, max: 9 },
  { code: '+31', flag: '🇳🇱', name: 'Netherlands', min: 9, max: 9 },
  { code: '+46', flag: '🇸🇪', name: 'Sweden', min: 7, max: 13 },
  { code: '+41', flag: '🇨🇭', name: 'Switzerland', min: 9, max: 9 },
  { code: '+34', flag: '🇪🇸', name: 'Spain', min: 9, max: 9 },
  { code: '+351', flag: '🇵🇹', name: 'Portugal', min: 9, max: 9 },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan', min: 10, max: 10 },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh', min: 10, max: 10 },
  { code: '+94', flag: '🇱🇰', name: 'Sri Lanka', min: 9, max: 9 },
  { code: '+977', flag: '🇳🇵', name: 'Nepal', min: 10, max: 10 },
  { code: '+20', flag: '🇪🇬', name: 'Egypt', min: 10, max: 10 },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia', min: 9, max: 9 },
  { code: '+974', flag: '🇶🇦', name: 'Qatar', min: 8, max: 8 },
  { code: '+968', flag: '🇴🇲', name: 'Oman', min: 8, max: 8 },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain', min: 8, max: 8 },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait', min: 8, max: 8 },
];

// ─── Username validation ───────────────────────────────────
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

// ─── Main Screen ───────────────────────────────────────────
export default function PhoneSetupScreen() {
  // 🛡️ ROUTE PROTECTION — redirects to login if session invalidated
  const { isAuthenticated, isLoading: authGuardLoading } = useProtectedRoute();

  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  // State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name ?? '');
  const [username, setUsername] = useState('');
  const [debouncedUsername, setDebouncedUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(
    user?.user_metadata?.avatar_url ?? null
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const usernameCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // React Query: Username availability check
  const {
    data: isUsernameAvailable,
    isLoading: isCheckingUsername,
    isError: usernameCheckError,
  } = useCheckUsername(debouncedUsername);

  // React Query: Profile update mutation
  const { data: profileCompletion } = useProfileCompletion();
  const { data: activeProfile } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const updateNotificationSettings = useUpdateNotificationSettings();

  // Filtered countries
  const filteredCountries = countrySearch
    ? COUNTRY_CODES.filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.code.includes(countrySearch)
      )
    : COUNTRY_CODES;

  // Validation
  const cleanNumber = phoneNumber.replace(/[\s\-()]/g, '');
  const isValidLength =
    cleanNumber.length >= selectedCountry.min && cleanNumber.length <= selectedCountry.max;
  const isAllDigits = /^\d+$/.test(cleanNumber);
  const isNameValid = name.trim().length >= 2;
  const usernameFormatValid =
    username.length >= 3 && username.length <= 30 && USERNAME_REGEX.test(username);
  const isUsernameValid = usernameFormatValid && isUsernameAvailable === true;
  const isPhoneValid = isValidLength && isAllDigits;
  const isFormValid = isNameValid && isUsernameValid && isPhoneValid && !isLoading;

  // Derive username error
  const usernameError = (() => {
    if (username.length === 0) return null;
    if (username.length > 0 && username.length < 3) return 'At least 3 characters';
    if (username.length > 30) return 'Maximum 30 characters';
    if (!USERNAME_REGEX.test(username)) return 'Only letters, numbers, and underscores';
    if (usernameCheckError) return 'Could not verify username';
    if (isUsernameAvailable === false) return 'Username already taken';
    return null;
  })();

  // ─── Username change handler (debounced) ─────────────────
  const handleUsernameChange = useCallback((text: string) => {
    const cleaned = text.replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(cleaned);

    if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);

    if (cleaned.length >= 3 && USERNAME_REGEX.test(cleaned)) {
      usernameCheckTimeout.current = setTimeout(() => {
        setDebouncedUsername(cleaned);
      }, 500);
    } else {
      setDebouncedUsername('');
    }
  }, []);

  // ─── Avatar picker ───────────────────────────────────────
  const pickAvatar = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setAvatarUri(asset.uri);

    if (asset.base64 && user?.id) {
      setIsUploadingAvatar(true);
      try {
        const ext = asset.uri.split('.').pop() || 'jpg';
        const filePath = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, decode(asset.base64), {
            contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
            upsert: true,
          });
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(filePath);
        setAvatarUri(publicUrl);
      } catch (err) {
        console.error('Avatar upload error:', err);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  // ─── Submit (using React Query mutation) ─────────────────
  const handleContinue = async () => {
    if (!isFormValid || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      const fullNumber = `${selectedCountry.code}${cleanNumber}`;

      // Check phone uniqueness through a security-definer RPC so the users table can stay private.
      const { data: isPhoneAvailable, error: phoneAvailabilityError } = await supabase.rpc(
        'check_phone_number_availability',
        {
          p_phone_number: fullNumber,
          p_exclude_profile_id: activeProfile?.id ?? null,
        }
      );

      if (phoneAvailabilityError) throw phoneAvailabilityError;

      if (isPhoneAvailable === false) {
        Alert.alert(
          'Number already in use',
          'Another active profile has this number. For reclaim after delete, run Supabase migrations `20250322100000_users_phone_username_partial_unique` and `20250323100000_check_phone_exclude_profile`.'
        );
        setIsLoading(false);
        return;
      }
      if (isPhoneAvailable !== true) {
        Alert.alert('Could not verify phone', 'Check your connection and try again.');
        setIsLoading(false);
        return;
      }

      // --- Request Notification Permissions ---
      let showNotifications = false;
      let expoPushToken = null;

      try {
        if (isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }

          if (finalStatus === 'granted') {
            showNotifications = true;
            const tokenResponse = await Notifications.getExpoPushTokenAsync({
              projectId: Constants.expoConfig?.extra?.eas?.projectId,
            });
            expoPushToken = tokenResponse.data;
          }
        }
      } catch (permissionError) {
        console.log('Permission request skipped or failed:', permissionError);
      }

      // Use the mutation
      await updateProfile.mutateAsync({
        first_name: name.trim().split(' ')[0] || name.trim(),
        last_name: name.trim().split(' ').slice(1).join(' ') || null,
        username: username.toLowerCase(),
        email: user.email,
        phone_number: fullNumber,
        country_code: selectedCountry.code.replace('+', ''),
        avatar_url: avatarUri ?? user.user_metadata?.avatar_url ?? null,
        provider: user.app_metadata?.provider ?? 'google',
      });

      try {
        await updateNotificationSettings.mutateAsync({
          show_notifications: showNotifications,
          expo_push_token: expoPushToken,
        });
      } catch (notificationErr) {
        console.error('Notification settings update failed:', notificationErr);
      }

      router.replace('/');
    } catch (err: any) {
      if (__DEV__) console.error('[PhoneSetup]', err?.code, err?.message, err);
      if (err?.code === '42501') {
        Alert.alert(
          'Permission blocked',
          'Row-level security on public.users rejected this save. After the multi-profile migration, INSERT/UPDATE policies must use auth_user_id = auth.uid(), not id = auth.uid(). Run migration `20250324120000_users_rls_auth_user_id.sql` in Supabase SQL.'
        );
      } else if (err?.message?.includes('phone_number') || err?.code === '23505') {
        Alert.alert(
          'Number could not be saved',
          'Run in Supabase → SQL → paste the full file `20250324100000_drop_all_global_phone_username_uniques.sql` from your project (it drops global phone/username uniques, then adds partial indexes for active rows only).'
        );
      } else if (err?.message?.includes('username')) {
        // Username was taken between check and save
        setDebouncedUsername(username); // Re-trigger the check
      } else {
        console.error('Phone setup error:', err);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Show nothing while auth guard is loading ────────────
  if (authGuardLoading || !isAuthenticated) {
    return <View className="flex-1 bg-background" />;
  }

  // ─── Username status indicator ───────────────────────────
  const UsernameStatus = () => {
    if (username.length === 0) return null;
    if (isCheckingUsername) return <ActivityIndicator size="small" color="#6366f1" />;
    if (usernameError) {
      return (
        <View className="flex-row items-center gap-1">
          <X size={13} color="#ef4444" strokeWidth={3} />
          <Text className="text-[11px] font-semibold text-red-500">{usernameError}</Text>
        </View>
      );
    }
    if (isUsernameAvailable === true) {
      return (
        <View className="flex-row items-center gap-1">
          <Check size={13} color="#22c55e" strokeWidth={3} />
          <Text className="text-[11px] font-semibold text-green-500">Available</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <Animated.ScrollView
          entering={FadeIn.duration(300)}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* ─── Back + Header Row ─────────────────────────── */}
          <Animated.View
            entering={FadeIn.duration(300)}
            className="mb-6 flex-row items-center gap-3">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (router.canGoBack()) router.back();
                else router.replace('/(auth)/login');
              }}
              hitSlop={16}
              className="h-10 w-10 items-center justify-center rounded-xl bg-secondary active:opacity-70">
              <ChevronLeft size={20} color={isDark ? '#a1a1aa' : '#52525b'} strokeWidth={2.5} />
            </Pressable>
            <RNText className="text-lg font-bold text-foreground">Profile Setup</RNText>
          </Animated.View>

          {/* ─── Title + Subtitle ──────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(80).duration(400).springify()} className="mb-6">
            <RNText className="text-2xl font-extrabold tracking-tight text-foreground">
              Complete your profile
            </RNText>
            <Text className="mt-1 text-sm leading-5 text-muted-foreground">
              Set up your identity so your friends can find you
            </Text>
            {profileCompletion?.isArchived ? (
              <View className="mt-4 rounded-xl border border-primary/25 bg-primary/10 px-3.5 py-3 dark:bg-primary/15">
                <Text className="text-[13px] font-semibold leading-[20px] text-foreground">
                  Your account was deleted before. Confirm your details below to turn it back on.
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {/* ─── Profile Picture ────────────────────────────── */}
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

          {/* ─── Full Name ─────────────────────────────────── */}
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

          {/* ─── Username ──────────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400).springify()}
            className="mb-4">
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Username
              </Text>
              <UsernameStatus />
            </View>
            <View
              className={`flex-row items-center gap-2.5 rounded-xl border px-3.5 dark:bg-input/30 ${
                usernameError
                  ? 'border-red-500/40 bg-red-500/5'
                  : isUsernameAvailable === true
                    ? 'border-green-500/40 bg-green-500/5'
                    : 'border-input bg-secondary/50'
              }`}>
              <AtSign
                size={16}
                color={
                  usernameError
                    ? '#ef4444'
                    : isUsernameAvailable === true
                      ? '#22c55e'
                      : isDark
                        ? '#52525b'
                        : '#a1a1aa'
                }
                strokeWidth={2}
              />
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

          {/* ─── Phone Number ──────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(240).duration(400).springify()}
            className="mb-4">
            <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Phone Number
            </Text>
            <View className="flex-row items-center overflow-hidden rounded-xl border border-input bg-secondary/50 dark:bg-input/30">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCountrySearch('');
                  setShowCountryPicker(true);
                }}
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

          {/* ─── Warning Box ───────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(280).duration(400).springify()}
            className="mb-4">
            <View className="flex-row gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] p-3.5 dark:border-amber-500/25 dark:bg-amber-500/10">
              <AlertTriangle size={16} color="#f59e0b" style={{ marginTop: 2 }} />
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

          {/* ─── Security Badge ────────────────────────────── */}
          <Animated.View
            entering={FadeInDown.delay(320).duration(400).springify()}
            className="mb-6 flex-row items-center justify-center gap-2">
            <Shield size={13} color={isDark ? '#4ade80' : '#16a34a'} />
            <Text className="text-xs font-medium text-green-500 dark:text-green-400">
              Your data is encrypted and secure
            </Text>
          </Animated.View>

          <View className="min-h-[20px] flex-1" />

          {/* ─── Continue Button ────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(350).duration(400).springify()} className="mb-2">
            <Pressable
              onPress={handleContinue}
              disabled={!isFormValid}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              {({ pressed }) => (
                <View
                  className="h-[60px] flex-row items-center rounded-full bg-foreground pl-6 pr-1.5"
                  style={{
                    opacity: !isFormValid ? 0.5 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    shadowColor: isDark ? '#6366f1' : '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isDark && isFormValid ? 0.35 : isFormValid ? 0.18 : 0,
                    shadowRadius: 20,
                    elevation: isFormValid ? 12 : 0,
                  }}>
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

      {/* ─── Country Picker Modal ──────────────────────────── */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCountryPicker(false)}>
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center border-b border-border px-4 pb-3">
            <Pressable
              onPress={() => setShowCountryPicker(false)}
              className="h-9 w-9 items-center justify-center rounded-full bg-secondary active:opacity-70">
              <X size={18} color={isDark ? '#a1a1aa' : '#52525b'} strokeWidth={2.5} />
            </Pressable>
            <RNText className="flex-1 text-center text-base font-bold text-foreground">
              Select Country
            </RNText>
            <View className="w-9" />
          </View>

          <View className="border-b border-border px-4 py-2.5">
            <View className="flex-row items-center gap-2.5 rounded-xl bg-secondary px-3 dark:bg-input/30">
              <Search size={16} color={isDark ? '#52525b' : '#a1a1aa'} />
              <TextInput
                value={countrySearch}
                onChangeText={setCountrySearch}
                placeholder="Search country or code..."
                placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
                className="h-10 flex-1 text-sm text-foreground"
                autoFocus
              />
              {countrySearch.length > 0 && (
                <Pressable onPress={() => setCountrySearch('')}>
                  <X size={16} color={isDark ? '#71717a' : '#a1a1aa'} />
                </Pressable>
              )}
            </View>
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = selectedCountry.code === item.code;
              return (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCountry(item);
                    setShowCountryPicker(false);
                    if (cleanNumber.length > item.max) {
                      setPhoneNumber(cleanNumber.slice(0, item.max));
                    }
                  }}
                  className={`flex-row items-center gap-4 border-b border-border/50 px-5 py-3.5 active:bg-accent ${
                    isSelected ? 'bg-primary/5' : ''
                  }`}>
                  <RNText className="text-2xl">{item.flag}</RNText>
                  <View className="flex-1">
                    <RNText
                      className={`text-[15px] font-semibold text-foreground ${isSelected ? 'text-primary' : ''}`}>
                      {item.name}
                    </RNText>
                    <Text className="text-xs text-muted-foreground">{item.code}</Text>
                  </View>
                  {isSelected && (
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-brand">
                      <Check size={14} color="#ffffff" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
