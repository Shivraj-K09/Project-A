import { useAuth } from '@/contexts/auth-context';
import {
  useCheckUsername,
  useProfileCompletion,
  useUpdateNotificationSettings,
  useUpdateProfile,
  useUserProfile,
} from '@/hooks/use-user';
import { COUNTRY_CODES, Country } from '@/lib/countries';
import { resolveAvatarUrl } from '@/lib/avatar';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import Constants from 'expo-constants';
import { isDevice } from 'expo-device';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState, useMemo } from 'react';
import { Alert } from 'react-native';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export function usePhoneSetup() {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name ?? '');
  const [username, setUsername] = useState('');
  const [debouncedUsername, setDebouncedUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(
    user?.user_metadata?.avatar_url ?? null
  );
  const [avatarStoragePath, setAvatarStoragePath] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const usernameCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // React Query: Username availability check
  const {
    data: isUsernameAvailable,
    isLoading: isCheckingUsername,
    isError: usernameCheckError,
  } = useCheckUsername(debouncedUsername);

  // React Query: Profile mutations/queries
  const { data: profileCompletion } = useProfileCompletion();
  const { data: activeProfile } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const updateNotificationSettings = useUpdateNotificationSettings();

  // Filtered countries
  const filteredCountries = useMemo(
    () =>
      countrySearch
        ? COUNTRY_CODES.filter(
            (c) =>
              c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
              c.code.includes(countrySearch)
          )
        : COUNTRY_CODES,
    [countrySearch]
  );

  // Validation / Derived State
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

  const usernameError = useMemo(() => {
    if (username.length === 0) return null;
    if (username.length > 0 && username.length < 3) return 'At least 3 characters';
    if (username.length > 30) return 'Maximum 30 characters';
    if (!USERNAME_REGEX.test(username)) return 'Only letters, numbers, and underscores';
    if (usernameCheckError) return 'Could not verify username';
    if (isUsernameAvailable === false) return 'Username already taken';
    return null;
  }, [username, isUsernameAvailable, usernameCheckError]);

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

  const handleCountrySelect = useCallback(
    (val: Country) => {
      setSelectedCountry(val);
      setShowCountryPicker(false);
      const cleaned = phoneNumber.replace(/[\s\-()]/g, '');
      if (cleaned.length > val.max) {
        setPhoneNumber(cleaned.slice(0, val.max));
      }
    },
    [phoneNumber]
  );

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
        setAvatarStoragePath(filePath);
        setAvatarUri((await resolveAvatarUrl(filePath)) ?? asset.uri);
      } catch (err) {
        if (__DEV__) console.error('Avatar upload error:', err);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleContinue = async () => {
    if (!isFormValid || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      // SCALING RESOLUTION: Normalize by removing everything except digits
      const fullNumber = `${selectedCountry.code}${cleanNumber}`.replace(/\D/g, '');

      const { data: isPhoneAvailable, error: phoneAvailabilityError } = await supabase.rpc(
        'check_phone_number_availability',
        {
          p_phone_number: fullNumber,
          p_exclude_profile_id: activeProfile?.id ?? null,
        }
      );

      if (phoneAvailabilityError) throw phoneAvailabilityError;

      if (isPhoneAvailable === false) {
        Alert.alert('Number already in use', 'Another active profile has this number.');
        setIsLoading(false);
        return;
      }
      if (isPhoneAvailable !== true) {
        Alert.alert('Could not verify phone', 'Check your connection and try again.');
        setIsLoading(false);
        return;
      }

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
        if (__DEV__) console.log('Permission request skipped or failed:', permissionError);
      }

      const profilePayload: Record<string, string | null> = {
        first_name: name.trim().split(' ')[0] || name.trim(),
        last_name: name.trim().split(' ').slice(1).join(' ') || null,
        username: username.toLowerCase(),
        email: user.email ?? null,
        phone_number: fullNumber,
        country_code: selectedCountry.code.replace('+', ''),
        provider: user.app_metadata?.provider ?? 'google',
      };

      if (avatarStoragePath) {
        profilePayload.avatar_url = avatarStoragePath;
      } else if (!activeProfile?.id && user.user_metadata?.avatar_url) {
        profilePayload.avatar_url = user.user_metadata.avatar_url ?? null;
      }

      await updateProfile.mutateAsync({
        ...profilePayload,
      });

      try {
        await updateNotificationSettings.mutateAsync({
          show_notifications: showNotifications,
          expo_push_token: expoPushToken,
        });
      } catch (notificationErr) {
        if (__DEV__) console.error('Notification settings update failed:', notificationErr);
      }

      router.replace('/');
    } catch (err: any) {
      if (__DEV__) console.error('[usePhoneSetup]', err?.code, err?.message, err);
      if (err?.code === '42501') {
        Alert.alert(
          'Permission blocked',
          'Your profile could not be saved due to security restrictions.'
        );
      } else if (err?.message?.includes('phone_number') || err?.code === '23505') {
        Alert.alert('Number already registered', 'This number is linked to another account.');
      } else if (err?.message?.includes('username')) {
        setDebouncedUsername(username);
      } else {
        if (__DEV__) console.error('Phone setup error:', err);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) router.back();
    else router.replace('/(auth)/login');
  }, []);

  const openCountryPicker = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCountrySearch('');
    setShowCountryPicker(true);
  }, []);

  return {
    // State
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
    setUsername,
    avatarUri,
    isUploadingAvatar,
    profileCompletion,
    isCheckingUsername,
    isUsernameAvailable,
    usernameError,
    filteredCountries,
    isFormValid,

    // Methods
    handleUsernameChange,
    handleCountrySelect,
    pickAvatar,
    handleContinue,
    handleBack,
    openCountryPicker,
  };
}
