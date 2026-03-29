import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon, UserIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Chat } from '@/lib/demo-data';
import { Haptic } from '@/lib/haptic-utils';
import { SearchMatch } from '@/lib/search-utils';
import React from 'react';
import { Keyboard, Pressable, View } from 'react-native';

interface ContactItemProps {
  item: Chat;
  onInvite?: (id: string) => void;
  onPress?: (id: string) => void;
  onAvatarPress?: (item: Chat) => void;
  searchQuery?: string;
  match?: SearchMatch;
}

export const ContactItem = React.memo(
  ({ item, onInvite, onPress, onAvatarPress, searchQuery, match }: ContactItemProps) => {
    const handlePress = () => {
      Haptic.selection();
      onPress?.(item.id);
    };

    const handleAvatarPress = () => {
      Keyboard.dismiss();
      Haptic.selection();
      onAvatarPress?.(item);
    };

    const renderHighlightedName = () => {
      const name = item.name;
      if (!match?.indices || match.indices.length === 0) {
        return <Text>{name}</Text>;
      }

      const parts: React.ReactNode[] = [];
      let lastIndex = 0;

      match.indices.forEach(([start, end], i) => {
        // Add text before the match
        if (start > lastIndex) {
          parts.push(
            <Text key={`text-${lastIndex}`} className="text-foreground">
              {name.substring(lastIndex, start)}
            </Text>
          );
        }
        // Add highlighted match
        parts.push(
          <Text key={`match-${start}`} className="text-brand font-black">
            {name.substring(start, end)}
          </Text>
        );
        lastIndex = end;
      });

      // Add remaining text
      if (lastIndex < name.length) {
        parts.push(
          <Text key={`text-${lastIndex}`} className="text-foreground">
            {name.substring(lastIndex)}
          </Text>
        );
      }

      return parts;
    };

    return (
      <View className="mx-3 my-0.5 flex-row items-center gap-3 rounded-2xl border border-border bg-transparent p-2.5">
        <Pressable
          onPress={handleAvatarPress}
          hitSlop={15}
          className="relative active:opacity-90"
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
          <Avatar className="h-12 w-12 border border-border/50" alt={item.name}>
            <AvatarImage source={item.avatar ? { uri: item.avatar } : undefined} />
            <AvatarFallback className="bg-brand">
              <Icon as={UserIcon} size={24} className="text-white/70" />
            </AvatarFallback>
          </Avatar>
          {item.isOnline && (
            <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-brand" />
          )}
        </Pressable>

        <Pressable
          onPress={handlePress}
          className="flex-1 flex-row items-center justify-between active:opacity-80"
          style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}>
          <View className="flex-1 justify-center">
            <Text className="font-semibol text-[15px] text-foreground" numberOfLines={1}>
              {renderHighlightedName()}
            </Text>
            <Text className="text-[12px] text-muted-foreground/70" numberOfLines={1}>
              {item.canInvite ? 'Not on the platform yet' : (item.about || 'Available on Social Media')}
            </Text>
          </View>

          <View className="ml-2">
            {item.canInvite ? (
              <Button
                size="sm"
                className="h-8 rounded-full bg-brand px-5 shadow-sm active:bg-brand/80 active:opacity-90"
                onPress={() => onInvite?.(item.id)}>
                <Text className="font-semibol text-[12px] text-white">Invite</Text>
              </Button>
            ) : (
              item.isJoinedNew && (
                <View className="flex-row items-center gap-1.5 px-2">
                  <View className="h-1.5 w-1.5 rounded-full bg-brand" />
                  <Text className="text-[11px] font-black uppercase tracking-[1px] text-brand">
                    New
                  </Text>
                </View>
              )
            )}
          </View>
        </Pressable>
      </View>
    );
  }
);
