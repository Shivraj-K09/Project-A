import { ChatInput } from '@/components/shared/chat-input';
import { MessageStatusIcon } from '@/components/shared/message-status-icon';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useAppTheme, useThemeStore } from '@/store/theme-store';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Loader2, ShieldCheck } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, Layout } from 'react-native-reanimated';

import { SupportMessage } from '@/hooks/support/types';
import { useSupporterChat } from '@/hooks/use-supporter-chat';

export default function SupportChatRoom() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const brandColor = useThemeStore((state) => state.accentColor);
  const { isDark } = useAppTheme();
  const bubbleShape = useThemeStore((state) => state.bubbleShape);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const { messages, sendMessage, sendImage, endChat, isLoading, session, isRecipientOnline } =
    useSupporterChat(id as string);
  const [isEndModalVisible, setIsEndModalVisible] = useState(false);

  const displayGroups = useMemo(() => {
    const groups: (SupportMessage | { type: 'date'; date: string })[] = [];

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

  return (
    <View className="flex-1 bg-background">
      {/* Session Status Row */}
      <View className="flex-row items-center justify-between border-b border-border/10 bg-background px-5 py-3">
        <View className="flex-row items-center">
          {session?.status !== 'archived' && (
            <View
              className={cn(
                'mr-2.5 h-2 w-2 rounded-full',
                isRecipientOnline ? 'animate-pulse bg-emerald-500' : 'bg-muted-foreground/30'
              )}
            />
          )}
          <Text className="text-[11px] font-black uppercase tracking-[0.1em] text-foreground/80">
            {session?.status === 'archived'
              ? 'Session Archived'
              : isRecipientOnline
                ? 'User Online'
                : 'User Offline'}
            {!isRecipientOnline &&
              session?.status !== 'archived' &&
              ` • Session ${id?.toString().slice(0, 6)}`}
          </Text>
        </View>

        {session?.status !== 'archived' ? (
          <Button
            variant="ghost"
            onPress={() => setIsEndModalVisible(true)}
            className="h-7 rounded-full bg-destructive/10 px-3 active:opacity-60"
          >
            <Text className="text-[10px] font-black uppercase tracking-widest text-destructive">
              End Chat
            </Text>
          </Button>
        ) : (
          <View className="h-7 items-center justify-center rounded-full bg-muted/30 px-3">
            <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              Archived
            </Text>
          </View>
        )}
      </View>

      <ChatInput
        value={inputText}
        onChangeText={setInputText}
        placeholder="Type securely..."
        onPlusPress={sendImage}
        disabled={session?.status === 'archived'}
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
          {/* Disclaimer */}
          <View className="mb-4 items-center opacity-30">
            <ShieldCheck size={14} color={isDark ? '#fff' : '#000'} />
            <Text className="mt-2 px-10 text-center text-[10px] font-medium uppercase leading-4 tracking-[0.05em]">
              Encrypted Messaging Active
            </Text>
          </View>

          {isLoading && messages.length === 0 && (
            <View className="py-10 items-center justify-center">
              <Loader2 size={24} color={brandColor} className="animate-spin opacity-50" />
            </View>
          )}

          {displayGroups.map((item, idx) => {
            if ('type' in item && item.type === 'date') {
              return (
                <View key={`date-${idx}`} className="my-6 items-center">
                  <View className="rounded-full bg-muted/30 px-3 py-1">
                    <Text className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
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
                        {msg.is_mine && (
                          <View className="ml-1">
                            <MessageStatusIcon
                              status={msg.status}
                              brandColor={brandColor}
                              isDark={isDark}
                              colorOnMine
                            />
                          </View>
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

                      <View className="mt-1.5 flex-row items-center justify-end">
                        <Text
                          className={cn(
                            'text-[9px] font-black uppercase tracking-tighter',
                            msg.is_mine ? 'text-white/80' : 'text-muted-foreground'
                          )}>
                          {dayjs(msg.created_at).format('h:mm A')}
                        </Text>
                        {msg.is_mine && (
                          <View className="ml-1">
                            <MessageStatusIcon
                              status={msg.status}
                              brandColor={brandColor}
                              isDark={isDark}
                              colorOnMine
                            />
                          </View>
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

      {/* Confirmation Modal */}
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
              <Text className="mb-2 text-center text-[17px] font-semibold text-foreground">
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
                className="h-[60px] w-full rounded-none border-b border-border/10 active:bg-destructive/5"
              >
                <Text className="text-[15px] font-bold text-destructive">End Session</Text>
              </Button>

              <Button
                variant="ghost"
                onPress={() => setIsEndModalVisible(false)}
                className="h-[60px] w-full rounded-none active:bg-muted/10"
              >
                <Text className="text-[14px] font-bold text-muted-foreground/60">Cancel</Text>
              </Button>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}
