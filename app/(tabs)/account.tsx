import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { useUserProfile } from '@/hooks/use-user';
import { Link, type Href } from 'expo-router';
import {
  ActivityIndicator,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Input } from '@/components/ui/input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatPhoneNumber, cn } from '@/lib/utils';
import { useMemo, useState, memo } from 'react';
import { useStableNavigate } from '@/lib/use-stable-navigate';
import {
  buildAccountMenuFromDirectory,
  searchSettingsDirectory,
  type SettingsDirectoryEntry,
} from '@/lib/settings-directory';
import { ChevronRight, Search, Edit2 } from 'lucide-react-native';
import { useAppTheme } from '@/store/theme-store';

interface MenuRowProps {
  icon: any;
  title: string;
  subtitle: string;
  href?: Href;
  destructive?: boolean;
  onNavigate: (href: Href) => void;
}

const MenuRow = memo(
  ({ icon: Icon, title, subtitle, href, destructive, onNavigate }: MenuRowProps) => {
    const { brandColor, isDark } = useAppTheme();

    return (
      <View className="px-5">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => href && onNavigate(href)}
          className={cn(
            'flex-row items-center rounded-xl border border-border bg-background px-5 py-5'
          )}>
          <View
            className={cn(
              'mr-3.5 h-9 w-9 items-center justify-center rounded-lg',
              destructive ? 'bg-destructive/10' : 'bg-brand/5'
            )}>
            <Icon size={18} color={destructive ? '#ef4444' : brandColor} strokeWidth={2} />
          </View>

          <View className="flex-1">
            <Text
              className={cn(
                'text-[15px] font-semibold',
                destructive ? 'text-destructive' : 'text-foreground'
              )}>
              {title}
            </Text>
            <Text className="mt-0.5 text-[11px] font-medium text-muted-foreground">{subtitle}</Text>
          </View>

          {!destructive && <ChevronRight size={14} color={isDark ? '#27272a' : '#d4d4d8'} />}
        </TouchableOpacity>
      </View>
    );
  }
);

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { brandColor, isDark } = useAppTheme();
  const { data: profile, isLoading } = useUserProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const stableNavigate = useStableNavigate();

  const { username, initial, phone } = useMemo(
    () => ({
      username: profile?.username || 'User',
      initial: (profile?.username || 'U').charAt(0).toUpperCase(),
      phone: formatPhoneNumber(profile?.phone_number, profile?.country_code),
    }),
    [profile]
  );

  const menuSections = useMemo(() => buildAccountMenuFromDirectory(), []);

  const searchResults = useMemo(() => searchSettingsDirectory(searchQuery), [searchQuery]);

  const isSearching = Boolean(searchQuery.trim());

  const subtitleForSearch = (entry: SettingsDirectoryEntry) =>
    entry.searchContext ? `${entry.subtitle} · ${entry.searchContext}` : entry.subtitle;

  return (
    <View className="flex-1 bg-background">
      {/* Header - Fixed height to prevent jitter */}
      <View
        style={{ paddingTop: Math.max(insets.top, 20) }}
        className="z-20 border-b border-brand/20 bg-background">
        <View className="px-6 py-4">
          <Text className="text-2xl font-bold tracking-tight text-foreground">
            <Text className="text-2xl font-bold text-brand">A</Text>ccount
          </Text>
        </View>
      </View>

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
          paddingBottom: insets.bottom + 40,
          flexGrow: 1,
        }}>
        <View className="px-5 pb-2 pt-5">
          {isLoading ? (
            <ActivityIndicator size="small" color={brandColor} className="py-4" />
          ) : (
            <Link href="/profile-details" asChild>
              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-row items-center rounded-xl border border-border bg-brand/15 p-4">
                <View className="relative">
                  <Avatar
                    alt={username}
                    className="h-14 w-14 overflow-hidden rounded-full border border-border/10">
                    <AvatarImage
                      source={{ uri: profile?.avatar_url || '' }}
                      className="size-full"
                    />
                    <AvatarFallback className="flex h-full w-full items-center justify-center bg-brand">
                      <Text className="text-lg font-bold text-white">{initial}</Text>
                    </AvatarFallback>
                  </Avatar>
                  <View className="absolute bottom-0 right-0 rounded-full border border-background bg-brand p-1 shadow-sm">
                    <Edit2 size={8} color="#ffffff" strokeWidth={3} />
                  </View>
                </View>
                <View className="ml-3.5 flex-1">
                  <Text className="text-[17px] font-bold text-foreground">{username}</Text>
                  <Text className="mt-0.5 text-[12px] font-semibold text-muted-foreground">
                    {phone || 'Complete your profile'}
                  </Text>
                </View>
                <ChevronRight size={14} color={brandColor} className="opacity-40" />
              </TouchableOpacity>
            </Link>
          )}
        </View>

        <View className="px-5 pb-3 pt-2">
          <View className="h-12 flex-row items-center rounded-xl border border-border bg-muted/50 px-4">
            <Search size={16} color="#71717a" />
            <Input
              placeholder="Search Settings..."
              className="ml-1 h-12 flex-1 border-0 !bg-transparent text-[14px] font-medium shadow-none"
              placeholderTextColor="#a1a1aa"
              value={searchQuery}
              onChangeText={setSearchQuery}
              cursorColor={brandColor}
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCapitalize="none"
              autoCorrect={false}
              enablesReturnKeyAutomatically
            />
          </View>
        </View>

        <View className="mt-2">
          {isSearching ? (
            <View className="mb-4">
              <Text className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-brand">
                Results
              </Text>
              <View className="flex flex-col gap-2 bg-background">
                {searchResults.map((item) => (
                  <MenuRow
                    key={item.id}
                    icon={item.icon}
                    title={item.title}
                    subtitle={subtitleForSearch(item)}
                    href={item.href}
                    destructive={item.destructive}
                    onNavigate={stableNavigate}
                  />
                ))}
              </View>
            </View>
          ) : (
            menuSections.map((section) => (
              <View key={section.title} className="mb-4">
                <Text className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-brand">
                  {section.title}
                </Text>
                <View className="flex flex-col gap-2 bg-background">
                  {section.items.map((item) => (
                    <MenuRow
                      key={item.id}
                      icon={item.icon}
                      title={item.title}
                      subtitle={item.subtitle}
                      href={item.href}
                      destructive={item.destructive}
                      onNavigate={stableNavigate}
                    />
                  ))}
                </View>
              </View>
            ))
          )}

          {!isSearching && (
            <View className="mb-6 mt-8 items-center">
              <Text className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-30">
                Version 1.0.0
              </Text>
            </View>
          )}
        </View>

        {isSearching && searchResults.length === 0 && (
          <View className="items-center justify-center px-10 pt-20">
            <Text className="font-bold text-muted-foreground">No results found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
