import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { useUserProfile } from '@/hooks/use-user';
import { Link, useRouter } from 'expo-router';
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
import {
  ShieldCheck,
  Lock,
  Bell,
  MessageSquare,
  Monitor,
  LifeBuoy,
  UserCircle,
  ChevronRight,
  LogOut,
  Search,
  Settings,
  Edit2,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useThemeStore, useAppTheme } from '@/store/theme-store';

interface MenuRowProps {
  icon: any;
  title: string;
  subtitle: string;
  href?: string;
  isLast?: boolean;
  destructive?: boolean;
}

const MenuRow = memo(({ icon: Icon, title, subtitle, href, isLast, destructive }: MenuRowProps) => {
  const { brandColor, isDark } = useAppTheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => href && router.push(href as any)}
      className={cn(
        'flex-row items-center bg-background px-5 py-3.5',
        !isLast && 'border-b border-border/5'
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
  );
});

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { brandColor, isDark } = useAppTheme();
  const { data: profile, isLoading } = useUserProfile();
  const [searchQuery, setSearchQuery] = useState('');

  const { username, initial, phone } = useMemo(
    () => ({
      username: profile?.username || 'User',
      initial: (profile?.username || 'U').charAt(0).toUpperCase(),
      phone: formatPhoneNumber(profile?.phone_number, profile?.country_code),
    }),
    [profile]
  );

  const SETTINGS_DATA = [
    {
      title: 'Security & Privacy',
      items: [
        {
          icon: ShieldCheck,
          title: 'Privacy',
          subtitle: 'Last seen, status, visibility',
          id: 'privacy',
          href: '/privacy-settings',
        },
        {
          icon: Lock,
          title: 'Security',
          subtitle: 'Biometric lock, device sessions',
          id: 'security',
          href: '/security-settings',
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          icon: Bell,
          title: 'Notifications',
          subtitle: 'Message alerts, quiet hours',
          id: 'notif',
          href: '/notification-settings',
        },
        {
          icon: MessageSquare,
          title: 'Chats & Media',
          subtitle: 'Auto-download, wallpaper',
          id: 'chat',
          href: '/chat-settings',
        },
        {
          icon: Monitor,
          title: 'Appearance',
          subtitle: 'Dark mode, app language',
          id: 'app',
          href: '/appearance-settings',
        },
      ],
    },
    {
      title: 'Help & Management',
      items: [
        {
          icon: LifeBuoy,
          title: 'Help & Support',
          subtitle: 'Report a bug, terms of service',
          id: 'help',
          href: '/support',
        },
        {
          icon: UserCircle,
          title: 'Account Center',
          subtitle: 'Delete account, personal data',
          id: 'account',
          href: '/account-management',
        },
      ],
    },
  ];

  const filteredData = useMemo(() => {
    if (!searchQuery) return SETTINGS_DATA;
    const query = searchQuery.toLowerCase();
    return SETTINGS_DATA.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) || item.subtitle.toLowerCase().includes(query)
      ),
    })).filter((section) => section.items.length > 0);
  }, [searchQuery]);

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
                className="flex-row items-center rounded-xl border border-brand/5 bg-brand/5 p-4">
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
          <View className="h-11 flex-row items-center rounded-xl border border-border/10 bg-muted/50 px-4">
            <Search size={16} color="#71717a" />
            <Input
              placeholder="Search...."
              className="ml-1 h-10 flex-1 border-0 !bg-transparent text-[14px] font-medium shadow-none"
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
          {filteredData.map((section) => (
            <View key={section.title} className="mb-4">
              <Text className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-brand">
                {section.title}
              </Text>
              <View className="bg-background">
                {section.items.map((item, index) => (
                  <MenuRow
                    key={item.id}
                    icon={item.icon}
                    title={item.title}
                    subtitle={item.subtitle}
                    href={item.href}
                    isLast={index === section.items.length - 1}
                  />
                ))}
              </View>
            </View>
          ))}

          {!searchQuery && (
            <View className="mb-6 mt-8 items-center">
              <Text className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-30">
                Version 1.0.0
              </Text>
            </View>
          )}
        </View>

        {filteredData.length === 0 && searchQuery && (
          <View className="items-center justify-center px-10 pt-20">
            <Text className="font-bold text-muted-foreground">No results found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
