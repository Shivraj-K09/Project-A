import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image as ExpoImage } from 'expo-image';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';
import {
  useUpdateProfile,
  useUpdateProfileDetails,
  useUserProfile,
  useUserProfileDetails,
} from '@/hooks/use-user';
import { supabase } from '@/lib/supabase';
import { formatPhoneNumber } from '@/lib/utils';
import { decode } from 'base64-arraybuffer';
import dayjs from 'dayjs';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import {
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react-native';
import { useThemeStore, useAppTheme } from '@/store/theme-store';
import { useEffect, useMemo, useRef, useState } from 'react';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut, Easing } from 'react-native-reanimated';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from 'react-native-ui-datepicker';
import { BlurView } from 'expo-blur';

const getDatePickerStyles = (isDark: boolean, brandColor: string) => ({
  day_label: { color: isDark ? '#e4e4e7' : '#18181b' },
  month_selector_label: { color: isDark ? '#e4e4e7' : '#18181b', fontWeight: '600' as const },
  year_selector_label: { color: isDark ? '#e4e4e7' : '#18181b', fontWeight: '600' as const },
  weekday_label: { color: isDark ? '#71717a' : '#52525b' },
  selected: { backgroundColor: brandColor, borderRadius: 100 },
  selected_label: { color: '#ffffff' },
  today: { borderColor: brandColor, borderWidth: 1, borderRadius: 100 },
  today_label: { color: brandColor, fontWeight: '600' as const },
  month_label: { color: isDark ? '#e4e4e7' : '#18181b' },
  year_label: { color: isDark ? '#e4e4e7' : '#18181b' },
  selected_month_label: { color: '#ffffff' },
  selected_year_label: { color: '#ffffff' },
});

interface ProfileRowProps {
  icon: any;
  title: string;
  value: string | null | undefined;
  editable?: boolean;
  onSave?: (newVal: string) => void;
  placeholder?: string;
  type?: 'text' | 'date';
  isLast?: boolean;
  isSensitive?: boolean;
}

