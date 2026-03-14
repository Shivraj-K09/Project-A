import { cssInterop } from 'nativewind';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Lock, MapPin, Mic } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Text as RNText, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

cssInterop(Image, { className: 'style' });

const CARD_HEIGHT = 135;
const CARD_MARGIN = 8;

type ChatItem = {
  type: string;
  user: string;
  avatar: string;
  text?: string;
  image?: string;
  duration?: string;
  location?: string;
  file?: string;
  size?: string;
};

const COL_1: ChatItem[] = [
  { type: 'text', text: 'View is amazing! \u{1F3D4}\u{FE0F}', user: 'Priya', avatar: 'https://images.unsplash.com/photo-1445964047600-cdbdb873673d?q=80&w=1592&auto=format&fit=crop' },
  { type: 'image', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&q=80', user: 'Arjun', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
  { type: 'audio', duration: '0:24', user: 'Sneha', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' },
  { type: 'text', text: 'Check schedule \u{1F4C5}', user: 'Rahul', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop' },
  { type: 'location', location: 'Chai Point, MG Road', user: 'Ananya', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop' },
  { type: 'image', image: 'https://images.unsplash.com/photo-1713325802293-d80963de0d90?q=80&w=1470&auto=format&fit=crop', user: 'Dev', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  { type: 'text', text: 'On my way! \u{1F697}', user: 'Meera', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop' },
  { type: 'audio', duration: '0:12', user: 'Kiran', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
];

const COL_2: ChatItem[] = [
  { type: 'audio', duration: '1:45', user: 'Vikram', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
  { type: 'text', text: 'Lunch at 1? \u{1F354}', user: 'Riya', avatar: 'https://images.unsplash.com/photo-1762810521065-61ff659e9fb6?q=80&w=687&auto=format&fit=crop' },
  { type: 'image', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&q=80', user: 'Amit', avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop' },
  { type: 'file', file: 'Design_v3.pdf', size: '12MB', user: 'Neha', avatar: 'https://images.unsplash.com/photo-1762893021980-b6accb9b94d9?q=80&w=687&auto=format&fit=crop' },
  { type: 'text', text: 'See you in 10! \u{1F680}', user: 'Rohan', avatar: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=100&h=100&fit=crop' },
  { type: 'location', location: 'India Gate', user: 'Kavya', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop' },
  { type: 'text', text: 'No way! \u{1F92F}', user: 'Ishaan', avatar: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=100&h=100&fit=crop' },
  { type: 'image', image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=500&q=80', user: 'Aditi', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
];

const ChatBubble = React.memo(({ item, isDark }: { item: ChatItem; isDark: boolean }) => {
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textMain = isDark ? '#e4e4e7' : '#27272a';
  const textMuted = isDark ? '#71717a' : '#a1a1aa';
  const innerBg = isDark ? '#2A2A2A' : '#f4f4f5';

  return (
    <View style={{ height: CARD_HEIGHT }} className="w-full">
      <View
        style={{
          height: CARD_HEIGHT - CARD_MARGIN,
          backgroundColor: cardBg,
          borderColor: cardBorder,
          borderWidth: 1,
        }}
        className="w-full justify-center overflow-hidden rounded-[18px] shadow-sm">
        <View className="gap-2 px-3">
          <View className="flex-row items-center gap-2.5">
            <Image
              source={{ uri: item.avatar }}
              className="h-5 w-5 rounded-full"
              style={{ backgroundColor: isDark ? '#27272a' : '#e4e4e7', borderWidth: 1, borderColor: cardBorder }}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            <RNText numberOfLines={1} style={{ color: textMain }} className="flex-1 text-[10px] font-bold tracking-wide opacity-90">
              {item.user}
            </RNText>
            <View className="flex-row items-center gap-1 opacity-80">
              <Lock size={8} color={textMuted} />
              <RNText style={{ color: textMuted }} className="text-[8px] font-medium">Now</RNText>
            </View>
          </View>
          <View>
            {item.type === 'text' && (
              <RNText numberOfLines={3} style={{ color: textMain }} className="text-[13px] leading-5">
                {item.text}
              </RNText>
            )}
            {item.type === 'audio' && (
              <View style={{ backgroundColor: innerBg }} className="flex-row items-center gap-3 rounded-xl p-2">
                <View style={{ backgroundColor: isDark ? '#fff' : '#18181b' }} className="h-6 w-6 items-center justify-center rounded-full">
                  <Mic size={10} color={isDark ? '#000' : '#fff'} />
                </View>
                <View className="flex-1 gap-1">
                  <View style={{ backgroundColor: isDark ? '#3f3f46' : '#d4d4d8' }} className="h-1 w-full rounded-full">
                    <View style={{ backgroundColor: isDark ? '#fff' : '#18181b' }} className="h-full w-[40%] rounded-full" />
                  </View>
                  <View className="flex-row justify-between pr-1">
                    <RNText style={{ color: textMuted }} className="text-[8px]">Voice</RNText>
                    <RNText style={{ color: textMuted }} className="text-[8px]">{item.duration}</RNText>
                  </View>
                </View>
              </View>
            )}
            {item.type === 'image' && (
              <View style={{ backgroundColor: isDark ? '#27272a' : '#e4e4e7' }} className="h-20 w-full overflow-hidden rounded-lg">
                <Image source={{ uri: item.image }} className="h-full w-full" contentFit="cover" transition={200} cachePolicy="memory-disk" />
              </View>
            )}
            {item.type === 'location' && (
              <View style={{ backgroundColor: innerBg }} className="flex-row items-center gap-3 rounded-xl p-2">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-green-900/40">
                  <MapPin size={10} color="#4ade80" />
                </View>
                <View>
                  <RNText style={{ color: textMain }} className="text-[10px] font-bold">Location</RNText>
                  <RNText style={{ color: textMuted }} className="text-[8px]">{item.location}</RNText>
                </View>
              </View>
            )}
            {item.type === 'file' && (
              <View style={{ backgroundColor: innerBg }} className="flex-row items-center gap-3 rounded-xl p-2">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-brand/40">
                  <FileText size={10} color="#818cf8" />
                </View>
                <View>
                  <RNText style={{ color: textMain }} className="text-[10px] font-bold">{item.file}</RNText>
                  <RNText style={{ color: textMuted }} className="text-[8px]">{item.size}</RNText>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});

function MarqueeColumn({ data, reverse = false, isDark }: { data: ChatItem[]; reverse?: boolean; isDark: boolean }) {
  const totalHeight = data.length * CARD_HEIGHT;
  const duration = 60000;
  const translateY = useSharedValue(reverse ? -totalHeight : 0);

  React.useEffect(() => {
    translateY.value = reverse ? -totalHeight : 0;
    translateY.value = withRepeat(
      withTiming(reverse ? 0 : -totalHeight, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, [translateY, totalHeight, duration, reverse]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const copies = React.useMemo(() => {
    const result: React.ReactElement[] = [];
    for (let j = 0; j < 4; j++) {
      data.forEach((item, i) => {
        result.push(<ChatBubble key={`${j}-${i}`} item={item} isDark={isDark} />);
      });
    }
    return result;
  }, [data, isDark]);

  return (
    <View className="flex-1 overflow-hidden">
      <Animated.View style={animatedStyle}>{copies}</Animated.View>
    </View>
  );
}

type ChatMarqueeBackgroundProps = {
  isDark: boolean;
  insetTop: number;
  opacity?: number;
  animated?: boolean;
  bottomGradientRatio?: number;
};

export function ChatMarqueeBackground({
  isDark,
  insetTop,
  opacity,
  animated = true,
  bottomGradientRatio = 0.55,
}: ChatMarqueeBackgroundProps) {
  const { height: screenHeight } = Dimensions.get('window');
  const bg = isDark ? '#0a0a0a' : '#ffffff';
  const bgTransparent = isDark ? 'rgba(10,10,10,0)' : 'rgba(255,255,255,0)';
  const marqueeOpacity = opacity ?? (isDark ? 0.5 : 0.45);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Animated.View
        entering={animated ? FadeIn.duration(600) : undefined}
        style={{
          flex: 1,
          flexDirection: 'row',
          gap: 8,
          overflow: 'hidden',
          paddingHorizontal: 8,
          marginTop: insetTop,
          opacity: marqueeOpacity,
        }}>
        <View style={{ flex: 1, marginTop: -80 }}>
          <MarqueeColumn data={COL_1} isDark={isDark} />
        </View>
        <View style={{ flex: 1, marginTop: -240 }}>
          <MarqueeColumn data={COL_2} reverse isDark={isDark} />
        </View>
      </Animated.View>

      <LinearGradient
        colors={[bg, isDark ? 'rgba(10,10,10,0.8)' : 'rgba(255,255,255,0.8)', bgTransparent]}
        locations={[0, 0.4, 1]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insetTop + 80,
        }}
      />

      <LinearGradient
        colors={[bgTransparent, bg, bg]}
        locations={[0, 0.35, 1]}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: screenHeight * bottomGradientRatio,
        }}
      />
    </View>
  );
}
