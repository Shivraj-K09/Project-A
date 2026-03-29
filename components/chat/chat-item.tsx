import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icon, UserIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Chat } from '@/lib/demo-data';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/store/theme-store';
import * as Haptics from 'expo-haptics';
import { Check, CheckCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

interface ChatItemProps {
  item: Chat;
  onPress?: () => void;
}

export function ChatItem({ item, onPress }: ChatItemProps) {
  const [showActions, setShowActions] = useState(false);
  const isNavigating = React.useRef(false);
  const { brandColor, isDark } = useAppTheme();

  const handlePress = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();

    // Reset interaction flag after a short delay
    setTimeout(() => {
      isNavigating.current = false;
    }, 200);
  };

  const handleAvatarPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowActions(true);
  };

  return (
    <View className="mx-3 my-0.5 flex-row items-center gap-3 rounded-2xl border border-border bg-transparent p-2.5">
      <Pressable onPress={handleAvatarPress} className="relative">
        <Avatar
          className={cn('h-12 w-12 border', isDark ? 'border-white/10' : 'border-brand/20')}
          alt={item.name}>
          <AvatarImage source={{ uri: item.avatar }} />
          <AvatarFallback className={isDark ? 'bg-white/5' : 'bg-brand/5'}>
            <Icon
              as={UserIcon}
              size={24}
              color={isDark ? 'rgba(255,255,255,0.3)' : brandColor + '30'}
            />
          </AvatarFallback>
        </Avatar>
        {item.isOnline && (
          <View
            style={{ backgroundColor: brandColor }}
            className={cn(
              'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2',
              isDark ? 'border-[#1a1b26]' : 'border-white'
            )}
          />
        )}
      </Pressable>

      <Pressable
        onPress={handlePress}
        className="flex-1 active:opacity-80"
        style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}>
        <View className="flex-1 justify-center">
          <View className="mb-0.5 flex-row items-center justify-between">
            <Text
              className={cn('font-semibol text-[15px]', isDark ? 'text-white' : 'text-foreground')}
              numberOfLines={1}>
              {item.name}
            </Text>
            <Text
              className={cn(
                'text-[11px] font-medium',
                isDark ? 'text-white/40' : 'text-muted-foreground/60'
              )}>
              {item.time}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text
              className={cn(
                'mr-2 flex-1 text-[13px] leading-5',
                item.isTyping
                  ? 'font-semibold text-brand'
                  : isDark
                    ? 'text-white/60'
                    : 'text-muted-foreground',
                item.unreadCount > 0 ? 'font-medium' : ''
              )}
              style={item.unreadCount > 0 ? { color: isDark ? 'white' : 'black' } : undefined}
              numberOfLines={1}>
              {item.isTyping ? 'Typing...' : item.lastMessage}
            </Text>

            <View className="flex-row items-center gap-1">
              {item.unreadCount > 0 ? (
                <View
                  style={{ backgroundColor: brandColor }}
                  className="h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 shadow-sm">
                  <Text className="font-semibol text-[10px] text-white">
                    {item.unreadCount}
                  </Text>
                </View>
              ) : (
                item.status && (
                  <View>
                    {item.status === 'read' ? (
                      <Icon as={CheckCheck} size={16} color={brandColor} />
                    ) : item.status === 'delivered' ? (
                      <Icon
                        as={CheckCheck}
                        size={16}
                        color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}
                      />
                    ) : (
                      <Icon
                        as={Check}
                        size={16}
                        color={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}
                      />
                    )}
                  </View>
                )
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
