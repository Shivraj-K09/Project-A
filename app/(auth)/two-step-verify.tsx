import { Text } from '@/components/ui/text';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  ArrowLeft,
  Key,
  Smartphone,
  ShieldAlert,
  ChevronRight,
  Lock,
} from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useSecuritySettings, useUserProfile } from '@/hooks/use-user';
import { useToast } from '@/components/ui/toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TwoStepVerifyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const brandColor = '#6366f1';
  const { toast } = useToast();
  const { markTwoStepVerified } = useAuth();

  const { data: settings, isLoading: settingsLoading } = useSecuritySettings();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  const [verifyStep, setVerifyStep] = useState<'main' | 'pin' | 'totp' | 'backup'>('main');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const pinRefs = useRef<Array<TextInput | null>>([]);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const isPinEnabled = settings?.is_pin_enabled;
  const isTotpEnabled = settings?.is_totp_enabled;

  useEffect(() => {
    if (!settingsLoading && settings) {
      if (isPinEnabled && !isTotpEnabled) setVerifyStep('pin');
      else if (!isPinEnabled && isTotpEnabled) setVerifyStep('totp');
    }
  }, [settingsLoading, settings]);

  const verifyTwoStepCode = async (method: 'pin' | 'totp' | 'backup', value: string) => {
    const { data, error } = await supabase.functions.invoke('verify-two-step', {
      body: {
        method,
        code: value,
      },
    });

    if (error) throw error;
    if (!data?.valid) {
      throw new Error('Verification failed');
    }
  };

  const handleVerifyPin = async () => {
    const pinString = pin.join('');
    if (pinString.length !== 6) return;

    setIsVerifying(true);
    try {
      await verifyTwoStepCode('pin', pinString);
      onSuccess();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast({ message: 'Incorrect security PIN', variant: 'error' });
      setPin(['', '', '', '', '', '']);
      pinRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyTOTP = async () => {
    if (code.length !== 6) return;

    setIsVerifying(true);
    try {
      await verifyTwoStepCode('totp', code);
      onSuccess();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast({ message: 'Invalid verification code', variant: 'error' });
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyBackup = async () => {
    const codeFixed = code.trim().toUpperCase();
    if (codeFixed.length < 4) return;

    setIsVerifying(true);
    try {
      await verifyTwoStepCode('backup', codeFixed);
      onSuccess();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast({ message: 'Invalid backup code', variant: 'error' });
    } finally {
      setIsVerifying(false);
    }
  };

  const onSuccess = () => {
    markTwoStepVerified();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast({ message: 'Security verified', variant: 'success' });

    if (profile?.phone_number && profile?.username) {
      router.replace('/(tabs)/chats');
    } else {
      router.replace('/(auth)/phone-setup');
    }
  };

  if (settingsLoading || profileLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="small" color={brandColor} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}>
        <View style={{ paddingTop: insets.top + 40 }} className="px-6">
          {/* Top Bar with Back Button if possible */}
          <View className="mb-8 flex-row items-center">
            {verifyStep !== 'main' && isPinEnabled && isTotpEnabled && (
              <TouchableOpacity
                onPress={() => setVerifyStep('main')}
                className="-ml-2 h-10 w-10 items-center justify-center rounded-full bg-muted/30">
                <ArrowLeft size={20} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            )}
          </View>

          <View className="mb-12 items-center">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-[28px] border border-brand/20 bg-brand/5 shadow-sm">
              <ShieldCheck size={36} color={brandColor} strokeWidth={2.5} />
            </View>
            <Text className="text-center text-3xl font-bold tracking-tight text-foreground">
              Verification
            </Text>
            <Text className="mt-3 px-8 text-center text-[15px] leading-6 text-muted-foreground/80">
              Your account is protected with two-step verification.
            </Text>
          </View>

          {verifyStep === 'main' && (
            <View className="space-y-4">
              {isPinEnabled && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setVerifyStep('pin')}
                  className="flex-row items-center rounded-[28px] border border-border/10 bg-card p-5 shadow-sm">
                  <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
                    <Key size={22} color={brandColor} strokeWidth={2.5} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[17px] font-bold text-foreground">Security PIN</Text>
                    <Text className="text-[13px] text-muted-foreground">
                      Verify using your 6-digit code.
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#71717a" strokeWidth={2.5} />
                </TouchableOpacity>
              )}

              {isTotpEnabled && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setVerifyStep('totp')}
                  className="flex-row items-center rounded-[28px] border border-border/10 bg-card p-5 shadow-sm">
                  <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
                    <Smartphone size={22} color={brandColor} strokeWidth={2.5} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[17px] font-bold text-foreground">Authenticator</Text>
                    <Text className="text-[13px] text-muted-foreground">
                      Get code from your security app.
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#71717a" strokeWidth={2.5} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setVerifyStep('backup')}
                className="mt-6 flex-row items-center justify-center rounded-2xl bg-muted/10 py-5">
                <Text className="font-bold text-muted-foreground">Use Backup Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {verifyStep === 'pin' && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="items-center">
              <Text className="mb-8 text-[15px] font-semibold text-foreground/70">
                Enter your 6-digit PIN
              </Text>
              <View className="mb-10 w-full flex-row justify-between">
                {pin.map((digit, idx) => (
                  <View
                    key={idx}
                    className={`aspect-[2/3] w-[14%] items-center justify-center rounded-2xl border-2 bg-card ${digit ? 'border-brand' : 'border-border/10'}`}>
                    <TextInput
                      ref={(el) => {
                        pinRefs.current[idx] = el;
                      }}
                      className="h-full w-full text-center text-2xl font-bold text-foreground"
                      maxLength={1}
                      keyboardType="number-pad"
                      secureTextEntry
                      value={digit}
                      autoFocus={idx === 0}
                      onChangeText={(text) => {
                        const newPin = [...pin];
                        newPin[idx] = text.slice(-1);
                        setPin(newPin);
                        if (text && idx < 5) pinRefs.current[idx + 1]?.focus();
                      }}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && !pin[idx] && idx > 0)
                          pinRefs.current[idx - 1]?.focus();
                      }}
                    />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleVerifyPin}
                disabled={pin.join('').length !== 6 || isVerifying}
                className={`w-full items-center justify-center rounded-2xl py-4 shadow-lg ${pin.join('').length === 6 ? 'bg-brand' : 'bg-brand/30'}`}>
                {isVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-[15px] font-bold text-white">Verify PIN</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setVerifyStep('backup')} className="mt-8">
                <Text className="font-semibold text-brand">Forgot PIN?</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          )}

          {verifyStep === 'totp' && (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="items-center">
              <Text className="mb-8 text-[15px] font-semibold text-foreground/70">
                Enter Code from Authenticator
              </Text>
              <TextInput
                placeholder="000 000"
                maxLength={6}
                keyboardType="number-pad"
                autoFocus
                className="mb-10 w-full rounded-[28px] border border-border/10 bg-card p-6 text-center text-3xl font-bold tracking-[0.4em] text-foreground"
                value={code}
                onChangeText={setCode}
                placeholderTextColor={isDark ? '#3f3f46' : '#d4d4d8'}
              />

              <TouchableOpacity
                onPress={handleVerifyTOTP}
                disabled={code.length !== 6 || isVerifying}
                className={`w-full items-center justify-center rounded-2xl py-4 shadow-lg ${code.length === 6 ? 'bg-brand' : 'bg-brand/30'}`}>
                {isVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-[15px] font-bold text-white">Verify Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setVerifyStep('backup')} className="mt-8">
                <Text className="font-semibold text-brand">Can't access app?</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          )}

          {verifyStep === 'backup' && (
            <View className="items-center">
              <View className="mb-8 flex-row items-center rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-5">
                <ShieldAlert size={22} color="#f59e0b" strokeWidth={2.5} />
                <Text className="ml-3 flex-1 text-[13.5px] font-bold text-amber-700">
                  Use this if you lost your phone or forgot your PIN.
                </Text>
              </View>

              <TextInput
                placeholder="XXXX-XXXX"
                autoCapitalize="characters"
                autoFocus
                className="mb-10 w-full rounded-[28px] border border-border/10 bg-card p-6 text-center text-2xl font-bold tracking-widest text-foreground"
                value={code}
                onChangeText={setCode}
                placeholderTextColor={isDark ? '#3f3f46' : '#d4d4d8'}
              />

              <TouchableOpacity
                onPress={handleVerifyBackup}
                disabled={code.length < 4 || isVerifying}
                className={`w-full items-center justify-center rounded-2xl py-4 shadow-lg ${code.length >= 4 ? 'bg-brand' : 'bg-brand/30'}`}>
                {isVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-[15px] font-bold text-white">Verify Backup Code</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  isPinEnabled || isTotpEnabled ? setVerifyStep('main') : router.back()
                }
                className="mt-8">
                <Text className="font-bold text-muted-foreground/60">Back to login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
