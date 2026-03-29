import React from 'react';
import { Button } from '@/components/ui/button';
import { Icon, UserIcon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ChevronLeftIcon, Search } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/store/theme-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type HeaderProps = {
  title?: string;
  icon?: any;
  avatar?: string;
  iconColor?: string;
  rightElement?: React.ReactNode;
  showBackButton?: boolean;
  onSearch?: (text: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  small?: boolean;
};

/**
 * Custom header component with title and theme toggle
 */
export function Header({
  title = 'Acme',
  icon,
  avatar,
  iconColor,
  rightElement,
  showBackButton = false,
  onSearch,
  searchPlaceholder,
  searchValue,
  small = false,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { brandColor, isDark } = useAppTheme();

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const firstLetter = typeof title === 'string' ? title.charAt(0).toUpperCase() : '';
  const restOfTitle = typeof title === 'string' ? title.slice(1) : title;

  return (
    <View
      className="z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{ paddingTop: insets.top + (small ? 8 : 10) }}>
      <View className={cn(small ? "h-[42px]" : "h-11", "flex-row items-center justify-between px-4 pb-2")}>
        <View className="flex-1 flex-row items-center">
          {showBackButton && (
            <Button
              onPress={handleBackPress}
              size="icon"
              variant="ghost"
              className={cn(small ? "size-8" : "ios:size-9", "-ml-2 mr-1 rounded-full")}>
              <Icon as={ChevronLeftIcon} size={small ? 22 : 24} className="text-foreground" />
            </Button>
          )}

          {avatar ? (
            <Avatar
              className={cn(small ? "h-7 w-7 mr-2.5" : "h-8 w-8 mr-3", "border border-border bg-brand")}
              alt={typeof title === 'string' ? title : 'User Avatar'}>
              <AvatarImage source={{ uri: avatar }} />
              <AvatarFallback className="bg-brand">
                <Icon as={UserIcon} size={small ? 14 : 16} />
              </AvatarFallback>
            </Avatar>
          ) : (
            icon && (
              <View className={cn(small ? "h-7 w-7 mr-2.5" : "h-8 w-8 mr-3", "items-center justify-center rounded-lg bg-brand/10")}>
                <Icon as={icon} size={small ? 16 : 18} color={iconColor || brandColor} strokeWidth={2.5} />
              </View>
            )
          )}

          <Text 
            className={cn(
              "font-semibold tracking-tight text-foreground",
              small ? "text-[19px]" : "text-2xl"
            )} 
            numberOfLines={1}
          >
            {typeof title === 'string' ? (
              <>
                <Text className={cn("font-semibold text-brand", small ? "text-[19px]" : "text-2xl")}>{firstLetter}</Text>
                {restOfTitle}
              </>
            ) : (
              title
            )}
          </Text>
        </View>
        {rightElement && <View className="flex-row items-center gap-1">{rightElement}</View>}
      </View>
      {onSearch && (
        <View className="px-3 pb-3">
          <View className="relative">
            <View className="absolute left-3 z-10 h-full items-center justify-center">
              <Icon as={Search} size={16} color={brandColor} />
            </View>
            <Input
              className="h-12 rounded-xl border border-none border-border !bg-transparent pl-10 text-base"
              placeholder={searchPlaceholder || 'Search...'}
              onChangeText={onSearch}
              value={searchValue}
              placeholderTextColor="#a1a1aa"
              cursorColor={brandColor}
              selectionColor={brandColor + '40'}
            />
          </View>
        </View>
      )}
    </View>
  );
}
