import { Text } from '@/components/ui/text';
import { View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Smartphone,
  FileText,
  UserMinus,
  UserCheck,
  Trash2,
  ChevronRight,
} from 'lucide-react-native';
import { useStableNavigate } from '@/lib/use-stable-navigate';
import { useColorScheme } from 'nativewind';
import { useThemeStore } from '@/store/theme-store';
import { useUserProfile } from '@/hooks/use-user';
import React from 'react';
import { cn } from '@/lib/utils';
import { SETTINGS_MENU_LIST_CLASS, cnSettingsMenuCard } from '@/lib/settings-ui';

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
        showsVerticalScrollIndicator={false}
      >
        {/* Identity & Data Section */}
        <View className="border-b border-border/5 px-6 py-6" style={{ borderBottomWidth: 1 }}>
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand" style={{ color: brandColor }}>
            Identity & Data
          </Text>
          
          <View className={SETTINGS_MENU_LIST_CLASS}>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={navigateToChangeNumber}
            className={cn(cnSettingsMenuCard(), 'flex-row items-center')}
          >
            <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
              <Smartphone size={18} color={brandColor} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-[16px] font-semibold text-foreground">Change Phone Number</Text>
              <Text className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
                Migrate your account info and groups to a new number.
              </Text>
            </View>
            <ChevronRight size={14} color="#71717a" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={navigateToRequestInfo}
            className={cn(cnSettingsMenuCard(), 'flex-row items-center')}
          >
            <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
              <FileText size={18} color={brandColor} strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-[16px] font-semibold text-foreground">Request Account Info</Text>
              <Text className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
                Get a report of your personal data and settings.
              </Text>
            </View>
            <ChevronRight size={14} color="#71717a" strokeWidth={2} />
          </TouchableOpacity>
          </View>
        </View>

        {/* Exit Options Section */}
        <View className="border-b border-border/5 px-6 py-6" style={{ borderBottomWidth: 1 }}>
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand" style={{ color: brandColor }}>
            Account Control
          </Text>

          <View className={SETTINGS_MENU_LIST_CLASS}>
          {isDeactivated ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={navigateToReactivate}
              className={cn(cnSettingsMenuCard(), 'flex-row items-center')}>
              <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
                <UserCheck size={18} color={brandColor} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-semibold text-foreground">Reactivate Account</Text>
                <Text className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
                  Make your profile visible again to others.
                </Text>
              </View>
              <ChevronRight size={14} color="#71717a" strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={navigateToDeactivate}
              className={cn(cnSettingsMenuCard(), 'flex-row items-center')}>
              <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
                <UserMinus size={18} color={brandColor} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-semibold text-foreground">Deactivate Account</Text>
                <Text className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
                  Temporarily hide your profile and information.
                </Text>
              </View>
              <ChevronRight size={14} color="#71717a" strokeWidth={2} />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={navigateToDelete}
            className={cn(cnSettingsMenuCard(), 'flex-row items-center')}
          >
            <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-destructive/5">
              <Trash2 size={18} color="#ef4444" strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-[16px] font-semibold text-destructive">Delete My Account</Text>
              <Text className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
                Permanently delete all your personal data.
              </Text>
            </View>
            <ChevronRight size={14} color="#ef4444" strokeWidth={2} />
          </TouchableOpacity>
          </View>
        </View>

        {/* Footer Note */}
        <View className="mt-8 px-10">
          <Text className="text-center text-[12px] leading-6 font-medium text-muted-foreground/80">
            Account Management helps you control your data. Deletion is permanent and cannot be undone.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
