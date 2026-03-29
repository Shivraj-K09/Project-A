import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useSecuritySettings, useUpdateSecuritySettings } from '@/hooks/use-user';
import { getAppLockEnabled, setAppLockEnabled as setStoredAppLockEnabled } from '@/lib/app-lock';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { Bell, Smartphone } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsGroup, cnSettingsMenuItem } from '@/lib/settings-ui';
import { cn } from '@/lib/utils';
import { useAppTheme, useThemeStore } from '@/store/theme-store';

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
  const [hasBiometrics, setHasBiometrics] = useState<'none' | 'available' | 'not-enrolled' | null>(
    null
  );

  useEffect(() => {
    // Check if device supports Biometrics (FaceID/Fingerprint)
    const checkBiometrics = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible) {
        setHasBiometrics('none');
      } else if (!enrolled) {
        setHasBiometrics('not-enrolled');
      } else {
        setHasBiometrics('available');
      }

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
        {/* Local Security Section (Biometrics) */}
        {hasBiometrics !== 'none' && (
          <View className="mb-2 border-b border-border/5 px-6 py-6">
            <Text className="font-semibol mb-4 text-[12px] uppercase tracking-wider text-brand">
              Device Security
            </Text>

            <SettingsGroup>
              {hasBiometrics === 'available' ? (
                <SettingsRow
                  icon={Smartphone}
                  title="App Lock"
                  subtitle="Require Touch ID or Face ID to unlock the app when you open it."
                  onPress={() => handleToggleAppLock(!appLockEnabled)}
                  rightContent={
                    <Switch checked={appLockEnabled} onCheckedChange={handleToggleAppLock} />
                  }
                />
              ) : (
                <View className="px-5 py-4">
                  <Text className="text-[14px] leading-6 text-muted-foreground">
                    Your device supports biometrics, but none are enrolled. Please set up a
                    fingerprint or face scan in your phone settings to use App Lock.
                  </Text>
                </View>
              )}
            </SettingsGroup>
          </View>
        )}

        {/* Account Security Section */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="font-semibol mb-4 text-[12px] uppercase tracking-wider text-brand">
            Account Protection
          </Text>

          <SettingsGroup>
            <SettingsRow
              icon={Bell}
              title="Security Alerts"
              subtitle="Get notified when a contact's security code has changed."
              onPress={() => handleToggleSecurityAlerts(!(dbSettings?.security_alerts ?? true))}
              rightContent={
                <Switch
                  checked={dbSettings?.security_alerts ?? true}
                  onCheckedChange={handleToggleSecurityAlerts}
                />
              }
            />
          </SettingsGroup>
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
