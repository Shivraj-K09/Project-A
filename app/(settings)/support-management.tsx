import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icon, UserIcon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useAppTheme } from '@/store/theme-store';
import { cn } from '@/lib/utils';
import { Radio, Clock, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { FlatList, Pressable, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { useSupportManagement, SupporterInboxItem } from '@/hooks/use-support-management';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export default function SupportManagementScreen() {
  const router = useRouter();
  const { brandColor, isDark } = useAppTheme();
  const isNavigating = useRef(false);
  const { tickets, stats, isLoading, refetch } = useSupportManagement();
  const qc = useQueryClient();

  // 🔥 INSTANT: Prefetch active ticket messages in background
  useEffect(() => {
    if (tickets.length > 0) {
      tickets.filter(t => t.status === 'active').forEach(ticket => {
        void qc.prefetchQuery({
          queryKey: ['supporter_messages', ticket.id],
          staleTime: 5 * 60 * 1000,
        });
      });
    }
  }, [tickets, qc]);

  const handlePress = (id: string) => {
    if (isNavigating.current) return;
    
    isNavigating.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    router.push({
      pathname: `/(settings)/support-management/${id}`,
      params: { title: `Ticket #${id.slice(0, 6).toUpperCase()}` }
    } as any);

    // Reset lock after a short delay to allow future navigation
    setTimeout(() => {
      isNavigating.current = false;
    }, 500);
  };

  const renderTicket = ({ item }: { item: SupporterInboxItem }) => (
    <Animated.View 
      entering={FadeInDown.springify().mass(0.8)}
      layout={Layout.springify().mass(0.8)}
      className="mx-3 my-1 flex-row items-center gap-3 rounded-2xl border border-border bg-transparent p-3"
    >
      <View className="relative">
        <Avatar 
          className={cn('h-12 w-12 border', isDark ? 'border-white/10' : 'border-brand/20')}
          alt="Support User"
        >
          <AvatarImage source={item.user.avatar_url ? { uri: item.user.avatar_url } : undefined} />
          <AvatarFallback className={isDark ? 'bg-white/5' : 'bg-brand/5'}>
            <Icon
              as={UserIcon}
              size={24}
              color={isDark ? 'rgba(255,255,255,0.3)' : brandColor + '30'}
            />
          </AvatarFallback>
        </Avatar>
        {item.status === 'active' && (
          <View
            style={{ backgroundColor: brandColor }}
            className={cn(
              'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2',
              isDark ? 'border-[#1a1b26]' : 'border-white'
            )}
          />
        )}
        {item.status === 'archived' && (
          <View
            className={cn(
              'absolute bottom-[-2px] right-[-2px] h-4.5 w-4.5 items-center justify-center rounded-full border-2 bg-blue-500',
              isDark ? 'border-[#1a1b26]' : 'border-white'
            )}
          >
            <CheckCircle2 size={10} color="white" strokeWidth={4} />
          </View>
        )}
      </View>

      <Pressable
        onPress={() => handlePress(item.id)}
        className="flex-1"
        style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}
      >
        <View className="flex-1 justify-center">
          <View className="flex-row items-center justify-between mb-0.5">
            <Text
              className={cn('font-semibold text-[15px]', isDark ? 'text-white' : 'text-foreground')}
              numberOfLines={1}
            >
              Ticket #{item.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text
              className={cn(
                'text-[11px] font-medium',
                isDark ? 'text-white/40' : 'text-muted-foreground/60'
              )}
            >
              {dayjs(item.timestamp).format('HH:mm')}
            </Text>
          </View>

          <Text
            className={cn(
               'mr-2 text-[13px] leading-4 font-medium',
               isDark ? 'text-white/60' : 'text-muted-foreground'
            )}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );

  const EmptyInbox = () => (
    <View className="flex-1 items-center justify-center pt-20 pb-10">
      <View className={cn(
        "h-20 w-20 items-center justify-center rounded-full mb-6",
        isDark ? "bg-white/5" : "bg-brand/5"
      )}>
        <ShieldCheck size={32} color={brandColor} opacity={0.4} />
      </View>
      <Text className="text-[17px] font-semibold text-foreground text-center mb-2">
        Support Queue Clear
      </Text>
      <Text className="text-[13px] font-medium text-muted-foreground/60 text-center px-12 leading-5">
        All requests have been securely archived. Your supporters are caught up!
      </Text>
    </View>
  );

  const DashboardHeader = () => (
    <View className="py-5 pb-4">
       <View className="mx-3 gap-4">
         <View className="flex-row gap-4">
           {/* ACTIVE CARD */}
           <View className={cn(
             "flex-1 p-5 rounded-2xl border border-border bg-transparent",
             isDark ? "bg-emerald-500/5" : "bg-emerald-50/30"
           )}>
             <View className="flex-row items-center justify-between mb-4">
               <Radio size={12} color={isDark ? "#10b981" : "#059669"} />
               <View className="h-1 w-6 rounded-full bg-emerald-500/20" />
             </View>
             <Animated.View layout={Layout.springify()}>
               <Text className={cn("text-3xl font-semibold", isDark ? "text-emerald-400" : "text-emerald-700")}>
                 {stats.active.toString().padStart(2, '0')}
               </Text>
             </Animated.View>
             <Text className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500 mt-2">Active</Text>
           </View>

           {/* WAIT CARD */}
           <View className={cn(
             "flex-1 p-5 rounded-2xl border border-border bg-transparent",
             isDark ? "bg-amber-500/5" : "bg-amber-50/30"
           )}>
             <View className="flex-row items-center justify-between mb-4">
               <Clock size={12} color={isDark ? "#f59e0b" : "#d97706"} />
               <View className="h-1 w-6 rounded-full bg-amber-500/20" />
             </View>
             <Animated.View layout={Layout.springify()}>
               <Text className={cn("text-3xl font-semibold", isDark ? "text-amber-400" : "text-amber-700")}>
                 {stats.pending.toString().padStart(2, '0')}
               </Text>
             </Animated.View>
             <Text className="text-[10px] font-semibold uppercase tracking-widest text-amber-500 mt-2">Pending</Text>
           </View>
         </View>

         <View className={cn(
           "p-5 rounded-2xl border border-border bg-transparent",
           isDark ? "bg-blue-500/5" : "bg-blue-50/30"
         )}>
           <View className="flex-row items-center justify-between mb-4">
             <View className="flex-row items-center">
               <CheckCircle2 size={12} color={isDark ? "#3b82f6" : "#2563eb"} />
               <Text className={cn("ml-2 text-[10px] font-semibold uppercase tracking-widest", isDark ? "text-blue-400" : "text-blue-600")}>
                 Archived Analytics
               </Text>
             </View>
             <View className="h-1 w-12 rounded-full bg-blue-500/20" />
           </View>
           <View className="flex-row items-baseline justify-between">
             <Animated.View layout={Layout.springify()}>
               <Text className={cn("text-4xl font-semibold", isDark ? "text-blue-400" : "text-blue-700")}>
                 {stats.archived}
               </Text>
             </Animated.View>
             <Text className="text-[11px] font-semibold text-blue-500/40 uppercase">Total Tickets Archived Today</Text>
           </View>
         </View>
       </View>

       <View className="mt-8 mx-4">
         <Text className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
           Support Inbox
         </Text>
       </View>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <Animated.FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={DashboardHeader}
        ListEmptyComponent={EmptyInbox}
        onRefresh={refetch}
        refreshing={isLoading}
        showsVerticalScrollIndicator={false}
        itemLayoutAnimation={Layout.springify()}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}
