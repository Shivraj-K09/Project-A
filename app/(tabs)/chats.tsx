import { ChatItem } from '@/components/chat/chat-item';
import { Header } from '@/components/shared/header';
import { ChatPlusIcon, ScanCodeIcon } from '@/components/shared/icons';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { DEMO_DATA } from '@/lib/demo-data';
import { useAppTheme } from '@/store/theme-store';
import { useMemo, useState } from 'react';
import { FlatList, Keyboard, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { brandColor, isDark } = useAppTheme();
  const [search, setSearch] = useState('');

  const filteredChats = useMemo(() => {
    if (!search.trim()) return DEMO_DATA;
    return DEMO_DATA.filter(
      (chat) =>
        chat.name.toLowerCase().includes(search.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const rightIcons = (
    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
      <ScanCodeIcon color={brandColor} />
    </Button>
  );

  return (
    <Pressable className="flex-1" onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-background">
        <Header
          title="Chats"
          onSearch={setSearch}
          searchValue={search}
          searchPlaceholder="Search conversations..."
          rightElement={rightIcons}
        />

        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatItem item={item} />}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View className="items-center px-10 py-12">
              <View className="mb-3 h-8 w-8 items-center justify-center rounded-full bg-muted/20">
                <Icon as={Lock} size={14} className="text-muted-foreground/60" />
              </View>
              <Text className="font-semibol mb-2 text-[11px] uppercase tracking-[1.5px] text-muted-foreground/60">
                End-to-end encrypted
              </Text>
              <Text className="text-center text-[11px] leading-4 text-muted-foreground/40">
                Your personal messages and calls are encrypted. No one outside of this chat, not
                even Social Media, can read or listen to them.
              </Text>
            </View>
          }
          contentContainerStyle={{
            paddingBottom: insets.bottom + 100,
            paddingTop: 10,
          }}
          keyboardShouldPersistTaps="handled"
        />

        {/* Floating Action Button */}
        <View
          className="absolute shadow-lg shadow-brand/40"
          style={{
            bottom: insets.bottom + 100,
            right: 16,
            zIndex: 50,
          }}>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-brand active:bg-brand/80"
            style={{ elevation: 5 }}
            onPress={() => router.push('/new-chat')}>
            <ChatPlusIcon color="white" width={24} height={24} />
          </Button>
        </View>
      </View>
    </Pressable>
  );
}
