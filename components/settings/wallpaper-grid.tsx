import React, { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';

interface WallpaperGridProps {
  category: string;
  items: any[];
  onPress: (index: number, category: string) => void;
  columnWidth: number;
}

export const WallpaperGrid = memo(({ category, items, onPress, columnWidth }: WallpaperGridProps) => (
  <View className="mb-8">
    <Text className="mb-4 px-6 text-[12px] font-extrabold uppercase tracking-[0.15em] text-brand opacity-80">
      {category} Wallpapers
    </Text>
    <View className="flex-row flex-wrap gap-3 px-4">
      {items.map((wp, index) => (
        <TouchableOpacity
          key={wp.id}
          activeOpacity={0.8}
          onPress={() => onPress(index, category)}
          style={{ width: columnWidth, height: columnWidth * 1.7 }}
          className="overflow-hidden rounded-[20px] border border-white/5 bg-secondary/10">
          {wp.thumbnail.startsWith('#') ? (
            <View style={{ backgroundColor: wp.thumbnail }} className="flex-1" />
          ) : (
            <Image
              source={{ uri: wp.thumbnail }}
              className="h-full w-full"
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  </View>
));
