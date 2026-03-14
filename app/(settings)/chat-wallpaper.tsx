import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated as RNAnimated,
  PanResponder,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Monitor, ChevronRight, Sun } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/store/theme-store';
import { Image } from 'expo-image';
import { WALLPAPERS } from '@/lib/wallpapers';
import { useChatSettings, useUpdateChatSettings } from '@/hooks/use-user';
import { useToast } from '@/components/ui/toast';
import * as Haptics from 'expo-haptics';
import { Drawer } from '@/components/ui/drawer';

const { width } = Dimensions.get('window');
const CONTAINER_PADDING = 32;
const GAP_SIZE = 24;
const COLUMN_WIDTH = (width - CONTAINER_PADDING - GAP_SIZE) / 3;

export default function ChatWallpaperScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const brandColor = useThemeStore((state) => state.accentColor);
  const { toast } = useToast();

  const { data: settings, isLoading } = useChatSettings();
  const updateSettings = useUpdateChatSettings();

  const [dimDrawerVisible, setDimDrawerVisible] = useState(false);
  const [localDim, setLocalDim] = useState(0);

  const animDim = useRef(new RNAnimated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const startDimRef = useRef(0);

  // Sync from database
  useEffect(() => {
    if (settings?.wallpaper_dim !== undefined && settings.wallpaper_dim !== localDim) {
      setLocalDim(settings.wallpaper_dim);
      animDim.setValue(settings.wallpaper_dim);
    }
  }, [settings?.wallpaper_dim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startDimRef.current = localDim;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (trackWidthRef.current <= 0) return;
        const activeWidth = trackWidthRef.current - 20;

        // Track the raw floating value
        let rawValue = startDimRef.current + gestureState.dx / activeWidth;
        if (rawValue < 0) rawValue = 0;
        if (rawValue > 1) rawValue = 1;

        // Make it snap to nice 10% steps (10 segments)
        let steppedValue = Math.round(rawValue * 10) / 10;

        setLocalDim(steppedValue);
        animDim.setValue(steppedValue);
      },
      onPanResponderRelease: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    })
  ).current;

  const handleSaveDim = async () => {
    try {
      await updateSettings.mutateAsync({ wallpaper_dim: localDim });
      setDimDrawerVisible(false);
      toast({
        message: 'Dimming level updated',
        variant: 'success',
      });
    } catch (error) {
      toast({
        message: 'Failed to update dimming',
        variant: 'error',
      });
    }
  };

  const handleResetDefault = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateSettings.mutateAsync({ chat_wallpaper: 'default' });
      toast({
        message: 'Default wallpaper restored',
        variant: 'success',
      });
    } catch (error) {
      toast({
        message: 'Failed to reset wallpaper',
        variant: 'error',
      });
    }
  };

  const WallpaperGrid = ({ category, items }: { category: string; items: any[] }) => (
    <View className="mb-8">
      <Text className="mb-4 px-6 text-[12px] font-extrabold uppercase tracking-[0.15em] text-brand opacity-80">
        {category} Wallpapers
      </Text>
      <View className="flex-row flex-wrap gap-3 px-4">
        {items.map((wp, index) => (
          <TouchableOpacity
            key={wp.id}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/(settings)/wallpaper-preview',
                params: { index: index.toString(), category: category.toLowerCase() },
              })
            }
            style={{ width: COLUMN_WIDTH, height: COLUMN_WIDTH * 1.7 }}
            className="overflow-hidden rounded-[20px] border border-white/5 bg-secondary/10">
            {wp.thumbnail.startsWith('#') ? (
              <View style={{ backgroundColor: wp.thumbnail }} className="flex-1" />
            ) : (
              <Image
                source={{ uri: wp.thumbnail }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={200}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
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
        <WallpaperGrid category="Bright" items={WALLPAPERS.bright} />
        <WallpaperGrid category="Dark" items={WALLPAPERS.dark} />
        <WallpaperGrid category="Solid" items={WALLPAPERS.solid} />

        <View className="mt-4 border-t border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            Display Settings
          </Text>

          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => setDimDrawerVisible(true)}
            className="flex-row items-center border-b border-border/5 py-4">
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
            className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center">
              <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
                <Check size={18} color={brandColor} strokeWidth={2} />
              </View>
              <Text className="text-[16px] font-semibold text-foreground">
                {updateSettings.isPending ? 'Restoring...' : 'Set Default Wallpaper'}
              </Text>
            </View>
          </TouchableOpacity>

          <Text className="mt-2 text-[12px] text-muted-foreground opacity-60">
            Resetting will apply the default system wallpaper to all chats.
          </Text>
        </View>
      </ScrollView>

      {/* Wallpaper Dimming Drawer */}
      <Drawer visible={dimDrawerVisible} onClose={() => setDimDrawerVisible(false)}>
        <View className="pt-2">
          <Text className="mb-1 text-xl font-black text-foreground">Adjust Dimming</Text>
          <Text className="mb-10 text-[13px] font-medium text-muted-foreground">
            Control how dark the background appears in your chats.
          </Text>

          <View className="flex-row items-center justify-center gap-6 px-10">
            <Sun size={18} color="#71717a" strokeWidth={2} />
            <View
              className="h-10 flex-1 justify-center"
              onLayout={(e) => {
                trackWidthRef.current = e.nativeEvent.layout.width;
                if (trackWidth === 0) setTrackWidth(e.nativeEvent.layout.width);
              }}
              {...panResponder.panHandlers}>
              <View pointerEvents="none" className="mx-[10px] h-[3px] rounded-full bg-muted">
                <RNAnimated.View
                  style={{
                    width: animDim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: brandColor,
                  }}
                  className="h-full rounded-full"
                />
                <RNAnimated.View
                  pointerEvents="none"
                  style={{
                    transform: [
                      {
                        translateX: animDim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, Math.max(0, trackWidth - 20)],
                        }),
                      },
                    ],
                    position: 'absolute',
                    top: -9,
                    left: -10,
                    width: 20,
                    height: 20,
                    backgroundColor: '#fff',
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: brandColor,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 1,
                    elevation: 2,
                  }}
                />
              </View>
            </View>
            <Sun size={24} color={brandColor} strokeWidth={2.5} />
          </View>

          <Text className="mt-4 text-center text-2xl font-black text-foreground">
            {Math.round(localDim * 100)}%
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
