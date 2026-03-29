import React, { memo, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icon, UserIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Haptic } from '@/lib/haptic-utils';

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

const TabButtonComponent = ({
  route,
  isFocused,
  config,
  onPress,
  brandColor,
  isDark,
  profile,
  user,
}: TabButtonProps) => {
  const focus = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focus.value = withTiming(isFocused ? 1 : 0, {
      duration: 350,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [isFocused]);

  const activeStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
    position: 'absolute',
  }));

  const inactiveStyle = useAnimatedStyle(() => ({
    opacity: 1 - focus.value,
  }));

  const handlePress = () => {
    if (!isFocused) {
      Haptic.selection();
    }
    onPress();
  };

  if (!config) return <View style={{ flex: 1 }} />;

  const { ActiveIcon, InactiveIcon } = config;
  const isAccount = route.name === 'account';

  const inactiveColor = isDark ? 'hsla(0, 0%, 100%, 0.45)' : 'hsla(0, 0%, 0%, 0.55)';

  return (
    <Pressable
      onPress={handlePress}
      className="flex-1 items-center justify-center bg-transparent p-0"
      style={{ height: '100%' }}>
      <View className="items-center justify-center">
        {isAccount && user ? (
          <View
            className={cn(
              'size-[28px] overflow-hidden rounded-full',
              isFocused ? 'bg-transparent' : 'bg-secondary'
            )}
            style={{
              borderColor: isFocused ? brandColor : 'transparent',
              borderWidth: isFocused ? 2 : 0,
            }}>
            <Avatar alt={profile?.username || 'User'} className="size-full">
              <AvatarImage source={profile?.avatar_url ? { uri: profile.avatar_url } : undefined} />
              <AvatarFallback className="flex size-full items-center justify-center bg-brand">
                <Icon as={UserIcon} size={14} color="white" />
              </AvatarFallback>
            </Avatar>
          </View>
        ) : (
          <View className="size-[26px] items-center justify-center">
            <Animated.View style={inactiveStyle}>
              {InactiveIcon && <InactiveIcon width={26} height={26} color={inactiveColor} />}
            </Animated.View>

            <Animated.View style={activeStyle}>
              {ActiveIcon && <ActiveIcon width={26} height={26} color={brandColor} />}
            </Animated.View>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export const TabButton = memo(TabButtonComponent);
