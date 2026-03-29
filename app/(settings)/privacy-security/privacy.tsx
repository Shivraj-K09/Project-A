import { Drawer } from '@/components/ui/drawer';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { PrivacySettings, usePrivacySettings, useUpdatePrivacySettings } from '@/hooks/use-user';
import * as Haptics from 'expo-haptics';
import { Haptic } from '@/lib/haptic-utils';
import { useRouter } from 'expo-router';
import {
  Camera,
  Check,
  ChevronRight,
  Eye,
  Info,
  MessageSquare,
  Shield,
  Users,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsGroup, cnSettingsMenuItem } from '@/lib/settings-ui';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/store/theme-store';
import { useThemeStore } from '@/store/theme-store';

type VisibilityOption = 'everyone' | 'contacts' | 'nobody';
type OnlineOption = 'everyone' | 'same_as_last_seen';

const VISIBILITY_OPTIONS: Record<VisibilityOption, { title: string; subtitle: string }> = {
  everyone: { title: 'Everyone', subtitle: 'Anyone can see this info' },
  contacts: { title: 'My Contacts', subtitle: 'Only your saved contacts' },
  nobody: { title: 'Nobody', subtitle: 'Hide this info from everyone' },
};

const ONLINE_OPTIONS: Record<OnlineOption, { title: string; subtitle: string }> = {
  everyone: { title: 'Everyone', subtitle: 'Anyone can see when you are online' },
  same_as_last_seen: {
    title: 'Same as Last Seen',
    subtitle: 'Matches your Last Seen privacy setting',
  },
};

export default function PrivacySettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const brandColor = useThemeStore((state) => state.accentColor);

  const { data: settings, isLoading } = usePrivacySettings();
  const updateSettings = useUpdatePrivacySettings();

  const [editingKey, setEditingKey] = useState<keyof PrivacySettings | null>(null);

  const handleToggleReadReceipts = async (value: boolean) => {
    Haptic.impact(Haptics.ImpactFeedbackStyle.Light);
    await updateSettings.mutateAsync({ read_receipts: value });
  };

  const handleSelectOption = async (option: string) => {
    if (!editingKey) return;
    Haptic.impact(Haptics.ImpactFeedbackStyle.Medium);
    await updateSettings.mutateAsync({ [editingKey]: option });
    setEditingKey(null);
  };

  const modalOptions = useMemo(() => {
    if (editingKey === 'online_status') return ONLINE_OPTIONS;
    return VISIBILITY_OPTIONS;
  }, [editingKey]);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}>
        {/* Visibility Section */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="font-semibol mb-4 text-[12px] uppercase tracking-wider text-brand">
            Who can see my personal info
          </Text>

          <SettingsGroup>
            <SettingsRow
              icon={Eye}
              title="Last Seen"
              value={VISIBILITY_OPTIONS[settings?.last_seen || 'everyone'].title}
              onPress={() => setEditingKey('last_seen')}
            />

            <SettingsRow
              icon={Camera}
              title="Profile Photo"
              value={VISIBILITY_OPTIONS[settings?.profile_photo || 'everyone'].title}
              onPress={() => setEditingKey('profile_photo')}
            />

            <SettingsRow
              icon={Info}
              title="About"
              value={VISIBILITY_OPTIONS[settings?.about || 'everyone'].title}
              onPress={() => setEditingKey('about')}
            />

            <SettingsRow
              icon={Users}
              title="Groups"
              value={VISIBILITY_OPTIONS[settings?.groups || 'everyone'].title}
              onPress={() => setEditingKey('groups')}
            />
          </SettingsGroup>
        </View>

        {/* Messaging Section */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="font-semibol mb-4 text-[12px] uppercase tracking-wider text-brand">
            Messaging & Activity
          </Text>

          <SettingsGroup>
            <SettingsRow
              icon={MessageSquare}
              title="Read Receipts"
              subtitle="If turned off, you won't send or receive read receipts."
              onPress={() => handleToggleReadReceipts(!(settings?.read_receipts ?? true))}
              rightContent={
                <Switch
                  checked={settings?.read_receipts ?? true}
                  onCheckedChange={handleToggleReadReceipts}
                />
              }
            />

            <SettingsRow
              icon={Shield}
              title="Online Status"
              value={ONLINE_OPTIONS[settings?.online_status || 'everyone'].title}
              onPress={() => setEditingKey('online_status')}
            />
          </SettingsGroup>
        </View>

        {/* Security Footer Note */}
        <View className="mt-6 px-8">
          <Text className="px-4 text-center text-[12px] leading-5 text-muted-foreground">
            Your messages and calls are protected by end-to-end encryption. Not even this app can
            read or listen to them.
          </Text>
        </View>
      </ScrollView>

      {/* Selection Drawer */}
      <Drawer visible={!!editingKey} onClose={() => setEditingKey(null)}>
        <Text className="font-semibol mb-6 text-center text-xl text-foreground">
          Select Visibility
        </Text>

        <View className="overflow-hidden rounded-3xl border border-border bg-muted/40">
          {Object.entries(modalOptions).map(([key, option], index, array) => {
            const isSelected = settings?.[editingKey!] === key;
            const isLast = index === array.length - 1;

            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.7}
                onPress={() => handleSelectOption(key)}
                className={`flex-row items-center bg-background/50 p-5 ${!isLast ? 'border-b border-border' : ''}`}>
                <View className="mr-4 flex-1">
                  <Text
                    className={`text-[17px] font-semibold ${isSelected ? 'text-brand' : 'text-foreground'}`}>
                    {option.title}
                  </Text>
                  <Text className="mt-1.5 text-[14px] leading-5 text-muted-foreground">
                    {option.subtitle}
                  </Text>
                </View>

                {/* Animated Checkmark Replacement */}
                <View className="ml-2 items-center justify-center">
                  {isSelected ? (
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-brand shadow-sm shadow-brand/40">
                      <Check size={14} color="#ffffff" strokeWidth={3} />
                    </View>
                  ) : (
                    <View className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {editingKey === 'online_status' && (
          <Text className="mt-4 px-2 text-center text-[12px] text-muted-foreground">
            Note: If you don't share your Last Seen, you won't be able to see other people's Last
            Seen.
          </Text>
        )}
      </Drawer>
    </View>
  );
}

// Local SettingRow replaced by centralized SettingsRow component.
