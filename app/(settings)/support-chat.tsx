import { Text } from '@/components/ui/text';
import { useAppTheme, useThemeStore } from '@/store/theme-store';
import { cn } from '@/lib/utils';
import { Check, ShieldCheck, Loader2 } from 'lucide-react-native';
import { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/components/shared/chat-input';
import Animated, {
  useAnimatedKeyboard,
  Layout,
  FadeIn,
  FadeInDown,
  FadeOut,
} from 'react-native-reanimated';
import { useSupportChat, SupportMessage } from '@/hooks/use-support-chat';
import dayjs from 'dayjs';
import { Image } from 'expo-image';

export default function SupportChatScreen() {
  const brandColor = useThemeStore((state) => state.accentColor);
  const { isDark } = useAppTheme();
  const bubbleShape = useThemeStore((state) => state.bubbleShape);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const { messages, sendMessage, sendImage, endChat, isLoading, session } = useSupportChat();
  const keyboard = useAnimatedKeyboard();
  const [isEndModalVisible, setIsEndModalVisible] = useState(false);

  // Process messages to inject Date Headers and the Permanent Welcome Message
  const displayGroups = useMemo(() => {
    const groups: (SupportMessage | { type: 'date'; date: string })[] = [];

    // Always include a system welcome at top
    groups.push({
      id: 'welcome_permanent',
      text: 'How can we help today? Our security team is ready to assist in this E2EE tunnel.',
      sender_id: 'system',
      created_at: session?.created_at || new Date().toISOString(),
      is_mine: false,
    } as SupportMessage);

    let lastDate = '';
    messages.forEach((msg) => {
      const msgDate = dayjs(msg.created_at).format('MMMM D, YYYY');
      if (msgDate !== lastDate) {
        groups.push({
          type: 'date',
          date: msgDate === dayjs().format('MMMM D, YYYY') ? 'Today' : msgDate,
        } as any);
        lastDate = msgDate;
      }
      groups.push(msg);
    });

    return groups;
  }, [messages, session?.created_at]);

  const getBubbleStyle = (isMine: boolean, isImage: boolean) => {
    const isRound = bubbleShape === 'round';
    const isSoft = bubbleShape === 'soft';
    const radius = isRound ? 22 : isSoft ? 14 : 6;

    return {
      borderRadius: radius,
      borderBottomLeftRadius: !isMine ? 4 : radius,
      borderBottomRightRadius: isMine ? 4 : radius,
      backgroundColor: isImage
        ? 'transparent'
        : isMine
          ? brandColor
          : isDark
            ? '#262626'
            : '#F1F5F9',
      padding: isImage ? 2 : 0,
    };
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Loader2 size={28} color={brandColor} className="animate-spin" />
        <Text className="mt-5 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Initializing Secure Tunnel
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header Info */}
      <View className="flex-row items-center justify-between border-b border-border/50 bg-background px-5 py-3.5">
        <View className="flex-row items-center">
          <View className="mr-2.5 h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <Text className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80">
            Secure Session {session?.id.slice(0, 6)}
          </Text>
        </View>

        {session && (
          <TouchableOpacity
            onPress={() => setIsEndModalVisible(true)}
            className="rounded-full bg-destructive/5 px-3 py-1 active:opacity-70">
            <Text className="text-[10px] font-black uppercase tracking-widest text-destructive">
              End Chat
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ChatInput
        value={inputText}
        onChangeText={setInputText}
        placeholder="Type securely..."
        onPlusPress={sendImage}
        onSend={() => {
          if (!inputText.trim()) return;
          sendMessage(inputText);
          setInputText('');
        }}>
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}>
          {/* E2EE Disclaimer */}
          <View className="mb-8 items-center opacity-40">
            <ShieldCheck size={14} color={isDark ? '#fff' : '#000'} />
            <Text className="mt-2 px-10 text-center text-[10px] font-medium uppercase leading-4 tracking-[0.05em]">
              Encrypted Messaging Active
            </Text>
          </View>

          {displayGroups.map((item, idx) => {
            if ('type' in item && item.type === 'date') {
              return (
                <View key={`date-${idx}`} className="my-6 items-center">
                  <View className="rounded-full bg-muted/30 px-3 py-1">
                    <Text className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {item.date}
                    </Text>
                  </View>
                </View>
              );
            }

            const msg = item as SupportMessage;
            const isImage = msg.message_type === 'image';

            return (
              <Animated.View
                key={msg.id}
                layout={Layout.springify().mass(0.8)}
                entering={FadeInDown.springify().delay(idx * 10)}
                className={cn('mb-1.5 flex-row', msg.is_mine ? 'justify-end' : 'justify-start')}>
                <View
                  style={getBubbleStyle(msg.is_mine, isImage)}
                  className={cn(
                    'max-w-[82%] overflow-hidden shadow-sm',
                    !isImage && 'px-4 py-3',
                    !msg.is_mine && !isImage && 'border border-border/10'
                  )}>
                  {isImage ? (
                    <View className="relative">
                      <Image
                        source={{ uri: msg.imageUrl }}
                        className="h-64 w-64 rounded-2xl"
                        contentFit="cover"
                        transition={200}
                      />
                      {msg.status === 'pending' && (
                        <View className="absolute inset-0 items-center justify-center rounded-2xl bg-black/30">
                          <Loader2 size={24} color="#fff" className="animate-spin" />
                        </View>
                      )}

                      {/* Overlay time for images */}
                      <View className="absolute bottom-2 right-2 flex-row items-center rounded-md bg-black/40 px-1.5 py-0.5">
                        <Text className="text-[9px] font-black uppercase tracking-tighter text-white/90">
                          {dayjs(msg.created_at).format('h:mm A')}
                        </Text>
                        {msg.is_mine && msg.status === 'sent' && (
                          <Check size={10} color="#fff" strokeWidth={3} className="ml-1" />
                        )}
                      </View>
                    </View>
                  ) : (
                    <>
                      <Text
                        className={cn(
                          'text-[15px] leading-[22px]',
                          msg.is_mine ? 'font-medium text-white' : 'font-medium text-foreground'
                        )}>
                        {msg.text}
                      </Text>
                      <View className="mt-1.5 flex-row items-center justify-end opacity-60">
                        <Text
                          className={cn(
                            'text-[9px] font-black uppercase tracking-tighter',
                            msg.is_mine ? 'text-white/80' : 'text-muted-foreground'
                          )}>
                          {dayjs(msg.created_at).format('h:mm A')}
                        </Text>
                        {msg.is_mine && msg.status === 'sent' && (
                          <Check size={10} color="#fff" strokeWidth={3} className="ml-1" />
                        )}
                      </View>
                    </>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </ScrollView>
      </ChatInput>

      {/* 🛡️ Minimalist End Chat Confirmation */}
      {isEndModalVisible && (
        <View className="absolute inset-0 z-50 items-center justify-center p-6">
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="absolute inset-0 bg-black/40"
            onTouchStart={() => setIsEndModalVisible(false)}
          />

          <Animated.View
            entering={FadeIn.duration(300)}
            className="w-full max-w-[320px] overflow-hidden rounded-[28px] border border-border/20 bg-background shadow-2xl">
            <View className="items-center p-8">
              <Text className="mb-2 text-center text-[17px] font-bold text-foreground">
                End Support Session?
              </Text>
              <Text className="text-center text-[13px] font-medium leading-[18px] text-muted-foreground opacity-70">
                This will archive the chat locally and secure the message tunnel.
              </Text>
            </View>

            <View className="border-t border-border/10">
              <Button
                variant="ghost"
                onPress={() => {
                  setIsEndModalVisible(false);
                  endChat();
                }}
                className="h-[56px] w-full rounded-none border-b border-border/10">
                <Text className="text-[15px] font-bold text-destructive">End Session</Text>
              </Button>

              <Button
                variant="ghost"
                onPress={() => setIsEndModalVisible(false)}
                className="h-[56px] w-full rounded-none">
                <Text className="text-[14px] font-semibold text-foreground/50">Cancel</Text>
              </Button>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}
