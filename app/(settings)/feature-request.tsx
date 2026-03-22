import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/store/theme-store';
import { useStableNavigate } from '@/lib/use-stable-navigate';
import {
  ArrowBigDown,
  ArrowBigUp,
  CheckCircle2,
  ChevronRight,
  Layout,
  MessageSquare,
  Plus,
  Shield,
  Sparkles,
  Zap,
  Search,
  Loader2,
  X,
} from 'lucide-react-native';
import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { 
  ScrollView, 
  TouchableOpacity, 
  View, 
  TextInput, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  interpolateColor,
} from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/hooks/use-user';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';

const CATEGORY_ICONS: Record<string, any> = {
  Security: Shield,
  Messaging: MessageSquare,
  Interface: Layout,
  System: Zap,
};

export default function FeatureRequestScreen() {
  const stableNavigate = useStableNavigate();
  const insets = useSafeAreaInsets();
  const { isDark, brandColor } = useAppTheme();
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const profileRowId = profile?.id;
  const [features, setFeatures] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFeatures = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('feature_requests')
        .select(`
          *,
          feature_votes (user_id, vote_type)
        `)
        .order('vote_count', { ascending: false });

      if (error) throw error;
      setFeatures(data || []);
    } catch (err) {
      console.error('Error fetching features:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchFeatures();
  }, [fetchFeatures]);

  // Handle focus-based refresh (when coming back from Propose screen)
  useFocusEffect(
    useCallback(() => {
      fetchFeatures();
    }, [fetchFeatures])
  );

  useEffect(() => {
    // Keep subscription for live updates while on screen
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_requests' },
        () => fetchFeatures()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_votes' },
        () => fetchFeatures()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFeatures]);

  const filteredFeatures = features.filter((f) =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 32,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor={brandColor}
            colors={[brandColor]}
          />
        }>
        {/* NEW SEARCH & PROPOSE */}
        <View className="mb-10 px-6">
          <View className="mb-4 px-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-brand">Discovery</Text>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
              <View className="flex-row items-center px-4 h-11">
                <Search size={16} className="text-muted-foreground mr-2" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search roadmap..."
                  placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
                  className="flex-1 text-sm font-medium text-foreground h-full"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={14} className="text-muted-foreground" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => stableNavigate('/(settings)/propose-feature')}
              className="h-11 w-11 items-center justify-center rounded-xl bg-brand">
              <Plus size={22} color="white" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ROADMAP SECTION */}
        <View className="px-6">
          <View className="mb-6 flex-row items-center justify-between px-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-brand">
              Feature Roadmap
            </Text>
            {isLoading && <ActivityIndicator size="small" color={brandColor} />}
          </View>

          <View className="gap-12">
            {!isLoading && filteredFeatures.length === 0 ? (
              <View className="items-center py-20 opacity-40">
                <Sparkles size={40} className="text-muted-foreground mb-4" />
                <Text className="text-sm font-bold text-muted-foreground">No features found</Text>
              </View>
            ) : (
              filteredFeatures.map((item) => {
                const userVote = item.feature_votes?.find((v: any) => v.user_id === profileRowId);
                return (
                  <FeatureRow 
                    key={item.id} 
                    {...item} 
                    isOwner={item.user_id === profileRowId}
                    profileRowId={profileRowId ?? null}
                    userVoteStatus={userVote?.vote_type || null}
                  />
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const AnimatedButton = Animated.createAnimatedComponent(Button);
const AnimatedText = Animated.createAnimatedComponent(Text);

const FeatureRow = memo(
  ({
    id,
    title,
    description,
    vote_count,
    status,
    category,
    isOwner,
    profileRowId,
    userVoteStatus,
  }: any) => {
  const { isDark, brandColor } = useAppTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const Icon = CATEGORY_ICONS[category] || Sparkles;
  const isReady = status === 'completed';

  const [userVote, setUserVote] = useState<'up' | 'down' | null>(userVoteStatus);
  const [localVoteCount, setLocalVoteCount] = useState(vote_count);
  const [isVoting, setIsVoting] = useState(false);
  const lastActionTime = useRef<number>(0);

  // Sync state with props ONLY when not in the middle of a vote and cooldown passed
  useEffect(() => {
    const now = Date.now();
    if (!isVoting && (now - lastActionTime.current > 2000)) {
      setUserVote(userVoteStatus);
      setLocalVoteCount(vote_count);
    }
  }, [userVoteStatus, vote_count, isVoting]);

  // Shared values for smooth transitions
  const upProgress = useSharedValue(0);
  const downProgress = useSharedValue(0);

  useEffect(() => {
    upProgress.value = withTiming(userVote === 'up' ? 1 : 0, { duration: 300 });
    downProgress.value = withTiming(userVote === 'down' ? 1 : 0, { duration: 300 });
  }, [userVote]);

  const handleVote = useCallback(async (type: 'up' | 'down') => {
    if (!user || !profileRowId || isVoting) return;
    
    const previousVote = userVote;
    const isRemoving = previousVote === type;
    const isSwitching = previousVote !== null && !isRemoving;
    const nextVote = isRemoving ? null : type;
    
    // 1. Lock and set timing
    setIsVoting(true);
    lastActionTime.current = Date.now();

    // 2. Optimistic Update (Immediate Feedback)
    setUserVote(nextVote);
    // Note: localVoteCount will be reconciled by props or fetch if needed
    // but we can adjust it here for perceived smoothness
    let delta = 0;
    if (isRemoving) delta = type === 'up' ? -1 : 1;
    else if (isSwitching) delta = type === 'up' ? 2 : -2;
    else delta = type === 'up' ? 1 : -1;
    setLocalVoteCount((prev: number) => prev + delta);

    try {
      if (isRemoving) {
        const { error } = await supabase
          .from('feature_votes')
          .delete()
          .match({ request_id: id, user_id: profileRowId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('feature_votes')
          .upsert({
            request_id: id,
            user_id: profileRowId,
            vote_type: type
          }, { onConflict: 'request_id,user_id' });
        
        if (error) throw error;
      }
      // No more RPC calls! The DB Trigger handles the math now.
    } catch (err: any) {
      console.error('Vote Error:', err.message || err);
      // Revert if database failed
      setUserVote(userVoteStatus);
      setLocalVoteCount(vote_count);
      toast({ message: 'Voting unavailable.', variant: 'error' });
    } finally {
      // Small delay to let the DB trigger and Real-time listener finish
      setTimeout(() => setIsVoting(false), 800);
    }
  }, [user, profileRowId, id, userVote, userVoteStatus, vote_count, isVoting, toast]);

  // Theme-aware hex colors for stable interpolation
  const neutralText = isDark ? '#FFFFFF' : '#000000';
  const neutralBg = isDark ? '#1A1A1A' : '#F5F5F5';
  const neutralBorder = isDark ? '#262626' : '#E5E5E5';

  const upColor = '#10B981'; // Emerald
  const upBg = isDark ? '#064E3B' : '#D1FAE5';
  const upBorder = isDark ? '#065F46' : '#A7F3D0';

  const downColor = '#F43F5E'; // Rose
  const downBg = isDark ? '#4C0519' : '#FFE4E6';
  const downBorder = isDark ? '#881337' : '#FECDD3';

  const currentUpColor = userVote === 'up' ? upColor : neutralText;
  const currentDownColor = userVote === 'down' ? downColor : neutralText;

  const upButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(upProgress.value, [0, 1], [neutralBg, upBg]),
    borderColor: interpolateColor(upProgress.value, [0, 1], [neutralBorder, upBorder]),
  }));

  const upTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(upProgress.value, [0, 1], [neutralText, upColor]),
  }));

  const downButtonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(downProgress.value, [0, 1], [neutralBg, downBg]),
    borderColor: interpolateColor(downProgress.value, [0, 1], [neutralBorder, downBorder]),
  }));

  const downTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(downProgress.value, [0, 1], [neutralText, downColor]),
  }));

  const displayStatus = status?.replace('_', ' ') || 'Pending';
  const statusClass = isReady
    ? 'text-emerald-500'
    : status === 'in_progress'
      ? 'text-amber-500'
      : 'text-foreground';
  const dotBg = isReady
    ? 'bg-emerald-500'
    : status === 'in_progress'
      ? 'bg-amber-500'
      : 'bg-foreground';

  return (
    <View className="w-full flex-row items-start">
      {/* Category Icon */}
      <View
        className={cn(
          'mr-4 mt-1 h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          isReady ? 'bg-brand/15' : 'bg-secondary'
        )}>
        <Icon
          size={20}
          color={isReady ? brandColor : isDark ? '#9ca3af' : '#4b5563'}
          strokeWidth={2}
        />
      </View>

      {/* Main Content Area */}
      <View className="flex-1 shrink">
        <View className="mb-1 flex-row items-start justify-between">
          <View className="flex-1 mr-4">
            <Text className="text-base font-bold text-foreground" selectable={true}>
              {title}
            </Text>
          </View>
          {isOwner && (
            <Badge
              variant="secondary"
              className="mt-0.5 h-5 rounded-md border border-brand/20 bg-brand/10 px-1.5 shadow-none">
              <Text className="text-[10px] font-bold text-brand">Your Suggestion</Text>
            </Badge>
          )}
        </View>

        <Text className="mb-4 text-sm font-semibold leading-5 text-foreground" selectable={true}>
          {description}
        </Text>

        {/* Status Line */}
        <View className="mb-3 flex-row items-center">
          <View className="mr-4 flex-row items-center">
            <View className={cn('mr-1.5 h-2 w-2 rounded-full', dotBg)} />
            <Text className={cn('text-xs font-bold uppercase tracking-tight', statusClass)}>
              {displayStatus}
            </Text>
          </View>

          {isReady && (
            <View className="flex-row items-center">
              <CheckCircle2 size={12} className="mr-1 text-emerald-500" strokeWidth={3} />
              <Text className="text-xs font-bold uppercase tracking-tight text-emerald-500">
                DONE
              </Text>
            </View>
          )}
        </View>

        {/* Voting Buttons - Unified Up/Down style */}
        <View className="flex-row items-center gap-3">
          <AnimatedButton
            variant="secondary"
            size="sm"
            onPress={() => handleVote('up')}
            disabled={isVoting}
            style={upButtonStyle}
            className={cn(
              "flex-row items-center border px-0 shadow-none h-10 rounded-xl w-16 justify-center",
              isVoting && "opacity-50"
            )}>
            <ArrowBigUp 
              size={18} 
              className="mr-1.5"
              color={currentUpColor}
              fill={userVote === 'up' ? upColor : 'transparent'}
              strokeWidth={2.5} 
            />
            <AnimatedText style={upTextStyle} className="text-[14px] font-black tracking-tighter">
              {Math.max(0, localVoteCount)}
            </AnimatedText>
          </AnimatedButton>

          <AnimatedButton
            variant="secondary"
            size="sm"
            onPress={() => handleVote('down')}
            disabled={isVoting}
            style={downButtonStyle}
            className={cn(
              "flex-row items-center border px-0 shadow-none h-10 rounded-xl w-16 justify-center",
              isVoting && "opacity-50"
            )}>
            <ArrowBigDown 
              size={18} 
              className="mr-1.5"
              color={currentDownColor}
              fill={userVote === 'down' ? downColor : 'transparent'}
              strokeWidth={2.5} 
            />
            <AnimatedText style={downTextStyle} className="text-[14px] font-black tracking-tighter">
              {localVoteCount < 0 ? Math.abs(localVoteCount) : 0}
            </AnimatedText>
          </AnimatedButton>
        </View>
      </View>
    </View>
  );
});
