import { Text } from '@/components/ui/text';
import { View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, Bell, Smartphone, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSecuritySettings, useUpdateSecuritySettings } from '@/hooks/use-user';
import { getAppLockEnabled, setAppLockEnabled as setStoredAppLockEnabled } from '@/lib/app-lock';

import { useThemeStore } from '@/store/theme-store';

export default function SecuritySettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const brandColor = useThemeStore((state) => state.accentColor);

  // ─── Supabase State (Security Alerts) ───────────────────
  const { data: dbSettings, isLoading } = useSecuritySettings();
  const updateSettings = useUpdateSecuritySettings();

  // ─── Local State (App Lock) ─────────────────────────────
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  useEffect(() => {
    // Check if device supports Biometrics (FaceID/Fingerprint)
    const checkBiometrics = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(compatible && enrolled);

      const enabled = await getAppLockEnabled();
      setAppLockEnabled(enabled);
    };
    checkBiometrics();
  }, []);

  const handleToggleAppLock = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (value) {
      // Trying to enable it - Ask for biometric verification first
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable App Lock',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        setAppLockEnabled(true);
        await setStoredAppLockEnabled(true);
      }
    } else {
      // Trying to disable it - Ask for biometric verification first
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to disable App Lock',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        setAppLockEnabled(false);
        await setStoredAppLockEnabled(false);
      }
    }
  };

  const handleToggleSecurityAlerts = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateSettings.mutateAsync({ security_alerts: value });
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {/* Local Security Section */}
        <View className="mb-2 border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            Device Security
          </Text>

          {hasBiometrics ? (
            <View className="flex-row items-center justify-between py-3">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleToggleAppLock(!appLockEnabled)}
                className="mr-4 flex-1 flex-row items-center">
                <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
                  <Smartphone size={18} color={brandColor} strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-semibold text-foreground">App Lock</Text>
                  <Text className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
                    Require Touch ID or Face ID to unlock the app when you open it.
                  </Text>
                </View>
              </TouchableOpacity>
              <Switch checked={appLockEnabled} onCheckedChange={handleToggleAppLock} />
            </View>
          ) : (
            <View className="py-3">
              <Text className="text-[14px] text-muted-foreground">
                Biometrics (FaceID / TouchID) are not configured or available on this device.
              </Text>
            </View>
          )}
        </View>

        {/* Account Security Section */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            Account Protection
          </Text>

          <View className="flex-row items-center justify-between border-b border-border/5 py-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleToggleSecurityAlerts(!(dbSettings?.security_alerts ?? true))}
              className="mr-4 flex-1 flex-row items-center">
              <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
                <Bell size={18} color={brandColor} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-semibold text-foreground">Security Alerts</Text>
                <Text className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
                  Get notified when a contact's security code has changed.
                </Text>
              </View>
            </TouchableOpacity>
            <Switch
              checked={dbSettings?.security_alerts ?? true}
              onCheckedChange={handleToggleSecurityAlerts}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.6}
            className="flex-row items-center py-5"
            onPress={() => router.push('/(settings)/two-step-verification')}>
            <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
              <Lock size={18} color={brandColor} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-[16px] font-semibold text-foreground">
                Two-Step Verification
              </Text>
              <Text className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
                {dbSettings?.two_step_verification
                  ? 'Active'
                  : 'Add an extra layer of protection to your account.'}
              </Text>
            </View>
            <ChevronRight size={18} color="#71717a" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Security Footer Note */}
        <View className="mt-8 px-10">
          <Text className="text-center text-[11.5px] leading-5 text-muted-foreground/60">
            Security settings help keep your account and privacy protected.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
