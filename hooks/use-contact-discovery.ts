import { useState, useCallback, useEffect, useMemo } from 'react';
import * as Contacts from 'expo-contacts';
import { resolveAvatarUrl } from '@/lib/avatar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { normalizePhoneNumber, chunkArray } from '@/lib/contact-utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chat } from '@/lib/demo-data';
import * as Haptics from 'expo-haptics';
import { Haptic } from '@/lib/haptic-utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const CONTACTS_CACHE_KEY = 'cached_discovered_contacts_v2';
const SYNC_TIMESTAMP_KEY = 'last_contacts_sync_timestamp';
const SYNC_COOLDOWN = 1 * 60 * 60 * 1000; // Reduced to 1 hour for testing

export const contactKeys = {
  all: ['contacts'] as const,
  discovered: (userId: string) => [...contactKeys.all, 'discovered', userId] as const,
};

// Track sync status globally per app session to prevent constant loading on every page view
const sessionSyncStatus = {
  hasSyncedThisSession: false,
};

export function useContactDiscovery() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [permissionStatus, setPermissionStatus] = useState<Contacts.PermissionStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    AsyncStorage.removeItem(CONTACTS_CACHE_KEY).catch(() => {});
  }, []);

  // Keep discovered contacts in memory only. We do not persist the matched graph
  // or phone-linked results to AsyncStorage.
  const query = useQuery<Chat[]>({
    queryKey: contactKeys.discovered(user?.id || 'anon'),
    queryFn: async () => {
      return [] as Chat[];
    },
    // We keep data 'fresh' significantly longer now to avoid constant refetching
    staleTime: 30 * 60 * 1000, // 30 mins
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: !!user,
  });

  // The sync mutation: Direct Action (Updates cache and triggers UI updates)
  const syncMutation = useMutation({
    mutationFn: async (force: boolean = false) => {
      try {
        if (!user) return query.data || [];

        // 1. Check if we actually need a sync (to avoid 'loading screen' fatigue)
        if (!force && sessionSyncStatus.hasSyncedThisSession && query.data && query.data.length > 0) {
          return query.data;
        }

        // 2. Permissions
        const { status } = await Contacts.requestPermissionsAsync();
        setPermissionStatus(status);
        if (status !== 'granted') return query.data || [];

        // 3. Fetch (Optimized including device images)
        const { data: phoneContacts } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
        });
        if (!phoneContacts.length) {
          sessionSyncStatus.hasSyncedThisSession = true;
          return [];
        }

        // 4. Transform and Match logic
        const allNormalized: string[] = [];
        const phoneToContact = new Map<string, Contacts.Contact>();
        const seenPhones = new Set<string>();
        for (const contact of phoneContacts) {
          if (!contact.phoneNumbers) continue;
          for (const phone of contact.phoneNumbers) {
            const normalized = normalizePhoneNumber(phone.number || '');
            if (normalized && !seenPhones.has(normalized)) {
              allNormalized.push(normalized);
              seenPhones.add(normalized);
              phoneToContact.set(normalized, contact);
            }
          }
        }

        // 5. Supabase Matching
        const batches = chunkArray(allNormalized, 100);
        const matchedUsers: Chat[] = [];
        const matchedPhones = new Set<string>();

        // Pre-calculate clean digits for local contacts for faster lookup
        const digitsToContact = new Map<string, Contacts.Contact>();
        phoneToContact.forEach((contact, norm) => {
          const digits = norm.replace(/\D/g, '');
          if (digits.length >= 10) {
            digitsToContact.set(digits.slice(-10), contact);
          }
        });

        for (const batch of batches) {
          const { data: matches, error } = await supabase.rpc('sync_contacts', {
            contact_numbers: batch,
          });
          if (!error && matches) {
            for (const m of matches) {
              const mDigits = m.phone.replace(/\D/g, '');
              const deviceContact = phoneToContact.get(m.phone) || (mDigits.length >= 10 ? digitsToContact.get(mDigits.slice(-10)) : null);
              
              matchedUsers.push({
                id: m.user_id,
                name: deviceContact?.name || m.full_name,
                avatar:
                  m.avatar ||
                  (deviceContact?.imageAvailable && deviceContact?.image?.uri) ||
                  undefined,
                lastMessage: '',
                time: '',
                unreadCount: 0,
                isOnline: false,
                isJoinedNew: m.is_new,
                canInvite: false,
                about: m.about || 'Available on Social Media',
                phoneNumber: m.phone, // Store real number
              });
              
              // Key: Store both normalized and last 10 digits to prevent duplicates in invite list
              matchedPhones.add(m.phone);
              if (mDigits.length >= 10) matchedPhones.add(mDigits.slice(-10));
            }
          }
        }

        // 6. Build the final sorted list
        const inviteList: Chat[] = [];
        const seenNames = new Set<string>();
        for (const contact of phoneContacts) {
          const isMatched = contact.phoneNumbers?.some((p) => {
            const norm = normalizePhoneNumber(p.number || '');
            const digits = norm.replace(/\D/g, '');
            return (norm && matchedPhones.has(norm)) || (digits.length >= 10 && matchedPhones.has(digits.slice(-10)));
          });

          if (!isMatched && !seenNames.has(contact.name) && contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            const originalNumber = contact.phoneNumbers[0].number;
            inviteList.push({
              id: contact.id || contact.name,
              name: contact.name,
              avatar:
                contact.imageAvailable && contact.image?.uri ? contact.image.uri : undefined,
              lastMessage: '',
              time: '',
              unreadCount: 0,
              isOnline: false,
              canInvite: true,
              phoneNumber: originalNumber, // Store real original number for SMS
            });
            seenNames.add(contact.name);
          }
        }

        const sortedResult = [...matchedUsers, ...inviteList].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );

        // 7. Persist only the sync timestamp, not the discovered contact graph itself.
        AsyncStorage.setItem(SYNC_TIMESTAMP_KEY, Date.now().toString()).catch((e) => {
          if (__DEV__) console.error(e);
        });

        // Mark session as complete so we don't spam the user with loading screens on every page navigation
        sessionSyncStatus.hasSyncedThisSession = true;

        return await Promise.all(
          sortedResult.map(async (contact) => ({
            ...contact,
            avatar: (await resolveAvatarUrl(contact.avatar)) ?? undefined,
          }))
        );
      } catch (err) {
        if (__DEV__) console.error('[Discovery] Sync error:', err);
        return query.data || [];
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(contactKeys.discovered(user?.id || 'anon'), data);
    },
  });

  const syncContacts = useCallback(
    async (force: boolean = false) => {
      // 1. Skip if already syncing
      if (isRefreshing || syncMutation.isPending) return;

      // 2. Check Persisted Last Sync Time (24 Hour Rule)
      if (!force) {
        try {
          const lastSyncStr = await AsyncStorage.getItem(SYNC_TIMESTAMP_KEY);
          if (lastSyncStr) {
            const lastSync = parseInt(lastSyncStr, 10);
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            
            // If less than 24 hours have passed AND we have data, skip
            if (now - lastSync < oneDay && query.data?.length) {
              if (__DEV__) console.log('[Sync] Skipping auto-sync: Last sync was less than 24h ago');
              return;
            }
          }
        } catch (e) {
          if (__DEV__) console.error('[Sync] Error checking persistence:', e);
        }
      }

      setIsRefreshing(true);
      try {
        await syncMutation.mutateAsync(force);
      } finally {
        setIsRefreshing(false);
      }
    },
    [syncMutation, query.data, isRefreshing]
  );

  const contacts = query.data || [];

  return {
    contacts,
    isLoading: query.isPending && query.isFetching && contacts.length === 0,
    isSyncing: syncMutation.isPending || isRefreshing,
    syncContacts,
    permissionStatus,
  };
}
