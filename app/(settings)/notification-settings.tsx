import React from 'react';
import { Text } from '@/components/ui/text';
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
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
  ShieldCheck,
  Music,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Switch } from '@/components/ui/switch';
import { Drawer } from '@/components/ui/drawer';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/use-user';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer } from 'expo-audio';
import { useThemeStore } from '@/store/theme-store';

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
  ({ icon: Icon, label, description, value, onToggle, brandColor, isLast = false }: any) => (
    <View
      className={`flex-row items-center justify-between py-4 ${!isLast ? 'border-b border-border/5' : ''}`}>
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
  ({ icon: Icon, label, value, onPress, brandColor, isLast = false }: any) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={`flex-row items-center justify-between py-4 ${!isLast ? 'border-b border-border/5' : ''}`}>
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
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const brandColor = useThemeStore((state) => state.accentColor);

  const { data: serverSettings, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const [localSettings, setLocalSettings] = React.useState<any>(null);
  const [isSnoozeDrawerVisible, setIsSnoozeDrawerVisible] = React.useState(false);
  const [isTimeDrawerVisible, setIsTimeDrawerVisible] = React.useState(false);
  const [editingTimeKey, setEditingTimeKey] = React.useState<
    'quiet_hours_start' | 'quiet_hours_end' | null
  >(null);
  const [currentTime, setCurrentTime] = React.useState(dayjs());
  const [isTestingSound, setIsTestingSound] = React.useState(false);
  const [hasSystemPermission, setHasSystemPermission] = React.useState<boolean | null>(null);
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

  // Sync Check: Verify system permissions on load
  React.useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setHasSystemPermission(status === 'granted');

      // If setting is ON but system is OFF, try to register
      if (localSettings?.show_notifications && status !== 'granted') {
        requestSystemPermission();
      }
    };
    if (localSettings && isMounted.current) checkPermissions();
  }, [localSettings?.show_notifications]);

  React.useEffect(() => {
    if (serverSettings && !localSettings && isMounted.current) {
      const initialized = {
        ...serverSettings,
        quiet_hours_start: serverSettings.quiet_hours_start || '22:00',
        quiet_hours_end: serverSettings.quiet_hours_end || '08:00',
      };
      setLocalSettings(initialized);
    }
  }, [serverSettings]);

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

  const requestSystemPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setHasSystemPermission(status === 'granted');
      return status === 'granted';
    } catch (e) {
      console.log('Permission Request Error:', e);
      return false;
    }
  };

  const registerPushToken = async () => {
    if (!Device.isDevice) return null;
    try {
      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;
      return token;
    } catch (error: any) {
      // Background fail - keep it quiet
      return null;
    }
  };

  const handleToggle = React.useCallback(
    async (key: string, value: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // If turning ON notifications, check system permission first
      if (key === 'show_notifications' && value) {
        const granted = await requestSystemPermission();
        if (!granted) {
          Alert.alert(
            'Permissions Required',
            'Notifications are blocked in your device settings. Please enable them to continue.',
            [{ text: 'OK' }]
          );
          // Keep local + remote state aligned with actual OS permission.
          setLocalSettings((prev: any) => ({
            ...prev,
            show_notifications: false,
            expo_push_token: null,
          }));
          updateSettings.mutate({ show_notifications: false, expo_push_token: null });
          return;
        } else {
          // If granted, try to get push token in background
          const token = await registerPushToken();
          if (token) {
            updateSettings.mutate({ [key]: value, expo_push_token: token });
            setLocalSettings((prev: any) => ({
              ...prev,
              [key]: value,
              expo_push_token: token,
            }));
            return;
          }
          setLocalSettings((prev: any) => ({ ...prev, [key]: value }));
          updateSettings.mutate({ [key]: value });
          return;
        }
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
    [localSettings, updateSettings]
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

  if (isLoading || !localSettings) {
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
        {/* Permission Warning Banner */}
        {hasSystemPermission === false && localSettings.show_notifications && (
          <View className="mx-6 mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <View className="mb-1.5 flex-row items-center">
              <ShieldCheck size={18} color="#f59e0b" strokeWidth={2.5} />
              <Text className="ml-2 text-[14px] font-bold text-amber-500">
                System Permissions Required
              </Text>
            </View>
            <Text className="mb-3 text-[12px] leading-5 text-amber-500/80">
              Notifications are disabled in your device settings. You won't receive any alerts until
              this is fixed.
            </Text>
            <TouchableOpacity
              onPress={() => requestSystemPermission()}
              className="items-center rounded-lg bg-amber-500 py-2">
              <Text className="text-[12px] font-bold text-white">Fix Permissions</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Master Toggle */}
        <View className="border-b border-border/5 px-6 py-6">
          <SettingRow
            icon={Bell}
            label="Show Notifications"
            description={
              hasSystemPermission === false
                ? '⚠️ Blocked in Device Settings'
                : hasSystemPermission === true
                  ? 'System Status: Active'
                  : 'Receive alerts for new messages'
            }
            value={localSettings.show_notifications}
            onToggle={(v: boolean) => handleToggle('show_notifications', v)}
            brandColor={brandColor}
            isLast={true}
          />
        </View>

        {/* Silence Section */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            Silence
          </Text>

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
            isLast={!localSettings.quiet_hours_enabled}
          />

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
            isLast={true}
          />
        </View>

        {/* Categories */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            Categories
          </Text>

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
            isLast={true}
          />
        </View>

        {/* In-App Behavior */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            In-App Behavior
          </Text>

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
            isLast={true}
          />
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
