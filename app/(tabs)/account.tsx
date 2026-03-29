import { SettingsRow } from '@/components/settings/settings-row';
import { Header } from '@/components/shared/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icon, UserIcon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useUserProfile } from '@/hooks/use-user';
import { Haptic } from '@/lib/haptic-utils';
import {
  buildAccountMenuFromDirectory,
  searchSettingsDirectory,
  type SettingsDirectoryEntry,
} from '@/lib/settings-directory';
import { SettingsGroup } from '@/lib/settings-ui';
import { useStableNavigate } from '@/lib/use-stable-navigate';
import { cn, formatPhoneNumber, maskPhoneNumber } from '@/lib/utils';
import { useAppTheme } from '@/store/theme-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useFocusEffect } from 'expo-router';
import { ChevronRight, Edit2, Search, ShieldAlert } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import appConfig from '../../app.json';

const SUPPORTER_ROLE_ID = 'b32a4589-0543-46aa-8135-23e601f6e1fd';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { brandColor, isDark } = useAppTheme();
  const { data: profile, isLoading } = useUserProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const stableNavigate = useStableNavigate();

  const { username, phone } = useMemo(
    () => ({
      username: profile?.username || 'User',
      phone: maskPhoneNumber(formatPhoneNumber(profile?.phone_number, profile?.country_code)),
    }),
    [profile]
  );

  const { refetch } = useUserProfile();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const menuSections = useMemo(() => buildAccountMenuFromDirectory(), []);

  const isSupporter = profile?.role_id === SUPPORTER_ROLE_ID;

  const sectionsToDisplay = useMemo(() => {
    if (!isSupporter) return menuSections;
    return [
      {
        title: 'Support',
        items: [
          {
            id: 'support-management',
            title: 'Support Requests',
            subtitle: 'Manage incoming help tickets',
            icon: ShieldAlert,
            href: '/support-management' as any,
            destructive: false,
          },
        ],
      },
      ...menuSections,
    ];
  }, [menuSections, isSupporter]);

  const searchResults = useMemo(() => searchSettingsDirectory(searchQuery), [searchQuery]);

  const isSearching = Boolean(searchQuery.trim());

  const subtitleForSearch = (entry: SettingsDirectoryEntry) =>
    entry.searchContext ? `${entry.subtitle} · ${entry.searchContext}` : entry.subtitle;

  // Adaptive Theme Palettes (Matching ChatItem)
  const gradientColors: [string, string, string] = isDark
    ? [brandColor + '08', brandColor + '14', brandColor + '20']
    : [brandColor + '08', brandColor + '15', brandColor + '25'];

  return (
    <Pressable className="flex-1" onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-background">
        <Header title="Account" />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          bounces={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          decelerationRate="normal"
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 140,
            flexGrow: 1,
          }}>
          <View className="px-5 pb-2 pt-5">
            {isLoading ? (
              <ActivityIndicator size="small" color={brandColor} className="py-4" />
            ) : (
              <Link href="/profile-details" asChild>
                <TouchableOpacity activeOpacity={0.8} onPress={() => Haptic.selection()}>
                  <View
                    className={cn(
                      'overflow-hidden rounded-xl border border-brand/20 bg-background shadow-sm'
                    )}>
                    <LinearGradient
                      colors={gradientColors}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      className="flex-row items-center p-4">
                      <View className="relative">
                        <Avatar
                          alt={username}
                          className={cn(
                            'border-bran borderd h-14 w-14 overflow-hidden rounded-full'
                          )}>
                          <AvatarImage
                            source={profile?.avatar_url ? { uri: profile.avatar_url } : undefined}
                            className="size-full"
                          />
                          <AvatarFallback className={isDark ? 'bg-white/5' : 'bg-brand'}>
                            <Icon
                              as={UserIcon}
                              size={32}
                              color={isDark ? 'rgba(255,255,255,0.4)' : 'white'}
                            />
                          </AvatarFallback>
                        </Avatar>
                        <View className="absolute bottom-0 right-0 rounded-full border border-brand/20 bg-brand p-1 shadow-sm">
                          <Edit2 size={8} color={isDark ? brandColor : 'white'} strokeWidth={3} />
                        </View>
                      </View>
                      <View className="ml-3.5 flex-1">
                        <Text className="font-semibol text-[17px] text-foreground">{username}</Text>
                        <Text className="mt-0.5 text-[12px] font-semibold text-foreground">
                          {phone || 'Complete your profile'}
                        </Text>
                      </View>
                      <ChevronRight size={14} color={brandColor} strokeWidth={3} />
                    </LinearGradient>
                  </View>
                </TouchableOpacity>
              </Link>
            )}
          </View>

          {/* Moved Search Bar - Now below Profile Card */}
          <View className="px-5 pb-3 pt-1">
            <View className="relative">
              <View className="absolute left-3 z-10 h-full items-center justify-center">
                <Icon as={Search} size={16} color={brandColor} />
              </View>
              <Input
                className="h-12 rounded-xl border-none !bg-transparent pl-10 text-base"
                placeholder="Search Settings..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                placeholderTextColor="#a1a1aa"
                cursorColor={brandColor}
                selectionColor={brandColor + '40'}
              />
            </View>
          </View>

          <View className="mt-2">
            {isSearching ? (
              <View className="mb-4">
                <Text className="font-semibol px-5 py-2 text-[10px] uppercase tracking-wider text-brand">
                  Results
                </Text>
                <View className="px-5">
                  <SettingsGroup>
                    {searchResults.map((item: SettingsDirectoryEntry) => (
                      <SettingsRow
                        key={item.id}
                        icon={item.icon}
                        title={item.title}
                        subtitle={subtitleForSearch(item)}
                        onPress={() => item.href && stableNavigate(item.href)}
                        destructive={item.destructive}
                        isGrouped={true}
                      />
                    ))}
                  </SettingsGroup>
                  {searchResults.length === 0 && (
                    <View className="items-center justify-center px-10 pt-20">
                      <Text className="font-semibol text-muted-foreground">No results found</Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              sectionsToDisplay.map((section) => (
                <View key={section.title} className="mb-4">
                  <Text className="font-semibol px-5 py-2 text-[10px] uppercase tracking-wider text-brand">
                    {section.title}
                  </Text>
                  <View className="px-5">
                    <SettingsGroup>
                      {section.items.map((item) => (
                        <SettingsRow
                          key={item.id}
                          icon={item.icon}
                          title={item.title}
                          subtitle={item.subtitle}
                          onPress={() => item.href && stableNavigate(item.href)}
                          destructive={item.destructive}
                          isGrouped={true}
                        />
                      ))}
                    </SettingsGroup>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Dynamic Footer */}
          {!isSearching && (
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
          )}
        </ScrollView>
      </View>
    </Pressable>
  );
}
