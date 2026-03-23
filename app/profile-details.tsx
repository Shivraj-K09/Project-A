import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { ProfileEditableRow } from '@/components/profile/profile-editable-row';
import { ImageViewerModal } from '@/components/profile/image-viewer-modal';
import { formatPhoneNumber } from '@/lib/utils';
import { useAppTheme } from '@/store/theme-store';
import { Stack } from 'expo-router';
import {
  Calendar,
  Camera,
  ChevronLeft,
  Info,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react-native';
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
import { useProfileDetails } from '@/hooks/user/profile-details';

export default function ProfileDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { brandColor, isDark } = useAppTheme();

  const {
    router,
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

  // Guard against unauthenticated render
  if ((isLoading || !isAuthenticated) && !isSigningOut) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="small" color={brandColor} />
      </View>
    );
  }

  const username = profile?.username || 'User';
  const initial = username.charAt(0).toUpperCase();
  const formattedPhone = profile?.phone_number
    ? formatPhoneNumber(profile.phone_number, profile.country_code)
    : 'Not set';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 20) }}
        className="border-b border-border/5 bg-background shadow-sm">
        <View className="h-16 flex-row items-center justify-between px-6">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="-ml-2 h-10 w-10 items-center justify-center rounded-full">
              <ChevronLeft size={24} color={isDark ? '#e4e4e7' : '#18181b'} strokeWidth={2} />
            </TouchableOpacity>
            <Text className="ml-2 text-xl font-bold tracking-tight text-foreground">
              Account Details
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View className="items-center pb-8 pt-8">
          <View className="relative">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => profile?.avatar_url && setShowViewer(true)}
              className="h-28 w-28 items-center justify-center rounded-full border border-brand/20 p-1">
              <Avatar alt={username} className="h-full w-full rounded-full bg-muted shadow-sm">
                <AvatarImage
                  source={{ uri: profile?.avatar_url || '' }}
                  className="h-full w-full rounded-full"
                />
                <AvatarFallback className="flex h-full w-full items-center justify-center bg-brand">
                  <Text className="text-3xl font-bold text-white">{initial}</Text>
                </AvatarFallback>
              </Avatar>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleImagePick}
              disabled={isUploading || isUpdatingProfile}
              activeOpacity={0.8}
              className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-4 border-background bg-brand shadow-lg">
              {isUploading || isUpdatingProfile ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Camera size={14} color="white" strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>

          <View className="mt-3 items-center">
            <Text className="text-2xl font-semibold tracking-tight text-foreground">
              {profile?.username}
            </Text>
          </View>
        </View>

        {/* Form Sections */}
        <View className="gap-4">
          <View className="overflow-hidden rounded-3xl border border-border/10 bg-card shadow-sm">
            <View className="px-3 pt-4">
              <Text className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Account Information
              </Text>
            </View>
            <View className="pb-2">
              <ProfileEditableRow
                icon={UserIcon}
                title="Full Name"
                value={profile?.username}
                onSave={(val) => handleUpdateProfile({ username: val })}
              />
              <ProfileEditableRow
                icon={Mail}
                title="Email"
                value={profile?.email}
                editable={false}
                isSensitive
              />
              <ProfileEditableRow
                icon={Phone}
                title="Mobile"
                value={formattedPhone}
                editable={false}
                isSensitive
                isLast
              />
            </View>
          </View>

          <View className="overflow-hidden rounded-3xl border border-border/10 bg-card shadow-sm">
            <View className="px-3 pt-4">
              <Text className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                About You
              </Text>
            </View>
            <View className="pb-2">
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
                placeholder="Tell us about yourself..."
                onSave={(val) => handleUpdateDetails({ about: val })}
                isLast
              />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="mt-10 items-center">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSignOut}
            disabled={isSigningOut}
            className="w-full flex-row items-center justify-center rounded-2xl border border-destructive bg-destructive py-4 shadow-sm">
            {isSigningOut ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="ml-3 text-base font-bold text-white">Signing Out...</Text>
              </View>
            ) : (
              <>
                <LogOut size={18} color="white" strokeWidth={2.5} />
                <Text className="ml-3 text-base font-bold text-white">Sign Out</Text>
              </>
            )}
          </TouchableOpacity>

          <View className="mt-10 items-center justify-center">
            <View className="mb-3 flex-row items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.05] px-4 py-2">
              <ShieldCheck size={12} color={brandColor} strokeWidth={2.5} />
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                End-to-end encrypted
              </Text>
            </View>
          </View>
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
