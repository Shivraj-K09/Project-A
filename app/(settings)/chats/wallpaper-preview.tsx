import { Text } from '@/components/ui/text';
import { WALLPAPERS } from '@/lib/wallpapers';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Check, ChevronLeft, Palette, Plus, Sun } from 'lucide-react-native';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWallpaperPreview } from '@/hooks/use-wallpaper-preview';
import { DimmingSlider } from '@/components/ui/dimming-slider';
import { MessageBubble } from '@/components/settings/message-bubble';

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
  const {
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
  } = useWallpaperPreview();

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
          onPress={() => handleSetWallpaper()}
          className="h-10 w-10 items-center justify-center rounded-full bg-black/10">
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>

        <Text className="text-[13px] font-semibold text-white/60">Style Preview</Text>

        <TouchableOpacity
          onPress={handleSetWallpaper}
          disabled={updateSettings.isPending}
          className="rounded-full bg-white px-6 py-2 active:opacity-80 disabled:opacity-50">
          <Text className="font-semibol text-[14px] text-black">
            {updateSettings.isPending ? 'Applying...' : 'Apply'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 justify-center px-5">
        <View className="gap-5">
          <View className="self-center rounded-2xl border border-white/5 bg-[#1F1F1F] px-4 py-1.5">
            <Text className="font-semibol text-[11px] text-white">Wednesday, October 23</Text>
          </View>

          <MessageBubble
            side="left"
            active={activeSide === 'left'}
            color={leftBubbleColor}
            onPress={() => {
              setActiveSide('left');
              setShowColorPicker(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            text="Swipe to browse wallpapers, or tap here to customize my bubble color! 🎨✨"
            time="11:04 PM"
          />

          <MessageBubble
            side="right"
            active={activeSide === 'right'}
            color={rightBubbleColor}
            onPress={() => {
              setActiveSide('right');
              setShowColorPicker(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            text="I can customize every message now. Personalization is level 100."
            time="11:04 PM"
          />
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
                  className={`font-semibol text-[11px] ${activeSide === 'left' ? 'text-black' : 'text-white/40'}`}>
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
                  className={`font-semibol mr-2 text-[11px] ${activeSide === 'right' ? 'text-black' : 'text-white/40'}`}>
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
            onPress={toggleColorPicker}
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
            <DimmingSlider value={dimValue} onValueChange={setDimValue} brandColor="#ffffff" />
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
