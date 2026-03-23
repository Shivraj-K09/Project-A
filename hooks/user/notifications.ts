import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getActiveUsersRowIdForAuth, userKeys } from './profile';
import React from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { isDevice } from 'expo-device';
import * as Haptics from 'expo-haptics';
import dayjs from 'dayjs';

// ─── Base Hooks (Domain Layer) ─────────────────────────────

export interface NotificationSettings {
  user_id: string;
  show_notifications: boolean;
  show_previews: boolean;
  reaction_notifications: boolean;
  group_notifications: boolean;
  call_notifications: boolean;
  in_app_sounds: boolean;
  in_app_vibrate: boolean;
  expo_push_token: string | null;
  mute_until: string | null;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export function useNotificationSettings() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...userKeys.profile(user?.id ?? ''), 'notifications'],
    queryFn: async () => {
      const profileId = await getActiveUsersRowIdForAuth(user!.id);
      if (!profileId) return null;
      
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();

      if (error) throw error;
      return data as NotificationSettings | null;
    },
    enabled: isAuthenticated && !!user?.id,
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      const profileId = await getActiveUsersRowIdForAuth(user!.id);
      if (!profileId) throw new Error('No active profile');

      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({ ...settings, user_id: profileId }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (user?.id) {
        qc.setQueryData([...userKeys.profile(user.id), 'notifications'], data);
      }
    },
  });
}

// ─── High-Level Logic Hook (Feature Layer) ───────────────────

export function useNotificationLogic() {
  const { user } = useAuth();
  const { data: serverSettings, isLoading, isFetching } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  
  const [localSettings, setLocalSettings] = React.useState<any>(null);

  const lastSyncedRef = React.useRef<string | null>(null);

  // Initialize local state from server data or defaults
  React.useEffect(() => {
    if (isLoading || isFetching) return;

    // SCALING RESOLUTION: Allow background updates to flow into local state
    // but only if the data has actually changed to avoid re-render loops.
    const serverId = serverSettings ? JSON.stringify(serverSettings) : 'default';
    
    if (serverId === lastSyncedRef.current && localSettings) return;

    if (serverSettings) {
      setLocalSettings({
        ...serverSettings,
        show_notifications: serverSettings.show_notifications ?? true,
        quiet_hours_start: serverSettings.quiet_hours_start || '22:00',
        quiet_hours_end: serverSettings.quiet_hours_end || '08:00',
      });
      lastSyncedRef.current = serverId;
      return;
    }

    if (!localSettings) {
      // Default Fallback
      (async () => {
        const profileId = user?.id ? await getActiveUsersRowIdForAuth(user.id).catch(() => null) : null;
        setLocalSettings({
          user_id: profileId ?? '',
          show_notifications: true,
          show_previews: true,
          reaction_notifications: true,
          group_notifications: true,
          call_notifications: true,
          in_app_sounds: true,
          in_app_vibrate: true,
          expo_push_token: null,
          mute_until: null,
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
        });
        lastSyncedRef.current = 'default';
      })();
    }
  }, [isLoading, isFetching, serverSettings, user?.id]);

  const registerPushToken = async (): Promise<string | null> => {
    if (!isDevice) return null;
    try {
      return (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;
    } catch {
      return null;
    }
  };

  const toggleSetting = async (key: string, value: boolean, onSfx?: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === 'show_notifications') {
      setLocalSettings((prev: any) => ({
        ...prev,
        show_notifications: value,
        ...(value ? {} : { expo_push_token: null }),
      }));
      
      if (value) {
        const token = await registerPushToken();
        updateSettings.mutate({
          show_notifications: true,
          ...(token ? { expo_push_token: token } : {}),
        });
      } else {
        updateSettings.mutate({ show_notifications: false, expo_push_token: null });
      }
      return;
    }

    setLocalSettings((prev: any) => ({ ...prev, [key]: value }));

    if (key === 'quiet_hours_enabled' && value) {
      const payload: any = { [key]: value };
      if (!localSettings.quiet_hours_start) payload.quiet_hours_start = '22:00';
      if (!localSettings.quiet_hours_end) payload.quiet_hours_end = '08:00';
      setLocalSettings((prev: any) => ({ ...prev, ...payload }));
      updateSettings.mutate(payload);
      return;
    }

    if (key === 'in_app_sounds' && value && onSfx) {
      onSfx();
    }

    updateSettings.mutate({ [key]: value });
  };

  const snoozeAlerts = (minutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let untilDate;

    if (minutes === 0) {
      untilDate = null;
    } else if (minutes === -1) {
      untilDate = dayjs().add(1, 'day').startOf('day').toISOString();
    } else {
      untilDate = dayjs().add(minutes, 'minute').toISOString();
    }

    setLocalSettings((prev: any) => ({ ...prev, mute_until: untilDate }));
    updateSettings.mutate({ mute_until: untilDate });
  };

  const updateQuietTime = (key: 'quiet_hours_start' | 'quiet_hours_end', time: string) => {
    setLocalSettings((prev: any) => ({ ...prev, [key]: time }));
    updateSettings.mutate({ [key]: time });
  };

  return {
    localSettings,
    isLoading: isLoading || !localSettings,
    toggleSetting,
    snoozeAlerts,
    updateQuietTime,
    isUpdating: updateSettings.isPending,
  };
}
