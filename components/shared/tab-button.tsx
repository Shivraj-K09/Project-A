import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface TabButtonProps {
  route: any;
  isFocused: boolean;
  config: any;
  onPress: () => void;
  brandColor: string;
  isDark: boolean;
  profile: any;
  user: any;
}

export const TabButton = memo(({
  route,
  isFocused,
  config,
  onPress,
  brandColor,
  isDark,
  profile,
  user,
}: TabButtonProps) => {
  if (!config) return <View className="flex-1" />;

  // Center "Floating Action" Button
  if (config.isCenter) {
    return (
      <View className="flex-1 items-center justify-start">
        <Pressable
          onPress={onPress}
          style={{ backgroundColor: brandColor }}
          className="elevation-8 absolute -top-[38px] size-[68px] items-center justify-center rounded-full shadow-lg shadow-black/20">
          <config.ActiveIcon width={32} height={32} color="#ffffff" />
        </Pressable>
      </View>
    );
  }

  // Standard Tabs
  const { ActiveIcon, InactiveIcon } = config;
  const isAccount = route.name === 'account';
  const Icon = isFocused ? ActiveIcon : InactiveIcon;

  const inactiveColor = isDark ? '#71717a' : '#a1a1aa';
  const color = isFocused ? brandColor : inactiveColor;

  return (
    <Pressable onPress={onPress} className="flex-1 items-center justify-center">
      <View className="items-center justify-center">
        {isAccount && user ? (
          <View
            className={cn(
              'size-[30px] overflow-hidden rounded-full',
              isDark ? 'bg-indigo-950' : 'bg-indigo-50',
              isFocused ? 'border-2' : 'border-0'
            )}
            style={isFocused ? { borderColor: brandColor } : undefined}>
            <Avatar
              alt={profile?.username || 'User'}
              className={cn('size-full', isFocused ? 'opacity-100' : 'opacity-80')}>
              <AvatarImage source={{ uri: profile?.avatar_url || undefined }} />
              <AvatarFallback className="flex size-full items-center justify-center bg-brand">
                <Text className="text-center text-[10px] font-bold text-white">
                  {profile?.username?.charAt(0) || 'U'}
                </Text>
              </AvatarFallback>
            </Avatar>
          </View>
        ) : (
          <Icon width={30} height={30} color={color} />
        )}
      </View>
    </Pressable>
  );
});
