import { SettingsRow } from '@/components/settings/settings-row';
import { Text } from '@/components/ui/text';
import { useUserProfile } from '@/hooks/use-user';
import { SettingsGroup, cnSettingsMenuItem } from '@/lib/settings-ui';
import { useStableNavigate } from '@/lib/use-stable-navigate';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/store/theme-store';
import { useThemeStore } from '@/store/theme-store';
import {
  Smartphone,
  FileText,
  UserCheck,
  UserMinus,
  Trash2,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountManagementScreen() {
  const insets = useSafeAreaInsets();
  const stableNavigate = useStableNavigate();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { data: profile, isLoading } = useUserProfile();
  const isDeactivated = profile?.is_deactivated === true;
  const brandColor = useThemeStore((state) => state.accentColor);

  const navigateToChangeNumber = () => stableNavigate('/account-center/change-number');
  const navigateToRequestInfo = () => stableNavigate('/account-center/request-info');
  const navigateToDeactivate = () => stableNavigate('/account-center/deactivate');
  const navigateToReactivate = () => stableNavigate('/account-center/reactivate');
  const navigateToDelete = () => stableNavigate('/account-center/delete');

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="small" color={brandColor} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Identity & Data Section */}
        <View className="border-b border-border/5 px-6 py-6" style={{ borderBottomWidth: 1 }}>
          <Text
            className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand"
            style={{ color: brandColor }}>
            Identity & Data
          </Text>

          <SettingsGroup>
            <SettingsRow
              icon={Smartphone}
              title="Change Phone Number"
              subtitle="Migrate your account info and groups to a new number."
              onPress={navigateToChangeNumber}
            />

            <SettingsRow
              icon={FileText}
              title="Request Account Info"
              subtitle="Get a report of your personal data and settings."
              onPress={navigateToRequestInfo}
            />
          </SettingsGroup>
        </View>

        {/* Exit Options Section */}
        <View className="border-b border-border/5 px-6 py-6" style={{ borderBottomWidth: 1 }}>
          <Text
            className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand"
            style={{ color: brandColor }}>
            Account Control
          </Text>

          <SettingsGroup>
            {isDeactivated ? (
              <SettingsRow
                icon={UserCheck}
                title="Reactivate Account"
                subtitle="Make your profile visible again to others."
                onPress={navigateToReactivate}
              />
            ) : (
              <SettingsRow
                icon={UserMinus}
                title="Deactivate Account"
                subtitle="Temporarily hide your profile and information."
                onPress={navigateToDeactivate}
              />
            )}

            <SettingsRow
              icon={Trash2}
              title="Delete My Account"
              subtitle="Permanently delete all your personal data."
              onPress={navigateToDelete}
              destructive={true}
            />
          </SettingsGroup>
        </View>

        {/* Footer Note */}
        <View className="mt-8 px-10">
          <Text className="text-center text-[12px] font-medium leading-6 text-muted-foreground/80">
            Account Management helps you control your data. Deletion is permanent and cannot be
            undone.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
