import { useState, useCallback, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useChatSettings, useUpdateChatSettings } from '@/hooks/use-user';
import { useToast } from '@/components/ui/toast';
import { WALLPAPERS } from '@/lib/wallpapers';
import { useThemeStore } from '@/store/theme-store';

export function useWallpaperPreview() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { accentColor: brandColor } = useThemeStore();
  
  const category = (params.category as keyof typeof WALLPAPERS) || 'bright';
  const initialIndex = parseInt(params.index as string) || 0;
  const wallpapers = WALLPAPERS[category];

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [rightBubbleColor, setRightBubbleColor] = useState(brandColor);
  const [leftBubbleColor, setLeftBubbleColor] = useState('#1F1F1F');
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('right');
  const [dimValue, setDimValue] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const { data: settings } = useChatSettings();
  const updateSettings = useUpdateChatSettings();
  const { toast } = useToast();

  useEffect(() => {
    if (settings?.wallpaper_dim !== undefined) {
      setDimValue(settings.wallpaper_dim);
    }
  }, [settings?.wallpaper_dim]);

  const handleSetWallpaper = useCallback(async () => {
    const selectedWallpaper = wallpapers[currentIndex];
    if (!selectedWallpaper) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateSettings.mutateAsync({
        chat_wallpaper: selectedWallpaper.url,
        wallpaper_dim: dimValue,
      });

      toast({
        message: 'Wallpaper applied to all chats',
        variant: 'success',
      });

      router.back();
    } catch (error) {
      toast({
        message: 'Failed to apply wallpaper',
        variant: 'error',
      });
    }
  }, [currentIndex, dimValue, wallpapers, updateSettings, toast, router]);

  const onPageSelected = useCallback((e: any) => {
    setCurrentIndex(e.nativeEvent.position);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const toggleColorPicker = useCallback(() => {
    setShowColorPicker(prev => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  return {
    wallpapers,
    initialIndex,
    currentIndex,
    rightBubbleColor,
    setRightBubbleColor,
    leftBubbleColor,
    setLeftBubbleColor,
    activeSide,
    setActiveSide,
    dimValue,
    setDimValue,
    showColorPicker,
    setShowColorPicker,
    handleSetWallpaper,
    onPageSelected,
    toggleColorPicker,
    brandColor,
    updateSettings,
  };
}
