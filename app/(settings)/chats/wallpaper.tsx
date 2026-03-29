import { Drawer } from '@/components/ui/drawer';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useChatSettings, useUpdateChatSettings } from '@/hooks/use-user';
import { SettingsGroup, cnSettingsMenuItem } from '@/lib/settings-ui';
import { useStableNavigate } from '@/lib/use-stable-navigate';
import { cn } from '@/lib/utils';
import { WALLPAPERS } from '@/lib/wallpapers';
import { useThemeStore } from '@/store/theme-store';
import * as Haptics from 'expo-haptics';
import { Check, ChevronRight, Monitor, Sun } from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WallpaperGrid } from '@/components/settings/wallpaper-grid';
import { DimmingSlider } from '@/components/ui/dimming-slider';

const { width } = Dimensions.get('window');
const CONTAINER_PADDING = 32;
const GAP_SIZE = 24;
const COLUMN_WIDTH = (width - CONTAINER_PADDING - GAP_SIZE) / 3;

export default function ChatWallpaperScreen() {
  const insets = useSafeAreaInsets();
  const stableNavigate = useStableNavigate();
  const brandColor = useThemeStore((state) => state.accentColor);
  const { toast } = useToast();

  const { data: settings, isLoading } = useChatSettings();
  const updateSettings = useUpdateChatSettings();

  const [dimDrawerVisible, setDimDrawerVisible] = useState(false);
  const [localDim, setLocalDim] = useState(0);

  // Sync from database
  useEffect(() => {
    if (settings?.wallpaper_dim !== undefined) {
      setLocalDim(settings.wallpaper_dim);
    }
  }, [settings?.wallpaper_dim]);

  const handleSaveDim = useCallback(async () => {
    try {
      await updateSettings.mutateAsync({ wallpaper_dim: localDim });
      setDimDrawerVisible(false);
      toast({ message: 'Dimming level updated', variant: 'success' });
    } catch (error) {
      toast({ message: 'Failed to update dimming', variant: 'error' });
    }
  }, [localDim, updateSettings, toast]);

  const handleResetDefault = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateSettings.mutateAsync({ chat_wallpaper: 'default' });
      toast({ message: 'Default wallpaper restored', variant: 'success' });
    } catch (error) {
      toast({ message: 'Failed to reset wallpaper', variant: 'error' });
    }
  }, [updateSettings, toast]);

  const handleWallpaperPress = useCallback(
    (index: number, category: string) => {
      stableNavigate({
        pathname: '/chats/wallpaper-preview',
        params: { index: index.toString(), category: category.toLowerCase() },
      });
    },
    [stableNavigate]
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={brandColor} />
      </View>
    );
  }

  const currentDimPercent = Math.round(localDim * 100);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}>
        <WallpaperGrid
          category="Bright"
          items={WALLPAPERS.bright}
          onPress={handleWallpaperPress}
          columnWidth={COLUMN_WIDTH}
        />
        <WallpaperGrid
          category="Dark"
          items={WALLPAPERS.dark}
          onPress={handleWallpaperPress}
          columnWidth={COLUMN_WIDTH}
        />
        <WallpaperGrid
          category="Solid"
          items={WALLPAPERS.solid}
          onPress={handleWallpaperPress}
          columnWidth={COLUMN_WIDTH}
        />

        <View className="mt-4 border-t border-border/5 px-6 py-6">
          <Text className="font-semibol mb-4 text-[12px] uppercase tracking-wider text-brand">
            Display Settings
          </Text>

          <SettingsGroup>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => setDimDrawerVisible(true)}
              className={cn(cnSettingsMenuItem(), 'flex-row items-center')}>
              <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
                <Monitor size={18} color={brandColor} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-semibold text-foreground">Wallpaper Dimming</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="mr-2 text-[14px] font-medium text-muted-foreground">
                  {currentDimPercent}%
                </Text>
                <ChevronRight size={14} color="#71717a" strokeWidth={2} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={updateSettings.isPending}
              onPress={handleResetDefault}
              className={cn(cnSettingsMenuItem(), 'flex-row items-center justify-between')}>
              <View className="flex-row items-center">
                <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
                  <Check size={18} color={brandColor} strokeWidth={2} />
                </View>
                <Text className="text-[16px] font-semibold text-foreground">
                  {updateSettings.isPending ? 'Restoring...' : 'Set Default Wallpaper'}
                </Text>
              </View>
            </TouchableOpacity>
          </SettingsGroup>
        </View>
      </ScrollView>

      <Drawer visible={dimDrawerVisible} onClose={() => setDimDrawerVisible(false)}>
        <View className="pt-2">
          <Text className="mb-1 text-xl font-black text-foreground">Adjust Dimming</Text>
          <Text className="mb-10 text-[13px] font-medium text-muted-foreground">
            Control how dark the background appears in your chats.
          </Text>

          <View className="flex-row items-center justify-center gap-6 px-10">
            <Sun size={18} color="#71717a" strokeWidth={2} />
            <DimmingSlider value={localDim} onValueChange={setLocalDim} brandColor={brandColor} />
            <Sun size={24} color={brandColor} strokeWidth={2.5} />
          </View>

          <Text className="mt-4 text-center text-2xl font-black text-foreground">
            {currentDimPercent}%
          </Text>

          <TouchableOpacity
            onPress={handleSaveDim}
            disabled={updateSettings.isPending}
            className="mt-12 h-14 items-center justify-center rounded-2xl bg-brand shadow-lg shadow-brand/20 active:opacity-90">
            <Text className="text-[14px] font-black uppercase tracking-widest text-white">
              {updateSettings.isPending ? 'Saving...' : 'Save Intensity'}
            </Text>
          </TouchableOpacity>
        </View>
      </Drawer>
    </View>
  );
}
