import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useChangePhoneNumber, useRequestPhoneChangeCode, useUserProfile } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/store/theme-store';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { AlertTriangle, Check, ChevronDown, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Constants ──────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India', min: 10, max: 10 },
  { code: '+1', flag: '🇺🇸', name: 'United States', min: 10, max: 10 },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom', min: 10, max: 11 },
  { code: '+971', flag: '🇦🇪', name: 'UAE', min: 9, max: 9 },
  { code: '+65', flag: '🇸🇬', name: 'Singapore', min: 8, max: 8 },
  { code: '+61', flag: '🇦🇺', name: 'Australia', min: 9, max: 9 },
];

export default function ChangeNumberScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useToast();
  const { brandColor, isDark } = useAppTheme();

  // Hooks
  const { data: profile } = useUserProfile();
  const requestOtp = useRequestPhoneChangeCode();
  const changeNumber = useChangePhoneNumber();

  // Form State
  const [oldPhone, setOldPhone] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [oldCountry, setOldCountry] = useState(COUNTRY_CODES[0]);
  const [newCountry, setNewCountry] = useState(COUNTRY_CODES[0]);

  const [activePicker, setActivePicker] = useState<'old' | 'new' | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Timer State
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pre-fill data
  useEffect(() => {
    if (profile) {
      if (profile.email) setEmail(profile.email);

      // Match country code and set phone number without it
      if (profile.phone_number) {
        // SCALING: Search using normalized digits (stripping '+' from the constant)
        const match = COUNTRY_CODES.find((c) =>
          profile.phone_number?.startsWith(c.code.replace('+', ''))
        );

        if (match) {
          const cleanPrefix = match.code.replace('+', '');
          setOldCountry(match);
          // Strip the country code digits from the stored string
          const digitsOnly = profile.phone_number.slice(cleanPrefix.length);
          setOldPhone(digitsOnly);
        } else {
          setOldPhone(profile.phone_number);
        }
      }
    }
  }, [profile]);

  // Handle Countdown
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown]);

  // Validation
  const isEmailValid = email.includes('@');
  const isNewValid = newPhone.length >= newCountry.min;
  const isOtpValid = otp.length >= 6;
  const isFormValid = isEmailValid && isNewValid && isOtpValid && !isLoading;

  const handleSendCode = async () => {
    if (countdown > 0) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsLoading(true);

      // 🛡️ SECURITY: The hook now automatically uses the trusted session email.
      // We no longer pass the email from the client to prevent spam/abuse.
      await requestOtp.mutateAsync();

      setCountdown(60);
      toast({ message: 'Verification code sent to your email.', variant: 'success' });
    } catch (err: any) {
      toast({ message: err.message || 'Failed to send code.', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!isFormValid) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsLoading(true);

      const cleanEmail = email.trim();
      const cleanOtp = otp.trim();
      const cleanNewPhone = newPhone.trim();

      // SCALING RESOLUTION: Normalize by removing everything except digits
      const fullPhoneNumber = `${newCountry.code}${cleanNewPhone}`.replace(/\D/g, '');

      if (__DEV__) console.log('[ChangeNumber] Verifying identity with OTP token...');

      await changeNumber.mutateAsync({
        token: cleanOtp,
        newPhone: fullPhoneNumber,
        countryCode: newCountry.code,
      });

      toast({ message: 'Phone number updated successfully!', variant: 'success' });
      router.back();
    } catch (err: any) {
      if (__DEV__) console.error('[ChangeNumber] Error completing phone change:', err);
      toast({ message: err.message || 'Verification failed.', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCountries = countrySearch
    ? COUNTRY_CODES.filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.code.includes(countrySearch)
      )
    : COUNTRY_CODES;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 24,
          paddingTop: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(400)}>
          {/* 1. Phone Numbers Section */}
          <View className="mb-10">
            <Text className="mb-4 text-[12px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50">
              Phone Migration
            </Text>

            {/* Old Number */}
            <View className="mb-6">
              <Label
                className="font-semibol mb-2 text-[11px] uppercase tracking-[0.1em] text-brand"
                style={{ color: brandColor }}>
                Old Phone Number
              </Label>
              <View
                className="flex-row items-center overflow-hidden rounded-2xl border-[1.5px] bg-muted/5 opacity-60"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }}>
                <View className="h-14 flex-row items-center gap-2 bg-transparent px-4">
                  <Text className="text-xl">{oldCountry.flag}</Text>
                  <Text className="text-[17px] font-black text-foreground">{oldCountry.code}</Text>
                </View>
                <View
                  className="h-6 w-[1.5px]"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  }}
                />
                <Input
                  value={oldPhone}
                  editable={false}
                  placeholder="Old number"
                  className="font-semibol h-14 flex-1 border-0 !bg-transparent px-4 text-[17px]"
                />
              </View>
            </View>

            {/* New Number */}
            <View>
              <Label
                className="font-semibol mb-2 text-[11px] uppercase tracking-[0.1em] text-brand"
                style={{ color: brandColor }}>
                New Phone Number
              </Label>
              <View
                className="flex-row items-center overflow-hidden rounded-2xl border-[1.5px] bg-muted/5"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActivePicker('new')}
                  className="h-14 flex-row items-center gap-2 bg-transparent px-4">
                  <Text className="text-xl">{newCountry.flag}</Text>
                  <Text className="text-[17px] font-black text-foreground">{newCountry.code}</Text>
                  <ChevronDown size={14} color={isDark ? '#fff' : '#000'} strokeWidth={2.5} />
                </TouchableOpacity>
                <View
                  className="h-6 w-[1.5px]"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  }}
                />
                <Input
                  value={newPhone}
                  onChangeText={setNewPhone}
                  placeholder="New number"
                  keyboardType="phone-pad"
                  maxLength={newCountry.max}
                  className="font-semibol h-14 flex-1 border-0 !bg-transparent px-4 text-[17px]"
                />
              </View>
            </View>
          </View>

          {/* 2. Identity Verification Section */}
          <View className="mb-8">
            <Text className="mb-4 text-[12px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/50">
              Identity Verification
            </Text>

            {/* Email Field */}
            <View className="mb-6">
              <Label className="font-semibol mb-2 text-[11px] uppercase tracking-[0.1em] text-brand">
                Registered Email
              </Label>
              <Input
                value={email}
                editable={false}
                placeholder="No email on file"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }}
                className="font-semibol h-14 rounded-2xl border-[1.5px] bg-muted/20 px-4 text-[17px] opacity-60"
              />
            </View>

            {/* OTP Field */}
            <View>
              <Label className="font-semibol mb-2 text-[11px] uppercase tracking-[0.1em] text-brand">
                Email OTP Code
              </Label>
              <View className="flex-row items-center gap-3">
                <View className="relative flex-1">
                  <Input
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="Enter 6-digit code"
                    keyboardType="number-pad"
                    maxLength={6}
                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }}
                    className={cn(
                      'font-semibol h-14 rounded-2xl border-[1.5px] bg-muted/5 px-4 text-[17px]',
                      otp.length > 0 && 'tracking-[0.5em]'
                    )}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSendCode}
                  disabled={!isEmailValid || countdown > 0 || isLoading}
                  className="h-14 items-center justify-center rounded-2xl bg-brand/10 px-6"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  }}>
                  <Text
                    className="font-semibol text-[14px]"
                    style={{ color: isEmailValid && countdown === 0 ? brandColor : '#71717a' }}>
                    {countdown > 0 ? `${countdown}s` : 'Send'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text className="mt-2 px-1 text-[11px] text-muted-foreground/60">
                Enter the security code sent to your email.
              </Text>
            </View>
          </View>

          {/* Simple Warning */}
          <View className="mt-4 flex-row gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4">
            <AlertTriangle size={18} color="#f59e0b" style={{ marginTop: 2 }} />
            <Text className="flex-1 text-[13px] leading-5 text-amber-600/80 dark:text-amber-400/60">
              For your security, we require email identity verification to complete this sensitive
              change.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Persistent Button at Bottom */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-background/80 px-6 pb-12 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 32) }}>
        <Button
          onPress={handleFinish}
          disabled={!isFormValid || isLoading}
          className={cn('h-14 rounded-2xl shadow-lg', isFormValid ? 'shadow-brand/20' : '')}
          style={{ backgroundColor: brandColor }}>
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center">
              <Text
                className={cn(
                  'font-semibol text-[16px]',
                  isFormValid ? 'text-white' : 'text-muted-foreground'
                )}>
                Confirm Change
              </Text>
              <Check size={18} color={isFormValid ? 'white' : '#71717a'} className="ml-2" />
            </View>
          )}
        </Button>
      </View>

      {/* Country Picker Modal */}
      <Modal visible={!!activePicker} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center border-b border-border/10 px-4 pb-4">
            <TouchableOpacity onPress={() => setActivePicker(null)}>
              <X size={24} color={isDark ? '#e4e4e7' : '#18181b'} />
            </TouchableOpacity>
            <Text className="font-semibol flex-1 text-center text-lg">Select Country</Text>
            <View className="w-6" />
          </View>

          <View className="p-4">
            <Input
              placeholder="Search..."
              className="h-12 rounded-xl bg-muted/50 px-4"
              onChangeText={setCountrySearch}
              value={countrySearch}
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
              const currentSelected = activePicker === 'old' ? oldCountry : newCountry;
              return (
                <TouchableOpacity
                  onPress={() => {
                    if (activePicker === 'old') setOldCountry(item);
                    else setNewCountry(item);
                    setActivePicker(null);
                    setCountrySearch('');
                  }}
                  className="flex-row items-center gap-4 border-b border-border/5 px-6 py-4">
                  <Text className="text-2xl">{item.flag}</Text>
                  <View className="flex-1">
                    <Text className="text-[16px] font-semibold text-foreground">{item.name}</Text>
                    <Text className="text-xs text-muted-foreground">{item.code}</Text>
                  </View>
                  {currentSelected.code === item.code && <Check size={18} color={brandColor} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
