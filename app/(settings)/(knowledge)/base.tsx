import { Text } from '@/components/ui/text';
import { useStableNavigate } from '@/lib/use-stable-navigate';
import { useAppTheme, useThemeStore } from '@/store/theme-store';
import {
  Bell,
  BellOff,
  BookOpen,
  EyeOff,
  ImageIcon,
  Key,
  MessageCircle,
  MessageSquare,
  Moon,
  Palette,
  Rocket,
  Scale,
  Search,
  Shield,
  Smartphone,
  User,
  UserPlus,
} from 'lucide-react-native';
import { memo, useMemo, useState } from 'react';
import { ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ALL_CONTENT = [
  {
    category: 'Foundations',
    icon: BookOpen,
    items: [
      {
        id: 'gs1',
        icon: Rocket,
        title: 'Profile Setup',
        content:
          'Go to Settings > Profile to customize your digital identity. Upload an avatar, set a unique display name, and add a bio. Your profile is the first thing people see when you connect.',
      },
      {
        id: 'gs2',
        icon: MessageSquare,
        title: 'Secure Messaging',
        content:
          'Tap the new message icon to start a chat. All conversations are secured with our Signal-protocol based encryption. Every word you send is private.',
      },
      {
        id: 'gs3',
        icon: UserPlus,
        title: 'Finding Connections',
        content:
          'Find friends by searching for their username or syncing your contacts. We only store anonymized hashes of your contacts.',
      },
    ],
  },
  {
    category: 'Privacy',
    icon: Shield,
    items: [
      {
        id: 'p1',
        icon: Shield,
        title: 'End-to-End Encryption',
        content:
          'Every message and file is encrypted on your device and can only be decrypted by the recipient. We use the Signal Protocol, the gold standard in privacy.',
      },
      {
        id: 'p2',
        icon: EyeOff,
        title: 'Zero Knowledge',
        content:
          'Your encryption keys never leave your phone. We cannot read your chats or see your media. Your privacy is mathematically guaranteed.',
      },
      {
        id: 'p3',
        icon: Scale,
        title: 'Safety & Compliance',
        content:
          'In rare cases of legal warrants, we cooperate with authorities. However, we can only provide metadata (logs); your content remains unreadable.',
      },
    ],
  },
  {
    category: 'Notifications',
    icon: Bell,
    items: [
      {
        id: 'n1',
        icon: Bell,
        title: 'Custom Sounds',
        content:
          'Set unique notification sounds for specific chats to know who is messaging you without even looking at your phone. Control your focus.',
      },
      {
        id: 'n2',
        icon: BellOff,
        title: 'Selective Muting',
        content:
          "Instantly silence any conversation for 8 hours, 1 week, or indefinitely. Muted chats will still show unread badges but won't ring.",
      },
      {
        id: 'n3',
        icon: Moon,
        title: 'Focus Integration',
        content:
          "The app respects your device's system settings. You can also define Quiet Hours to stop all notifications automatically during rest.",
      },
    ],
  },
  {
    category: 'Social Power',
    icon: Smartphone,
    items: [
      {
        id: 'a1',
        icon: User,
        title: 'Profile Control',
        content:
          'Change your handle and avatar at any time. Significant changes may require a brief cooling period for security reasons.',
      },
      {
        id: 'a2',
        icon: Key,
        title: 'Two-Step Verification',
        content:
          'Add an extra layer of security with a custom PIN. This prevents unauthorized access even if someone gets your SMS code.',
      },
      {
        id: 'a3',
        icon: Smartphone,
        title: 'Active Sessions',
        content:
          'Monitor and manage all active devices. Remotely sign out of any instance to keep your account safe.',
      },
    ],
  },
  {
    category: 'Aesthetics',
    icon: Palette,
    items: [
      {
        id: 'c1',
        icon: Palette,
        title: 'Accent Colors',
        content:
          "Choose from a curated collection of premium brand colors. This changes the entire app's look and feel instantly.",
      },
      {
        id: 'c2',
        icon: MessageSquare,
        title: 'Chat Geometry',
        content:
          'Select between Rounded, Soft, or Square bubble styles. This applies globally to all conversations.',
      },
      {
        id: 'c3',
        icon: ImageIcon,
        title: 'Wallpapers',
        content:
          'Set a custom glass-morphism background or upload your own photography for global chat threads.',
      },
    ],
  },
];

export default function KnowledgeBaseScreen() {
  const insets = useSafeAreaInsets();
  const brandColor = useThemeStore((state) => state.accentColor);
  const { isDark } = useAppTheme();
  const stableNavigate = useStableNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return ALL_CONTENT;
    const query = searchQuery.toLowerCase();
    return ALL_CONTENT.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) || item.content.toLowerCase().includes(query)
      ),
    })).filter((section) => section.items.length > 0);
  }, [searchQuery]);

  return (
    <View className="flex-1 bg-background">
      {/* 
          VIBRANT HEADER BACKGROUND 
          - Adds that 'fantastic' premium feel without cluttering the list.
      */}
      <View
        style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 400,
          height: 400,
          backgroundColor: brandColor,
          opacity: isDark ? 0.03 : 0.05,
          borderRadius: 200,
          filter: 'blur(100px)',
        }}
      />

      <ScrollView
        className="flex-1"
        stickyHeaderIndices={[0]}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}>
        {/* Sleek Search Interface */}
        <View className="bg-background/80 px-6 pb-6 pt-4">
          <View
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
            className="h-14 flex-row items-center rounded-2xl border border-white/5 px-4">
            <Search size={18} color={brandColor} strokeWidth={2.5} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Find articles, security, tips..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
              className="ml-3 flex-1 text-[15px] font-semibold text-foreground"
            />
          </View>
        </View>

        {/* Minimal Unified Guide */}
        <View className="mt-4 space-y-12 px-6">
          {filteredContent.map((section, sIdx) => (
            <Animated.View
              key={section.category}
              layout={Layout.springify().damping(22)}
              entering={FadeInDown.delay(sIdx * 100)}>
              {/* Category Lead */}
              <View className="mb-6 flex-row items-center pl-1">
                <View
                  style={{ backgroundColor: brandColor + '15' }}
                  className="mr-3 h-8 w-8 items-center justify-center rounded-lg">
                  <section.icon size={16} color={brandColor} strokeWidth={2.5} />
                </View>
                <Text
                  style={{ color: brandColor }}
                  className="text-[12px] font-black uppercase tracking-[0.2em]">
                  {section.category}
                </Text>
              </View>

              {/* Seamless List of Tips */}
              <View className="space-y-4">
                {section.items.map((item, iIdx) => (
                  <DocItem
                    key={item.id}
                    title={item.title}
                    content={item.content}
                    icon={item.icon}
                  />
                ))}
              </View>
            </Animated.View>
          ))}

          {filteredContent.length === 0 && (
            <View className="items-center py-20">
              <Text className="font-bold text-muted-foreground/30">No documentation found</Text>
            </View>
          )}

          {/* Premium Help CTA */}
          <TouchableOpacity
            onPress={() => stableNavigate('/help-support/chat')}
            activeOpacity={0.8}
            className="mt-8 overflow-hidden rounded-[32px] border border-white/5 shadow-2xl shadow-brand/10">
            <View
              style={{ backgroundColor: brandColor }}
              className="flex-row items-center justify-between p-8">
              <View className="flex-1 pr-6">
                <Text className="mb-2 text-xl font-black tracking-tight text-white">
                  Need direct help?
                </Text>
                <Text className="text-sm font-medium leading-5 text-white/70">
                  Our support engineers are ready to assist you with any specific issue.
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <MessageCircle size={20} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const DocItem = memo(({ title, content, icon: Icon }: any) => {
  const brandColor = useThemeStore((state) => state.accentColor);
  const { isDark } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
      }}>
      <View className="flex-row items-start">
        <View
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
          className="mr-4 h-9 w-9 items-center justify-center rounded-xl">
          <Icon size={16} color={brandColor} strokeWidth={2.2} />
        </View>
        <View className="flex-1 pr-4">
          <Text className="mb-1.5 text-[17px] font-bold tracking-tight text-foreground">
            {title}
          </Text>
          <Text className="text-[14px] font-medium leading-[22px] text-muted-foreground/50">
            {content}
          </Text>
        </View>
      </View>
    </View>
  );
});
