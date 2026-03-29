import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { ProfileEditableRow } from '@/components/profile/profile-editable-row';
import { ImageViewerModal } from '@/components/profile/image-viewer-modal';
import { formatPhoneNumber } from '@/lib/utils';
import { useAppTheme } from '@/store/theme-store';
import { Stack, useRouter } from 'expo-router';
import {
  Calendar,
  Camera,
  ChevronLeft,
  Info,
  LogOut,
  Mail,
  Phone,
  User as LucideUserIcon,
} from 'lucide-react-native';
import { Icon, UserIcon } from '@/components/ui/icon';
import { Haptic } from '@/lib/haptic-utils';
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsGroup } from '@/lib/settings-ui';
import appConfig from '../app.json';
import { useProfileDetails } from '@/hooks/user/profile-details';
import { Header } from '@/components/shared/header';

export default function ProfileDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { brandColor, isDark } = useAppTheme();
  const router = useRouter();

  const {
    profile,
    details,
    isLoading,
    isAuthenticated,
    isUpdatingProfile,
    isUploading,
    isSigningOut,
    showViewer,
    setShowViewer,
    handleSignOut,
    handleUpdateProfile,
    handleUpdateDetails,
    handleImagePick,
  } = useProfileDetails();

  if ((isLoading || !isAuthenticated) && !isSigningOut) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="small" color={brandColor} />
      </View>
    );
  }

  const username = profile?.username || 'User';
  const formattedPhone = profile?.phone_number
    ? formatPhoneNumber(profile.phone_number, profile.country_code)
    : 'Not set';

  const SectionHeader = ({ title }: { title: string }) => (
    <Text className="font-semibol px-5 py-2 text-[10px] uppercase tracking-wider text-brand">
      {title}
    </Text>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <Header title="Profile Details" showBackButton />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}>
        {/* REFINED COMPACT HERO (RESOLVED NESTING ISSUE) */}
        <View className="items-center px-6 py-10">
          <View className="relative h-24 w-24 items-center justify-center">
            {/* MAIN AVATAR TOUCHABLE */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => profile?.avatar_url && setShowViewer(true)}
              className="h-24 w-24 items-center justify-center rounded-full border border-border/10 bg-card p-1 shadow-sm">
              <Avatar alt={username} className="h-full w-full rounded-full">
                <AvatarImage
                  source={profile?.avatar_url ? { uri: profile.avatar_url } : undefined}
                  className="size-full"
                />
                <AvatarFallback className="flex h-full w-full items-center justify-center bg-brand">
                  <Icon as={UserIcon} size={48} color="white" />
                </AvatarFallback>
              </Avatar>
            </TouchableOpacity>

            {/* CAMERA ACTION (SIBLING, NOT NESTED) */}
            <TouchableOpacity
              onPress={handleImagePick}
              disabled={isUploading || isUpdatingProfile}
              className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-4 border-background bg-brand shadow-sm"
              activeOpacity={0.8}>
              {isUploading || isUpdatingProfile ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Camera size={12} color="white" strokeWidth={3} />
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-4 items-center">
            <Text
              className="font-semibol text-2xl tracking-tight text-foreground"
              numberOfLines={1}>
              {username}
            </Text>
            {/* Email display removed for privacy as requested */}
          </View>
        </View>

        <View className="mt-2 px-5">
          <SectionHeader title="Account Information" />
          <SettingsGroup>
            <ProfileEditableRow
              icon={LucideUserIcon}
              title="Username"
              value={username}
              onSave={(val) => handleUpdateProfile({ username: val })}
            />
            <ProfileEditableRow
              icon={Mail}
              title="Primary Email"
              value={profile?.email}
              editable={false}
              isSensitive={true}
            />
            <ProfileEditableRow
              icon={Phone}
              title="Mobile Phone"
              value={formattedPhone}
              editable={false}
              isSensitive={true}
            />
          </SettingsGroup>
        </View>

        <View className="mt-4 px-5">
          <SectionHeader title="Personal Details" />
          <SettingsGroup>
            <ProfileEditableRow
              icon={Calendar}
              title="Birth Date"
              value={details?.birthdate}
              placeholder="Not set"
              type="date"
              onSave={(val) => handleUpdateDetails({ birthdate: val })}
            />
            <ProfileEditableRow
              icon={Info}
              title="Bio"
              value={details?.about}
              placeholder="Share a short bio..."
              onSave={(val) => handleUpdateDetails({ about: val })}
            />
          </SettingsGroup>
        </View>

        {/* STANDALONE ACTION */}
        <View className="mt-8 px-5">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSignOut}
            disabled={isSigningOut}
            className="h-15 w-full flex-row items-center justify-center rounded-xl border border-destructive/10 bg-destructive/5 py-4">
            {isSigningOut ? (
              <ActivityIndicator color="#ef4444" size="small" />
            ) : (
              <View className="flex-row items-center gap-2">
                <LogOut size={16} color="#ef4444" strokeWidth={2.5} />
                <Text className="font-semibol text-base text-destructive">Sign Out Account</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View className="mb-10 mt-12 items-center justify-center">
          <View className="mb-2 flex-row items-center gap-1.5 opacity-45">
            <View className="h-[1px] w-4 bg-muted-foreground" />
            <Text className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              {appConfig.expo.name}
            </Text>
            <View className="h-[1px] w-4 bg-muted-foreground" />
          </View>
          <Text className="font-semibol text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60">
            Release v{appConfig.expo.version}
          </Text>
        </View>
      </ScrollView>

      <ImageViewerModal
        visible={showViewer}
        onClose={() => setShowViewer(false)}
        imageUrl={profile?.avatar_url || null}
      />
    </KeyboardAvoidingView>
  );
}
