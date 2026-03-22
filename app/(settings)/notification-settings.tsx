import React from 'react';
import { Text } from '@/components/ui/text';
import { View, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  MessageSquare,
  Users,
  Phone,
  Volume2,
  Vibrate,
  Eye,
  Heart,
  Moon,
  Clock,
  ChevronRight,
  Music,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Switch } from '@/components/ui/switch';
import { Drawer } from '@/components/ui/drawer';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { isDevice } from 'expo-device';
import Constants from 'expo-constants';
import {
  getActiveUsersRowIdForAuth,
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/hooks/use-user';
import { useAuth } from '@/contexts/auth-context';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer } from 'expo-audio';
import { useThemeStore } from '@/store/theme-store';
import { SETTINGS_MENU_LIST_CLASS, cnSettingsMenuCard } from '@/lib/settings-ui';

// ─── Constants ──────────────────────────────────────────────

const SNOOZE_OPTIONS = [
  { label: '30 Minutes', value: 30 },
  { label: '1 Hour', value: 60 },
  { label: '8 Hours', value: 480 },
  { label: '24 Hours', value: 1440 },
  { label: 'Until Tomorrow', value: -1 }, // Custom logic
];

const TIME_OPTIONS = [
  '00:00',
  '01:00',
  '02:00',
  '03:00',
  '04:00',
  '05:00',
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];

// ─── Helper Components ──────────────────────────────────────