function ProfileEditableRow({
  icon: Icon,
  title,
  value,
  editable = true,
  onSave,
  placeholder = 'Not set',
  type = 'text',
  isLast = false,
  isSensitive = false,
}: ProfileRowProps) {
  const { brandColor, isDark } = useAppTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isVisible, setIsVisible] = useState(!isSensitive);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value, isEditing]);

  const handleSave = () => {
    if (localValue !== (value || '') && onSave) onSave(localValue);
    if (isMounted.current) setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value || '');
    if (isMounted.current) setIsEditing(false);
  };

  const openEditor = () => {
    if (!editable) return;
    setIsEditing(true);
    if (type === 'date') setShowDatePicker(true);
  };

  const pickerStyles = useMemo(() => getDatePickerStyles(isDark, brandColor), [isDark, brandColor]);

  return (
    <View className={`w-full ${!isLast ? 'border-b border-border/5' : ''}`}>
      {!isEditing ? (
        <TouchableOpacity
          activeOpacity={editable ? 0.6 : 1}
          onPress={openEditor}
          className="flex-row items-center px-3 py-4">
          <View className="mr-4 w-8 items-center">
            <Icon size={18} color={brandColor} strokeWidth={2} />
          </View>

          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {title}
                </Text>
                <Text className="text-[16px] font-semibold text-foreground">
                  {!isVisible ? '••••••••••••' : localValue || placeholder}
                </Text>
              </View>

              {isSensitive && (
                <TouchableOpacity
                  onPress={() => setIsVisible(!isVisible)}
                  className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-brand/10"
                  activeOpacity={0.7}>
                  {isVisible ? (
                    <EyeOff size={16} color={brandColor} strokeWidth={2} />
                  ) : (
                    <Eye size={16} color={brandColor} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              )}

              {editable && (
                <ChevronRight size={14} color={isDark ? '#27272a' : '#e5e5e5'} strokeWidth={2} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <View className="flex-row items-start px-3 py-4">
          <View className="mr-4 w-8 items-center pt-1">
            <Icon size={18} color={brandColor} strokeWidth={2} />
          </View>

          <View className="flex-1">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-brand">
                  {title}
                </Text>

                {type === 'text' && (
                  <TextInput
                    className="m-0 p-0 text-[16px] font-semibold text-foreground"
                    style={{
                      color: isDark ? '#ffffff' : '#0a0a0a',
                      minHeight: title === 'Bio' ? 80 : 24,
                      textAlignVertical: 'top',
                    }}
                    value={localValue}
                    onChangeText={setLocalValue}
                    placeholder={placeholder}
                    placeholderTextColor={isDark ? '#27272a' : '#d4d4d8'}
                    autoFocus
                    multiline={title === 'Bio'}
                    numberOfLines={title === 'Bio' ? 4 : 1}
                    returnKeyType={title === 'Bio' ? 'default' : 'done'}
                    onSubmitEditing={title === 'Bio' ? undefined : handleSave}
                    cursorColor={brandColor}
                    onBlur={handleSave}
                  />
                )}
              </View>

              <View className="ml-2 flex-row gap-3 pt-0.5">
                <TouchableOpacity onPress={handleCancel} hitSlop={10}>
                  <X size={18} color={isDark ? '#71717a' : '#a1a1aa'} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} hitSlop={10}>
                  <Check size={18} color={brandColor} strokeWidth={3} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowDatePicker(false);
          setIsEditing(false);
        }}>
        <TouchableWithoutFeedback
          onPress={() => {
            setShowDatePicker(false);
            setIsEditing(false);
          }}>
          <View className="flex-1 justify-end bg-black/40">
            <TouchableWithoutFeedback>
              <View className="rounded-t-[32px] bg-background p-6 pb-10 shadow-2xl">
                <View className="mb-6 h-1 w-12 self-center rounded-full bg-muted" />
                <Text className="mb-6 text-center text-lg font-semibold">Select {title}</Text>
                <DateTimePicker
                  mode="single"
                  date={localValue ? dayjs(localValue).toDate() : dayjs().toDate()}
                  maxDate={dayjs().toDate()}
                  onChange={(params) => {
                    if (params.date) {
                      const formattedDate = dayjs(params.date).format('YYYY-MM-DD');
                      setLocalValue(formattedDate);
                      if (formattedDate !== (value || '') && onSave) onSave(formattedDate);
                    }
                    if (isMounted.current) {
                      setShowDatePicker(false);
                      setIsEditing(false);
                    }
                  }}
                  styles={pickerStyles}
                />
                <TouchableOpacity
                  className="mt-6 w-full items-center rounded-2xl bg-brand py-4 shadow-lg"
                  onPress={() => {
                    setShowDatePicker(false);
                    setIsEditing(false);
                  }}>
                  <Text className="text-base font-semibold text-white">Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

export default function ProfileDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { brandColor, isDark } = useAppTheme();
  const { toast } = useToast();

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: details, isLoading: detailsLoading } = useUserProfileDetails();

  const { mutate: updateProfile } = useUpdateProfile();
  const { mutate: updateDetails } = useUpdateProfileDetails();

  const [isUploading, setIsUploading] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const isLoading = profileLoading || detailsLoading;
  const username = profile?.username || 'User';
  const initial = username.charAt(0).toUpperCase();

  const formattedPhone = useMemo(() => {
    return formatPhoneNumber(profile?.phone_number, profile?.country_code);
  }, [profile]);

  const handleUpdateProfile = (data: any) => {
    updateProfile(data, {
      onSuccess: () => toast({ message: 'Saved successfully', variant: 'success' }),
      onError: (err: any) => toast({ message: err?.message || 'Update failed', variant: 'error' }),
    });
  };

  const handleUpdateDetails = (data: any) => {
    updateDetails(data, {
      onSuccess: () => toast({ message: 'Details updated', variant: 'success' }),
      onError: (err: any) => toast({ message: err?.message || 'Update failed', variant: 'error' }),
    });
  };

  const handleImagePick = async () => {
    try {
      if (!user?.id) {
        toast({ message: 'User session not found', variant: 'error' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets[0].base64) return;

      if (isMounted.current) setIsUploading(true);
      const file = result.assets[0];
      const filePath = `${user.id}/avatar-${Date.now()}.png`;

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(file.base64!), {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      updateProfile(
        { avatar_url: publicUrl },
        {
          onSuccess: () => toast({ message: 'Avatar updated', variant: 'success' }),
          onError: (err: any) =>
            toast({ message: err?.message || 'Avatar sync failed', variant: 'error' }),
        }
      );
    } catch (error: any) {
      toast({ message: error?.message || 'Upload failed', variant: 'error' });
    } finally {
      if (isMounted.current) setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="small" color={brandColor} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

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
              disabled={isUploading}
              activeOpacity={0.8}
              className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-4 border-background bg-brand shadow-lg">
              <Camera size={14} color="white" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View className="mt-3 items-center">
            <Text className="text-2xl font-semibold tracking-tight text-foreground">
              {profile?.username}
            </Text>
          </View>
        </View>

        {/* Form Sections */}
        <View className="space-y-4">
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

        {/* ─── Footer Section ────────────────────────── */}
        <View className="mt-10 items-center">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={signOut}
            className="w-full flex-row items-center justify-center rounded-2xl border border-destructive bg-destructive py-4 shadow-sm">
            <LogOut size={18} color="white" strokeWidth={2.5} />
            <Text className="ml-3 text-base font-bold text-white">Sign Out</Text>
          </TouchableOpacity>

          <View className="mt-10 items-center justify-center">
            <View className="mb-3 flex-row items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.05] px-4 py-2">
              <ShieldCheck size={12} color={brandColor} strokeWidth={2.5} />
              <Text className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                End-to-end encrypted
              </Text>
            </View>
          </View>

          <Text className="text-[11px] font-bold text-muted-foreground">
            Version 1.0.0 (Development Build)
          </Text>
        </View>
      </ScrollView>

      {/* ─── Image Viewer Modal ───────────────────────── */}
      <Modal
        visible={showViewer}
        transparent={true}
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setShowViewer(false)}>
        <View className="flex-1">
          {/* Custom Backdrop Animation to prevent flashing */}
          <TouchableWithoutFeedback onPress={() => setShowViewer(false)}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="absolute inset-0 bg-black/90"
            />
          </TouchableWithoutFeedback>

          <View className="flex-1 items-center justify-center">
            <Animated.View
              entering={ZoomIn.duration(250).easing(Easing.out(Easing.quad))}
              exiting={ZoomOut.duration(200).easing(Easing.in(Easing.quad))}
              className="aspect-square w-full px-4">
              {profile?.avatar_url ? (
                <ExpoImage
                  source={{ uri: profile.avatar_url }}
                  style={{ width: '100%', height: '100%', borderRadius: 24 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : null}
            </Animated.View>

            {/* Premium Header Overlay */}
            <Animated.View
              entering={FadeIn.delay(100).duration(300)}
              exiting={FadeOut.duration(200)}
              style={{ top: insets.top + 10 }}
              className="absolute left-0 right-0 flex-row items-center justify-between px-6">
              <TouchableOpacity
                onPress={() => setShowViewer(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <X size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-base font-bold text-white shadow-sm">Profile Photo</Text>
              <View className="w-10" />
            </Animated.View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
