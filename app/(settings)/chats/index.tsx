import { Drawer } from '@/components/ui/drawer';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import {
  useChatSettings,
  useNetworkUsage,
  useStorageUsage,
  useUpdateChatSettings,
} from '@/hooks/use-user';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsGroup, cnSettingsMenuItem } from '@/lib/settings-ui';
import { useStableNavigate } from '@/lib/use-stable-navigate';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/store/theme-store';
import { useThemeStore } from '@/store/theme-store';
import * as Haptics from 'expo-haptics';
import {
  Check,
  ChevronRight,
  Database,
  HardDrive,
  Image as ImageIcon,
  Smartphone,
  Trash2,
  Wifi,
  Zap,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default function ChatSettingsScreen() {
  const insets = useSafeAreaInsets();
  const stableNavigate = useStableNavigate();
  const brandColor = useThemeStore((state) => state.accentColor);
  const { toast } = useToast();

  const { data: settings, isLoading: settingsLoading } = useChatSettings();
  const { data: network, isLoading: networkLoading } = useNetworkUsage();
  const { data: storage, isLoading: storageLoading } = useStorageUsage();
  const updateSettings = useUpdateChatSettings();

  const isMounted = React.useRef(true);
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [drawerConfig, setDrawerConfig] = useState<{
    visible: boolean;
    type: 'mobile' | 'wifi';
  }>({
    visible: false,
    type: 'mobile',
  });

  const handleToggle = async (key: string, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await updateSettings.mutateAsync({ [key]: value });
    } catch {
      if (isMounted.current) {
        toast({
          message: 'Could not update setting. Please try again.',
          variant: 'error',
        });
      }
    }
  };

  const toggleDownloadItem = async (type: 'mobile' | 'wifi', item: string) => {
    if (!settings) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const key = type === 'mobile' ? 'mobile_download' : 'wifi_download';
    const current = settings[key as 'mobile_download' | 'wifi_download'] || [];

    let newList;
    if (current.includes(item)) {
      newList = current.filter((i) => i !== item);
    } else {
      newList = [...current, item];
    }

    try {
      await updateSettings.mutateAsync({ [key]: newList });
    } catch {
      if (isMounted.current) {
        toast({
          message: 'Could not update auto-download settings.',
          variant: 'error',
        });
      }
    }
  };

  const DOWNLOAD_OPTIONS = ['Photos', 'Audio', 'Videos', 'Documents'];

  const mobileDownloadList = settings?.mobile_download || [];
  const wifiDownloadList = settings?.wifi_download || [];

  // Calculate totals for summary
  const totalNetwork = network
    ? (network.media_sent || 0) +
      (network.media_received || 0) +
      (network.calls_sent || 0) +
      (network.calls_received || 0) +
      (network.messages_sent || 0) +
      (network.messages_received || 0)
    : 0;

  const totalStorage = storage
    ? (storage.photos || 0) +
      (storage.videos || 0) +
      (storage.documents || 0) +
      (storage.audio || 0) +
      (storage.cache || 0)
    : 0;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Display Section */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-brand">
            Display
          </Text>

          <SettingsGroup>
            <SettingsRow
              icon={ImageIcon}
              title="Chat Wallpaper"
              value={settings?.chat_wallpaper === 'default' ? 'Default' : 'Custom'}
              onPress={() => stableNavigate('/(settings)/chats/wallpaper')}
            />

            <SettingsRow
              icon={HardDrive}
              title="Save to Gallery"
              subtitle="Automatically save photos and videos"
              onPress={() => handleToggle('save_to_gallery', !(settings?.save_to_gallery ?? true))}
              rightContent={
                <Switch
                  checked={settings?.save_to_gallery ?? true}
                  onCheckedChange={(val) => handleToggle('save_to_gallery', val)}
                />
              }
            />
          </SettingsGroup>
        </View>

        {/* Media Auto-Download Section - Using Shared Drawer */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-brand">
            Media Auto-Download
          </Text>

          <SettingsGroup>
            <SettingsRow
              icon={Smartphone}
              title="When Using Mobile Data"
              value={
                mobileDownloadList.length === 0
                  ? 'None'
                  : mobileDownloadList.length === 4
                    ? 'All Media'
                    : mobileDownloadList.join(', ')
              }
              onPress={() => setDrawerConfig({ visible: true, type: 'mobile' })}
            />

            <SettingsRow
              icon={Wifi}
              title="When Connected on Wi-Fi"
              value={
                wifiDownloadList.length === 0
                  ? 'None'
                  : wifiDownloadList.length === 4
                    ? 'All Media'
                    : wifiDownloadList.join(', ')
              }
              onPress={() => setDrawerConfig({ visible: true, type: 'wifi' })}
            />
          </SettingsGroup>

          <Text className="mt-4 text-[11px] font-medium leading-4 text-muted-foreground/40">
            Voice messages are always automatically downloaded for the best experience.
          </Text>
        </View>

        {/* Data & Storage Section */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-brand">
            Storage & Data
          </Text>

          <SettingsGroup>
            <SettingsRow
              icon={Zap}
              title="Data Saver"
              subtitle="Reduce data usage for media and background activity"
              onPress={() => handleToggle('data_saver', !(settings?.data_saver ?? false))}
              rightContent={
                <Switch
                  checked={settings?.data_saver ?? false}
                  onCheckedChange={(val) => handleToggle('data_saver', val)}
                />
              }
            />

            <SettingsRow
              icon={Database}
              title="Network Usage"
              value={formatBytes(totalNetwork)}
              onPress={() => stableNavigate('/(settings)/storage-data/network-usage')}
            />

            <SettingsRow
              icon={Trash2}
              title="Manage Storage"
              value={formatBytes(totalStorage)}
              onPress={() => stableNavigate('/(settings)/storage-data/storage')}
            />

            <SettingsRow
              icon={Zap}
              title="Media Upload Quality"
              subtitle="Send high resolution photos and videos"
              onPress={() =>
                handleToggle('high_quality_upload', !(settings?.high_quality_upload ?? true))
              }
              rightContent={
                <Switch
                  checked={settings?.high_quality_upload ?? true}
                  onCheckedChange={(val) => handleToggle('high_quality_upload', val)}
                />
              }
            />
          </SettingsGroup>
        </View>
      </ScrollView>

      {/* Media Download Drawer - UI Refactor to use proper Drawer component */}
      <Drawer
        visible={drawerConfig.visible}
        onClose={() => setDrawerConfig((prev) => ({ ...prev, visible: false }))}>
        <View className="pt-2">
          <Text className="mb-1 text-xl font-black text-foreground">
            {drawerConfig.type === 'mobile' ? 'Mobile Data' : 'Wi-Fi Connection'}
          </Text>
          <Text className="mb-8 text-[13px] font-medium text-muted-foreground">
            Select media types to auto-download
          </Text>

          <View className="gap-3">
            {DOWNLOAD_OPTIONS.map((option) => {
              const currentList =
                drawerConfig.type === 'mobile' ? mobileDownloadList : wifiDownloadList;
              const isSelected = currentList.includes(option);
              return (
                <TouchableOpacity
                  key={option}
                  activeOpacity={0.7}
                  onPress={() => toggleDownloadItem(drawerConfig.type, option)}
                  className={cn(
                    'flex-row items-center justify-between rounded-2xl border px-5 py-4',
                    isSelected ? 'border-brand/30 bg-brand/10' : 'border-transparent bg-muted/10'
                  )}>
                  <Text
                    className={cn(
                      'text-[15px] font-bold',
                      isSelected ? 'text-brand' : 'text-foreground'
                    )}>
                    {option}
                  </Text>
                  <View
                    className={cn(
                      'h-6 w-6 items-center justify-center rounded-full border-2',
                      isSelected ? 'border-brand bg-brand' : 'border-muted-foreground/20'
                    )}>
                    {isSelected && <Check size={12} color="#fff" strokeWidth={4} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={() => setDrawerConfig((prev) => ({ ...prev, visible: false }))}
            className="mt-10 h-14 items-center justify-center rounded-2xl bg-brand shadow-lg shadow-brand/20 active:opacity-90">
            <Text className="text-[14px] font-black uppercase tracking-widest text-white">
              Confirm Selection
            </Text>
          </TouchableOpacity>
        </View>
      </Drawer>
    </View>
  );
}

// Local SettingRow replaced by centralized SettingsRow component.