const SettingRow = React.memo(
  ({ icon: Icon, label, description, value, onToggle, brandColor }: any) => (
    <View className={cnSettingsMenuCard('flex-row items-center justify-between')}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onToggle(!value)}
        className="mr-4 flex-1 flex-row items-center">
        <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
          <Icon size={18} color={brandColor} strokeWidth={2} />
        </View>
        <View className="flex-1">
          <Text className="text-[16px] font-semibold text-foreground">{label}</Text>
          {description && (
            <Text className="mt-0.5 text-[12px] leading-5 text-muted-foreground">
              {description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <Switch checked={value} onCheckedChange={onToggle} />
    </View>
  )
);

const NavigationRow = React.memo(
  ({ icon: Icon, label, value, onPress, brandColor }: any) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={cnSettingsMenuCard('flex-row items-center justify-between')}>
      <View className="mr-4 flex-1 flex-row items-center">
        <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
          <Icon size={18} color={brandColor} strokeWidth={2} />
        </View>
        <View className="flex-1">
          <Text className="text-[16px] font-semibold text-foreground">{label}</Text>
        </View>
      </View>
      <View className="flex-row items-center">
        {value && (
          <Text
            className={`mr-2 text-[13px] font-bold ${
              value.includes('Active') ||
              value.includes('minutes') ||
              value.includes('Ready') ||
              value.includes('soon') ||
              value.includes('Testing')
                ? 'text-brand'
                : 'text-muted-foreground/60'
            }`}>
            {value}
          </Text>
        )}
        <ChevronRight size={16} color="#71717a" strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  )
);

const formatTime = (timeStr: string) => {
  if (!timeStr || typeof timeStr !== 'string') return '--:--';
  const parts = timeStr.split(':');
  if (parts.length < 2) return '--:--';
  const [h, m] = parts;
  return dayjs().set('hour', parseInt(h)).set('minute', parseInt(m)).format('h:mm A');
};

const normalizeTime = (timeStr: string) => {
  if (!timeStr) return '';
  // Convert HH:mm:ss or HH:mm to HH:mm
  return timeStr.split(':').slice(0, 2).join(':');
};

const getQuietDuration = (start: string, end: string) => {
  if (!start || !end) return '';
  const s = dayjs()
    .hour(parseInt(start.split(':')[0]))
    .minute(parseInt(start.split(':')[1]));
  let e = dayjs()
    .hour(parseInt(end.split(':')[0]))
    .minute(parseInt(end.split(':')[1]));

  if (e.isBefore(s) || e.isSame(s)) {
    e = e.add(1, 'day');
  }

  const diffHours = e.diff(s, 'hour');
  const isOvernight = e.date() !== s.date();
  return `${diffHours}h${isOvernight ? ' overnight' : ''}`;
};

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const brandColor = useThemeStore((state) => state.accentColor);
  const { user } = useAuth();

  const { data: serverSettings, isLoading, isFetching, isError } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const [localSettings, setLocalSettings] = React.useState<any>(null);
  const [isSnoozeDrawerVisible, setIsSnoozeDrawerVisible] = React.useState(false);
  const [isTimeDrawerVisible, setIsTimeDrawerVisible] = React.useState(false);
  const [editingTimeKey, setEditingTimeKey] = React.useState<
    'quiet_hours_start' | 'quiet_hours_end' | null
  >(null);
  const [currentTime, setCurrentTime] = React.useState(dayjs());
  const [isTestingSound, setIsTestingSound] = React.useState(false);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const testPlayer = useAudioPlayer(
    'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
  );

  // Keep testing state in sync with player
  React.useEffect(() => {
    // If the player stops playing, ensure we update our state
    if (!testPlayer.playing) {
      setIsTestingSound(false);
    }
  }, [testPlayer.playing]);

  // Keep time fresh for live countdowns
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 30000);
    return () => clearInterval(timer);
  }, []);

  const registerPushToken = React.useCallback(async (): Promise<string | null> => {
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
  }, []);

  // Initialize local state when the query finishes: either from the row or defaults (no row / RLS fixed).
  React.useEffect(() => {
    if (!isMounted.current || isLoading || isFetching || localSettings) return;

    if (serverSettings) {
      setLocalSettings({
        ...serverSettings,
        show_notifications: serverSettings.show_notifications ?? true,
        quiet_hours_start: serverSettings.quiet_hours_start || '22:00',
        quiet_hours_end: serverSettings.quiet_hours_end || '08:00',
      });
      return;
    }

    let cancelled = false;
    (async () => {
      let profileId: string | null = null;
      try {
        profileId = user?.id ? await getActiveUsersRowIdForAuth(user.id) : null;
      } catch {
        profileId = null;
      }
      if (cancelled || !isMounted.current) return;
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
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, isFetching, serverSettings, localSettings, user?.id]);

  const playTestSound = async () => {
    if (testPlayer.playing || isTestingSound) return;

    try {
      setIsTestingSound(true);
      testPlayer.seekTo(0);
      testPlayer.play();

      // Safety fallback: If for some reason the player doesn't trigger 'playing' state
      // or gets stuck, reset after 3 seconds.
      setTimeout(() => {
        setIsTestingSound(false);
      }, 3000);
    } catch (error) {
      console.log('Error triggering test sound:', error);
      setIsTestingSound(false);
    }
  };

  const handleToggle = React.useCallback(
    async (key: string, value: boolean) => {
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

      // If enabling quiet hours, ensure we have times
      if (key === 'quiet_hours_enabled' && value) {
        const payload: any = { [key]: value };
        if (!localSettings.quiet_hours_start) payload.quiet_hours_start = '22:00';
        if (!localSettings.quiet_hours_end) payload.quiet_hours_end = '08:00';

        setLocalSettings((prev: any) => ({ ...prev, ...payload }));
        updateSettings.mutate(payload);
        return;
      }

      // If enabling In-App Sounds, play a test sound
      if (key === 'in_app_sounds' && value) {
        playTestSound();
      }

      updateSettings.mutate({ [key]: value });
    },
    [localSettings, registerPushToken, updateSettings]
  );

  const handleSnooze = (minutes: number) => {
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
    setIsSnoozeDrawerVisible(false);
  };

  const handleTimeSelect = (time: string) => {
    if (!editingTimeKey) return;

    // Validation: Start and End cannot be the same
    const otherKey =
      editingTimeKey === 'quiet_hours_start' ? 'quiet_hours_end' : 'quiet_hours_start';
    if (normalizeTime(localSettings[otherKey]) === normalizeTime(time)) {
      Alert.alert('Invalid Time', 'Start and end times cannot be the same.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalSettings((prev: any) => ({ ...prev, [editingTimeKey]: time }));
    updateSettings.mutate({ [editingTimeKey]: time });
    setIsTimeDrawerVisible(false);
    setEditingTimeKey(null);
  };

  if ((isLoading && !isError) || !localSettings) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="small" color={brandColor} />
      </View>
    );
  }

  const getMuteStatus = () => {
    if (!localSettings?.mute_until) return 'Not Active';
    const until = dayjs(localSettings.mute_until);
    const now = dayjs();

    if (until.isBefore(now)) return 'Not Active';

    const minutesLeft = until.diff(now, 'minute');

    if (minutesLeft < 1) return 'Ending now';
    if (minutesLeft === 1) return '1 minute left';
    if (minutesLeft < 60) return `${minutesLeft} minutes left`;

    return `Until ${until.format('h:mm A')}`;
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <View className="border-b border-border/5 px-6 py-6">
          <View className={SETTINGS_MENU_LIST_CLASS}>
            <SettingRow
              icon={Bell}
              label="Show Notifications"
              description="Receive alerts for new messages"
              value={localSettings.show_notifications}
              onToggle={(v: boolean) => handleToggle('show_notifications', v)}
              brandColor={brandColor}
            />
          </View>
        </View>

        {/* Silence Section */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            Silence
          </Text>

          <View className={SETTINGS_MENU_LIST_CLASS}>
            <NavigationRow
              icon={Clock}
              label="Snooze Alerts"
              value={getMuteStatus()}
              onPress={() => setIsSnoozeDrawerVisible(true)}
              brandColor={brandColor}
            />

            <SettingRow
              icon={Moon}
              label="Quiet Hours"
              description="Automatically silence alerts during night."
              value={localSettings.quiet_hours_enabled}
              onToggle={(v: boolean) => handleToggle('quiet_hours_enabled', v)}
              brandColor={brandColor}
            />
          </View>

          {localSettings.quiet_hours_enabled && (
            <View>
              <View className="mt-2 flex-row items-center justify-between rounded-2xl bg-muted/30 p-4">
                <View className="flex-row items-center">
                  <Clock size={16} color={brandColor} strokeWidth={2} />
                  <Text className="ml-3 text-[14px] font-medium text-foreground">Everyday</Text>
                </View>
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => {
                      setEditingTimeKey('quiet_hours_start');
                      setIsTimeDrawerVisible(true);
                    }}
                    className="mr-2 rounded-lg bg-brand/10 px-3 py-1.5">
                    <Text className="text-[13px] font-bold text-brand">
                      {formatTime(localSettings.quiet_hours_start)}
                    </Text>
                  </TouchableOpacity>
                  <Text className="mr-2 text-muted-foreground">-</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingTimeKey('quiet_hours_end');
                      setIsTimeDrawerVisible(true);
                    }}
                    className="rounded-lg bg-brand/10 px-3 py-1.5">
                    <Text className="text-[13px] font-bold text-brand">
                      {formatTime(localSettings.quiet_hours_end)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text className="mt-2 px-1 text-right text-[11px] font-medium uppercase tracking-[0.5px] text-muted-foreground/60">
                Silencing alerts for{' '}
                {getQuietDuration(localSettings.quiet_hours_start, localSettings.quiet_hours_end)}
              </Text>
            </View>
          )}
        </View>

        {/* Message Notifications */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            Messages
          </Text>

          <View className={SETTINGS_MENU_LIST_CLASS}>
            <SettingRow
              icon={Eye}
              label="Show Previews"
              description="Display message text in notifications."
              value={localSettings.show_previews}
              onToggle={(v: boolean) => handleToggle('show_previews', v)}
              brandColor={brandColor}
            />

            <SettingRow
              icon={Heart}
              label="Reaction Notifications"
              description="Notify when someone reacts to your message."
              value={localSettings.reaction_notifications}
              onToggle={(v: boolean) => handleToggle('reaction_notifications', v)}
              brandColor={brandColor}
            />
          </View>
        </View>

        {/* Categories */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            Categories
          </Text>

          <View className={SETTINGS_MENU_LIST_CLASS}>
            <SettingRow
              icon={Users}
              label="Group Notifications"
              description="Manage alerts for group conversations."
              value={localSettings.group_notifications}
              onToggle={(v: boolean) => handleToggle('group_notifications', v)}
              brandColor={brandColor}
            />

            <SettingRow
              icon={Phone}
              label="Call Notifications"
              description="Alerts for incoming voice and video calls."
              value={localSettings.call_notifications}
              onToggle={(v: boolean) => handleToggle('call_notifications', v)}
              brandColor={brandColor}
            />
          </View>
        </View>

        {/* In-App Behavior */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            In-App Behavior
          </Text>

          <View className={SETTINGS_MENU_LIST_CLASS}>
            <SettingRow
              icon={Volume2}
              label="In-App Sounds"
              description="Play sounds for incoming events while in app."
              value={localSettings.in_app_sounds}
              onToggle={(v: boolean) => handleToggle('in_app_sounds', v)}
              brandColor={brandColor}
            />

            <NavigationRow
              icon={Music}
              label="Play Test Sound"
              value={isTestingSound ? 'Testing...' : 'Ready'}
              onPress={playTestSound}
              brandColor={brandColor}
            />

            <SettingRow
              icon={Vibrate}
              label="In-App Vibrate"
              description="Vibration feedback for in-app events."
              value={localSettings.in_app_vibrate}
              onToggle={(v: boolean) => handleToggle('in_app_vibrate', v)}
              brandColor={brandColor}
            />
          </View>
        </View>

        {/* Security Info */}
        <View className="items-center px-10 py-8">
          <Text className="text-center text-[11.5px] font-medium leading-5 text-muted-foreground/50">
            Your privacy is protected. Notification content is filtered according to your preference
            and delivered via encrypted channels.
          </Text>
        </View>
      </ScrollView>

      {/* Snooze Drawer */}
      <Drawer visible={isSnoozeDrawerVisible} onClose={() => setIsSnoozeDrawerVisible(false)}>
        <View className="mb-6 items-center">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
            <Clock size={28} color={brandColor} strokeWidth={2} />
          </View>
          <Text className="text-xl font-bold text-foreground">Snooze Alerts</Text>
          <Text className="mt-2 px-6 text-center text-sm text-muted-foreground">
            Temporarily pause notifications to stay focused.
          </Text>
        </View>

        <View className="mb-6">
          {localSettings.mute_until && dayjs(localSettings.mute_until).isAfter(dayjs()) && (
            <>
              <TouchableOpacity
                onPress={() => handleSnooze(0)}
                className="mb-4 flex-row items-center justify-between rounded-2xl bg-brand/10 p-4 active:bg-brand/20">
                <View className="flex-row items-center">
                  <Bell size={18} color={brandColor} strokeWidth={2.5} />
                  <Text className="ml-3 font-bold text-brand">End Snooze</Text>
                </View>
                <Text className="text-[11px] font-bold uppercase tracking-wider text-brand/60">
                  Active
                </Text>
              </TouchableOpacity>
              <View className="mb-4 h-[1px] w-full bg-border/40" />
            </>
          )}

          {SNOOZE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleSnooze(option.value)}
              className="mb-3 flex-row items-center justify-between rounded-2xl bg-secondary/50 p-4 active:bg-secondary">
              <Text className="text-[15px] font-semibold text-foreground">{option.label}</Text>
              <ChevronRight size={16} color="#71717a" strokeWidth={2.5} />
            </TouchableOpacity>
          ))}
        </View>
      </Drawer>

      {/* Time Picker Drawer for Quiet Hours */}
      <Drawer visible={isTimeDrawerVisible} onClose={() => setIsTimeDrawerVisible(false)}>
        <Text className="mb-6 text-center text-xl font-bold text-foreground">
          Select {editingTimeKey === 'quiet_hours_start' ? 'Start' : 'End'} Time
        </Text>
        <View className="relative">
          <ScrollView
            className="max-h-[400px]"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="flex-row flex-wrap justify-between">
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  onPress={() => handleTimeSelect(time)}
                  className={`mb-3 h-14 w-[48%] items-center justify-center rounded-2xl ${
                    normalizeTime(localSettings?.[editingTimeKey!]) === time
                      ? 'bg-brand'
                      : 'bg-muted/40'
                  }`}>
                  <Text
                    className={`font-bold ${
                      normalizeTime(localSettings?.[editingTimeKey!]) === time
                        ? 'text-white'
                        : 'text-foreground'
                    }`}>
                    {formatTime(time)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Scroll Hint Gradient */}
          <LinearGradient
            colors={['transparent', isDark ? '#18181b' : '#ffffff']}
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
            style={{ opacity: 0.8 }}
          />
        </View>
      </Drawer>
    </View>
  );
}
