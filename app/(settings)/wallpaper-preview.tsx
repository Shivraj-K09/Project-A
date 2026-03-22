import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, TouchableOpacity, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Check, Sun, Palette, ChevronLeft, Plus } from 'lucide-react-native';
import PagerView from 'react-native-pager-view';
import { Image } from 'expo-image';
import { WALLPAPERS } from '@/lib/wallpapers';
import { useThemeStore } from '@/store/theme-store';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useChatSettings, useUpdateChatSettings } from '@/hooks/use-user';
import { useToast } from '@/components/ui/toast';
import { PanResponder, Animated as RNAnimated } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EXTENDED_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#ef4444',
  '#3b82f6',
  '#8b5cf6',
  '#06b6d4',
  '#005c4b',
  '#f43f5e',
  '#71717a',
  '#ffffff',
  '#000000',
  '#4ade80',
  '#fbbf24',
  '#818cf8',
];

export default function WallpaperPreviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const category = (params.category as keyof typeof WALLPAPERS) || 'bright';
  const initialIndex = parseInt(params.index as string) || 0;
  const wallpapers = WALLPAPERS[category];

  const { accentColor: brandColor, bubbleShape } = useThemeStore();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [rightBubbleColor, setRightBubbleColor] = useState(brandColor);
  const [leftBubbleColor, setLeftBubbleColor] = useState('#1F1F1F');
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('right');
  const [dimValue, setDimValue] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const { data: settings } = useChatSettings();
  const updateSettings = useUpdateChatSettings();
  const { toast } = useToast();

  const animDim = useRef(new RNAnimated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const startDimRef = useRef(0);

  // Initialize from settings
  useEffect(() => {
    if (settings?.wallpaper_dim !== undefined && settings.wallpaper_dim !== dimValue) {
      setDimValue(settings.wallpaper_dim);
      animDim.setValue(settings.wallpaper_dim);
    }
  }, [settings?.wallpaper_dim]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startDimRef.current = dimValue;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (trackWidthRef.current <= 0) return;
        const activeWidth = trackWidthRef.current - 20;

        let rawValue = startDimRef.current + gestureState.dx / activeWidth;
        if (rawValue < 0) rawValue = 0;
        if (rawValue > 1) rawValue = 1;

        let steppedValue = Math.round(rawValue * 10) / 10;

        setDimValue(steppedValue);
        animDim.setValue(steppedValue);
      },
      onPanResponderRelease: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    })
  ).current;

  const handleSetWallpaper = async () => {
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
  };

  const onPageSelected = (e: any) => {
    setCurrentIndex(e.nativeEvent.position);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const currentActiveColor = activeSide === 'left' ? leftBubbleColor : rightBubbleColor;
  const setTargetColor = activeSide === 'left' ? setLeftBubbleColor : setRightBubbleColor;

  return (
    <View className="flex-1 bg-black">
      <PagerView
        style={StyleSheet.absoluteFill}
        initialPage={initialIndex}
        onPageSelected={onPageSelected}>
        {wallpapers.map((wp) => (
          <View key={wp.id} className="flex-1">
            {wp.url.startsWith('#') ? (
              <View style={{ backgroundColor: wp.url }} className="flex-1" />
            ) : (
              <Image source={{ uri: wp.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
            )}
            <View
              style={{ backgroundColor: 'black', opacity: dimValue * 0.95 }}
              className="absolute inset-0"
            />
          </View>
        ))}
      </PagerView>

      <View
        style={{ top: insets.top + 10 }}
        className="absolute left-6 right-6 z-20 flex-row gap-1">
        {wallpapers.map((_, i) => (
          <View
            key={i}
            className="h-1 flex-1 overflow-hidden rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <View
              className="h-full bg-white"
              style={{ width: i === currentIndex ? '100%' : '0%' }}
            />
          </View>
        ))}
      </View>

      <View
        style={{ paddingTop: insets.top + 25 }}
        className="absolute left-0 right-0 top-0 z-10 flex-row items-center justify-between px-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/10">
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>

        <Text className="text-[13px] font-semibold text-white/60">Style Preview</Text>

        <TouchableOpacity
          onPress={handleSetWallpaper}
          disabled={updateSettings.isPending}
          className="rounded-full bg-white px-6 py-2 active:opacity-80 disabled:opacity-50">
          <Text className="text-[14px] font-bold text-black">
            {updateSettings.isPending ? 'Applying...' : 'Apply'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center px-5">
        <View className="gap-5">
          <View className="self-center rounded-2xl border border-white/5 bg-[#1F1F1F] px-4 py-1.5">
            <Text className="text-[11px] font-bold text-white">Wednesday, October 23</Text>
          </View>

          <View
            style={{
              backgroundColor: leftBubbleColor,
              borderColor: activeSide === 'left' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.05)',
              borderRadius: bubbleShape === 'round' ? 24 : bubbleShape === 'soft' ? 12 : 4,
              borderTopLeftRadius: bubbleShape === 'sharp' ? 4 : 4,
            }}
            className={`max-w-[80%] self-start overflow-hidden border ${
              activeSide === 'left' ? 'scale-[1.01]' : 'scale-100'
            }`}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setActiveSide('left');
                setShowColorPicker(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="px-4 py-2.5">
              <Text
                style={{ color: leftBubbleColor === '#ffffff' ? '#000' : '#fff' }}
                className="text-[14.5px] leading-[20px]">
                Swipe to browse wallpapers, or tap here to customize my bubble color! 🎨✨
              </Text>
              <Text
                style={{ color: leftBubbleColor === '#ffffff' ? '#00000040' : '#ffffff40' }}
                className="mt-1.5 text-[9px] font-bold uppercase">
                11:04 PM
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: rightBubbleColor,
              borderColor: activeSide === 'right' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)',
              borderRadius: bubbleShape === 'round' ? 24 : bubbleShape === 'soft' ? 12 : 4,
              borderTopRightRadius: bubbleShape === 'sharp' ? 4 : 4,
            }}
            className={`max-w-[80%] self-end border ${
              activeSide === 'right' ? 'scale-[1.01]' : 'scale-100'
            }`}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setActiveSide('right');
                setShowColorPicker(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="px-4 py-2.5">
              <Text
                style={{ color: rightBubbleColor === '#ffffff' ? '#000' : '#fff' }}
                className="text-[14.5px] font-semibold leading-[20px]">
                I can customize every message now. Personalization is level 100.
              </Text>
              <View className="mt-1.5 flex-row items-center justify-end">
                <Text
                  style={{ color: rightBubbleColor === '#ffffff' ? '#00000060' : '#ffffff60' }}
                  className="mr-1.5 text-[10px] font-bold">
                  11:04 PM
                </Text>
                <Check
                  size={12}
                  color={rightBubbleColor === '#ffffff' ? '#000' : '#fff'}
                  strokeWidth={3}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View
        style={{ paddingBottom: insets.bottom + 30 }}
        className="absolute bottom-0 left-0 right-0 z-30 px-6">
        {showColorPicker && (
          <BlurView
            intensity={60}
            tint="dark"
            className="mb-4 overflow-hidden rounded-[30px] border border-white/10 p-5">
            <View className="mb-4 flex-row rounded-full bg-white/5 p-1">
              <TouchableOpacity
                onPress={() => {
                  setActiveSide('left');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className={`flex-1 flex-row items-center justify-center rounded-full py-2 ${activeSide === 'left' ? 'bg-white' : ''}`}>
                <View
                  style={{ backgroundColor: leftBubbleColor }}
                  className="mr-2 h-3 w-3 rounded-full border border-black/10"
                />
                <Text
                  className={`text-[11px] font-bold ${activeSide === 'left' ? 'text-black' : 'text-white/40'}`}>
                  Incoming
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setActiveSide('right');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className={`flex-1 flex-row items-center justify-center rounded-full py-2 ${activeSide === 'right' ? 'bg-white' : ''}`}>
                <Text
                  className={`mr-2 text-[11px] font-bold ${activeSide === 'right' ? 'text-black' : 'text-white/40'}`}>
                  Outgoing
                </Text>
                <View
                  style={{ backgroundColor: rightBubbleColor }}
                  className="h-3 w-3 rounded-full border border-black/10"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 14 }}>
              {EXTENDED_COLORS.map((color) => (
                <TouchableOpacity
                  key={`color-picker-${color}`}
                  onPress={() => {
                    setTargetColor(color);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{ backgroundColor: color }}
                  className="h-10 w-10 items-center justify-center rounded-full border border-white/20">
                  {currentActiveColor === color && (
                    <Check
                      size={18}
                      color={color === '#ffffff' ? '#000' : '#fff'}
                      strokeWidth={3}
                    />
                  )}
                </TouchableOpacity>
              ))}
              <View
                key="color-picker-plus"
                className="h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-white/20 bg-white/5">
                <Plus size={18} color="#fff" />
              </View>
            </ScrollView>
          </BlurView>
        )}

        <BlurView
          intensity={50}
          tint="dark"
          className="flex-row items-center overflow-hidden rounded-[32px] border border-white/10 p-2.5">
          <TouchableOpacity
            onPress={() => {
              setShowColorPicker(!showColorPicker);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            style={{ backgroundColor: currentActiveColor }}
            className={`h-12 w-12 items-center justify-center rounded-[22px] border border-white/20 ${showColorPicker ? 'scale-110' : 'scale-100'}`}>
            <Palette
              size={20}
              color={currentActiveColor === '#ffffff' ? '#000' : '#fff'}
              strokeWidth={2.5}
            />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center gap-4 px-6">
            <Sun size={15} color="rgba(255,255,255,0.3)" strokeWidth={2.5} />
            <View
              className="h-10 flex-1 justify-center"
              onLayout={(e) => {
                trackWidthRef.current = e.nativeEvent.layout.width;
                if (trackWidth === 0) setTrackWidth(e.nativeEvent.layout.width);
              }}
              {...panResponder.panHandlers}>
              <View pointerEvents="none" className="mx-[10px] h-[2px] rounded-full bg-white/10">
                <RNAnimated.View
                  style={{
                    width: animDim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: '#fff',
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
                    top: -8,
                    left: -9,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: '#fff',
                    borderWidth: 2,
                    borderColor: brandColor,
                  }}
                />
              </View>
            </View>
            <Sun size={18} color="#fff" strokeWidth={2.5} />
          </View>
        </BlurView>
        <Text className="mt-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          Personalization Studio
        </Text>
      </View>
    </View>
  );
}
