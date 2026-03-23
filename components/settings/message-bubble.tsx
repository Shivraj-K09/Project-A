import React, { memo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Check } from 'lucide-react-native';
import { useThemeStore } from '@/store/theme-store';

interface MessageBubbleProps {
  side: 'left' | 'right';
  active: boolean;
  color: string;
  onPress: () => void;
  text: string;
  time: string;
}

export const MessageBubble = memo(({ side, active, color, onPress, text, time }: MessageBubbleProps) => {
  const { bubbleShape } = useThemeStore();
  
  const isRound = bubbleShape === 'round';
  const isSoft = bubbleShape === 'soft';
  const isSharp = bubbleShape === 'sharp';

  const borderRadius = isRound ? 24 : isSoft ? 12 : 4;
  const isWhite = color.toLowerCase() === '#ffffff' || color.toLowerCase() === 'white';

  return (
    <View
      style={{
        backgroundColor: color,
        borderColor: active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.05)',
        borderRadius,
        borderTopLeftRadius: side === 'left' && isSharp ? 4 : borderRadius,
        borderTopRightRadius: side === 'right' && isSharp ? 4 : borderRadius,
      }}
      className={`max-w-[80%] ${side === 'left' ? 'self-start' : 'self-end'} overflow-hidden border ${
        active ? 'scale-[1.01]' : 'scale-100'
      }`}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} className="px-4 py-2.5">
        <Text
          style={{ color: isWhite ? '#000' : '#fff' }}
          className={`text-[14.5px] leading-[20px] ${side === 'right' ? 'font-semibold' : ''}`}>
          {text}
        </Text>
        <View className={`mt-1.5 flex-row items-center ${side === 'left' ? '' : 'justify-end'}`}>
          <Text
            style={{ color: isWhite ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}
            className={`text-[9px] font-bold uppercase ${side === 'right' ? 'mr-1.5 text-[10px]' : ''}`}>
            {time}
          </Text>
          {side === 'right' && (
            <Check size={12} color={isWhite ? '#000' : '#fff'} strokeWidth={3} />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
});
