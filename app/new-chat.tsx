import { Header } from '@/components/shared/header';
import { ContactProfileModal } from '@/components/chat/contact-profile-modal';
import { ContactItem } from '@/components/chat/contact-item';
import { ContactListSkeleton } from '@/components/chat/contact-skeleton';
import { InviteDrawer } from '@/components/chat/invite-drawer';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Chat } from '@/lib/demo-data';
import { smartSearch, SearchResult } from '@/lib/search-utils';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, useDeferredValue } from 'react';
import { SectionList, RefreshControl, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, Users, RotateCw, Search } from 'lucide-react-native';
import { useContactDiscovery } from '@/hooks/use-contact-discovery';
import * as Haptics from 'expo-haptics';
import { Haptic } from '@/lib/haptic-utils';

export default function NewChatScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [inviteUser, setInviteUser] = useState<Chat | null>(null);
  const [profileUser, setProfileUser] = useState<Chat | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const { contacts, isLoading, isSyncing, syncContacts, permissionStatus } = useContactDiscovery();

  // React 19 Magic: Keeps typing at 60fps while list updates in background
  const deferredSearch = useDeferredValue(search);

  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isSyncing) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
      cancelAnimation(rotation);
    }
  }, [isSyncing, rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const filteredUsers = useMemo(() => {
    if (!deferredSearch.trim()) return contacts.map((item) => ({ item }));
    return smartSearch(contacts, deferredSearch);
  }, [deferredSearch, contacts]);

  const handleInvite = useCallback(
    (id: string) => {
      const user = contacts.find((u: Chat) => u.id === id);
      if (user) {
        Haptic.selection();
        setInviteUser(user);
        setDrawerVisible(true);
      }
    },
    [contacts]
  );

  const handleShowProfile = useCallback((user: Chat) => {
    setProfileUser(user);
  }, []);

  const handleRefresh = useCallback(() => {
    Haptic.selection();
    syncContacts(true);
  }, [syncContacts]);

  const renderEmpty = () => {
    if ((isLoading || isSyncing) && contacts.length === 0) return <ContactListSkeleton />;

    // 1. Search Empty State (No matches found)
    if (search.trim() !== '' && filteredUsers.length === 0) {
      return (
        <View className="flex-1 items-center justify-center p-10 pt-20">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-muted/20">
            <Icon as={Search} size={40} className="text-muted-foreground/30" />
          </View>
          <Text className="font-semibol mb-1 text-center text-xl">No results for "{search}"</Text>
          <Text className="text-center text-muted-foreground">
            Check the spelling or try searching for someone else.
          </Text>
        </View>
      );
    }

    if (permissionStatus === 'denied') {
      return (
        <View className="flex-1 items-center justify-center p-10">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-muted/40">
            <Icon as={Users} size={32} className="text-muted-foreground/60" />
          </View>
          <Text className="font-semibol mb-2 text-center text-lg">Contacts Permission Denied</Text>
          <Text className="mb-6 text-center text-muted-foreground">
            To find which of your friends are using the app, we need permission to read your
            contacts.
          </Text>
          <Button onPress={() => syncContacts(true)} className="rounded-full px-8">
            <Text className="font-semibol">Grant Access</Text>
          </Button>
        </View>
      );
    }

    if (!isLoading && !isSyncing && contacts.length === 0) {
      return (
        <View className="flex-1 items-center justify-center p-10 pb-40">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-muted/10">
            <Icon as={Users} size={48} className="text-muted-foreground/20" />
          </View>
          <Text className="font-semibol mb-2 text-center text-2xl">Find your friends</Text>
          <Text className="mb-8 px-4 text-center leading-5 text-muted-foreground/80">
            Sync your contacts to see who else is on Social Media and start chatting with them
            instantly.
          </Text>
          <Button
            onPress={() => syncContacts(true)}
            className="h-14 rounded-full bg-brand px-10 shadow-lg shadow-brand/20 active:opacity-80">
            <Text className="text-lg font-bold text-white">Sync Contacts</Text>
          </Button>
        </View>
      );
    }

    return null;
  };

  const renderItem = useCallback(
    ({ item: searchResult }: { item: SearchResult<Chat> }) => (
      <ContactItem
        item={searchResult.item}
        match={searchResult.match}
        searchQuery={deferredSearch}
        onInvite={handleInvite}
        onPress={(id) => {
          if (__DEV__) console.log('Press User:', id);
        }}
        onAvatarPress={handleShowProfile}
      />
    ),
    [handleInvite, handleShowProfile, deferredSearch]
  );

  const sections = useMemo(() => {
    const registered = filteredUsers.filter((u) => !u.item.canInvite);
    const notRegistered = filteredUsers.filter((u) => u.item.canInvite);

    const result = [];
    if (registered.length > 0) {
      result.push({ title: 'Available on Social Media', data: registered, isRegistered: true });
    }
    if (notRegistered.length > 0) {
      result.push({ title: 'Invite to Social Media', data: notRegistered, isRegistered: false });
    }
    return result;
  }, [filteredUsers]);

  const renderSectionHeader = useCallback(({ section }: { section: any }) => {
    // Hide the top header forever to keep the list stable during search
    if (section.isRegistered) return null;

    return (
      <View className="bg-background px-6 py-3">
        <Text className="text-[11px] font-semibold uppercase text-muted-foreground">
          {section.title}
        </Text>
      </View>
    );
  }, []);

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <Header
        title="New Chat"
        showBackButton={true}
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search for people..."
        rightElement={
          <Button
            variant="ghost"
            size="icon"
            onPress={handleRefresh}
            className="h-10 w-10 rounded-full active:bg-muted">
            <Animated.View style={spinStyle}>
              <Icon as={RotateCw} size={20} className="text-brand" />
            </Animated.View>
          </Button>
        }
      />
      <SectionList
        sections={sections}
        keyExtractor={(item: SearchResult<Chat>) => item.item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // Performance Overhaul for 1000+ Items
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl refreshing={isSyncing} onRefresh={handleRefresh} tintColor="#6366f1" />
        }
        ListHeaderComponent={
          contacts.length > 0 ? (
            <View className="h-10 flex-row items-center px-6">
              <Text className="text-[13px] text-muted-foreground/50">
                {search.trim() !== '' ? (
                  <>
                    Found{' '}
                    <Text className="font-semibol text-sm text-brand">{filteredUsers.length}</Text>
                    {filteredUsers.length === 1 ? ' match' : ' matches'}
                  </>
                ) : (
                  <>
                    Total Contacts:{' '}
                    <Text className="font-semibol text-sm text-brand">{contacts.length}</Text>
                  </>
                )}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={
          contacts.length > 0 ? (
            <View className="items-center px-10 py-12">
              <View className="mb-3 h-8 w-8 items-center justify-center rounded-full bg-muted/20">
                <Icon as={Lock} size={14} className="text-muted-foreground/60" />
              </View>
              <Text className="font-semibol mb-2 text-[11px] uppercase tracking-[0.5px] text-muted-foreground/60">
                End-to-end encrypted
              </Text>
              <Text className="text-center text-[11px] leading-4 text-muted-foreground/40">
                Your personal contacts are always encrypted. Social Media cannot read your private
                identity.
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
          flexGrow: 1,
        }}
      />

      <InviteDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        user={inviteUser}
        onInvite={(id, message) => {
          setDrawerVisible(false);
          Haptic.notification(Haptics.NotificationFeedbackType.Success);
        }}
      />

      <ContactProfileModal
        visible={!!profileUser}
        onClose={() => setProfileUser(null)}
        user={profileUser}
        onInvite={handleInvite}
      />
    </View>
  );
}
