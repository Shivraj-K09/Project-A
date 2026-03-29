import { Drawer } from '@/components/ui/drawer';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/auth-context';
import { getActiveUsersRowIdForAuth } from '@/hooks/use-user';
import { useNotificationLogic } from '@/hooks/user/notifications';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsGroup, cnSettingsMenuItem } from '@/lib/settings-ui';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/store/theme-store';
import { useThemeStore } from '@/store/theme-store';
import dayjs from 'dayjs';
import { useAudioPlayer } from 'expo-audio';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { Haptic } from '@/lib/haptic-utils';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  Moon,
  Music,
  Phone,
  Users,
  Vibrate,
  Volume2,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// Local SettingRow and NavigationRow replaced by centralized SettingsRow component.

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

  // 🛡️ Logic & State Hook
  const { localSettings, isLoading, toggleSetting, snoozeAlerts, updateQuietTime } =
    useNotificationLogic();

  const [isSnoozeDrawerVisible, setIsSnoozeDrawerVisible] = React.useState(false);
  const [isTimeDrawerVisible, setIsTimeDrawerVisible] = React.useState(false);
  const [editingTimeKey, setEditingTimeKey] = React.useState<
    'quiet_hours_start' | 'quiet_hours_end' | null
  >(null);

  const [currentTime, setCurrentTime] = React.useState(dayjs());
  const [isTestingSound, setIsTestingSound] = React.useState(false);

  // Keep time fresh for live countdowns
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 30000);
    return () => clearInterval(timer);
  }, []);

  const testPlayer = useAudioPlayer(
    'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
  );

  // Keep testing state in sync with player
  React.useEffect(() => {
    if (!testPlayer.playing) {
      setIsTestingSound(false);
    }
  }, [testPlayer.playing]);

  const playTestSound = async () => {
    if (testPlayer.playing || isTestingSound) return;
    try {
      setIsTestingSound(true);
      testPlayer.seekTo(0);
      testPlayer.play();
      setTimeout(() => setIsTestingSound(false), 3000);
    } catch {
      setIsTestingSound(false);
    }
  };

  const handleToggle = (key: string, value: boolean) => {
    toggleSetting(key, value, playTestSound);
  };

  const handleSnooze = (minutes: number) => {
    snoozeAlerts(minutes);
    setIsSnoozeDrawerVisible(false);
  };

  const handleTimeSelect = (time: string) => {
    if (!editingTimeKey) return;

    if (
      normalizeTime(
        localSettings[
          editingTimeKey === 'quiet_hours_start' ? 'quiet_hours_end' : 'quiet_hours_start'
        ]
      ) === normalizeTime(time)
    ) {
      Alert.alert('Invalid Time', 'Start and end times cannot be the same.');
      return;
    }

    Haptic.impact(Haptics.ImpactFeedbackStyle.Light);
    updateQuietTime(editingTimeKey, time);
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
        {/* Master Toggle */}
        <View className="border-b border-border/5 px-6 py-6">
          <SettingsGroup>
            <SettingsRow
              icon={Bell}
              title="Show Notifications"
              subtitle="Receive alerts for new messages"
              onPress={() => handleToggle('show_notifications', !localSettings.show_notifications)}
              rightContent={
                <Switch
                  checked={localSettings.show_notifications}
                  onCheckedChange={(v: boolean) => handleToggle('show_notifications', v)}
                />
              }
            />
          </SettingsGroup>
        </View>

        {/* Silence Section */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="font-semibol mb-4 text-[12px] uppercase tracking-wider text-brand">
            Silence
          </Text>

          <SettingsGroup>
            <SettingsRow
              icon={Clock}
              title="Snooze Alerts"
              value={getMuteStatus()}
              onPress={() => setIsSnoozeDrawerVisible(true)}
            />

            <SettingsRow
              icon={Moon}
              title="Quiet Hours"
              subtitle="Automatically silence alerts during night."
              onPress={() =>
                handleToggle('quiet_hours_enabled', !localSettings.quiet_hours_enabled)
              }
              rightContent={
                <Switch
                  checked={localSettings.quiet_hours_enabled}
                  onCheckedChange={(v: boolean) => handleToggle('quiet_hours_enabled', v)}
                />
              }
            />
          </SettingsGroup>

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
                    <Text className="font-semibol text-[13px] text-brand">
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
                    <Text className="font-semibol text-[13px] text-brand">
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
          <Text className="font-semibol mb-4 text-[12px] uppercase tracking-wider text-brand">
            Messages
          </Text>

          <SettingsGroup>
            <SettingsRow
              icon={Eye}
              title="Show Previews"
              subtitle="Display message text in notifications."
              onPress={() => handleToggle('show_previews', !localSettings.show_previews)}
              rightContent={
                <Switch
                  checked={localSettings.show_previews}
                  onCheckedChange={(v: boolean) => handleToggle('show_previews', v)}
                />
              }
            />

            <SettingsRow
              icon={Heart}
              title="Reaction Notifications"
              subtitle="Notify when someone reacts to your message."
              onPress={() =>
                handleToggle('reaction_notifications', !localSettings.reaction_notifications)
              }
              rightContent={
                <Switch
                  checked={localSettings.reaction_notifications}
                  onCheckedChange={(v: boolean) => handleToggle('reaction_notifications', v)}
                />
              }
            />
          </SettingsGroup>
        </View>

        {/* Categories */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="font-semibol mb-4 text-[12px] uppercase tracking-wider text-brand">
            Categories
          </Text>

          <SettingsGroup>
            <SettingsRow
              icon={Users}
              title="Group Notifications"
              subtitle="Manage alerts for group conversations."
              onPress={() =>
                handleToggle('group_notifications', !localSettings.group_notifications)
              }
              rightContent={
                <Switch
                  checked={localSettings.group_notifications}
                  onCheckedChange={(v: boolean) => handleToggle('group_notifications', v)}
                />
              }
            />

            <SettingsRow
              icon={Phone}
              title="Call Notifications"
              subtitle="Alerts for incoming voice and video calls."
              onPress={() => handleToggle('call_notifications', !localSettings.call_notifications)}
              rightContent={
                <Switch
                  checked={localSettings.call_notifications}
                  onCheckedChange={(v: boolean) => handleToggle('call_notifications', v)}
                />
              }
            />
          </SettingsGroup>
        </View>

        {/* In-App Behavior */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="font-semibol mb-4 text-[12px] uppercase tracking-wider text-brand">
            In-App Behavior
          </Text>

          <SettingsGroup>
            <SettingsRow
              icon={Volume2}
              title="In-App Sounds"
              subtitle="Play sounds for incoming events while in app."
              onPress={() => handleToggle('in_app_sounds', !localSettings.in_app_sounds)}
              rightContent={
                <Switch
                  checked={localSettings.in_app_sounds}
                  onCheckedChange={(v: boolean) => handleToggle('in_app_sounds', v)}
                />
              }
            />

            <SettingsRow
              icon={Music}
              title="Play Test Sound"
              value={isTestingSound ? 'Testing...' : 'Ready'}
              onPress={isTestingSound ? undefined : playTestSound}
            />

            <SettingsRow
              icon={Vibrate}
              title="In-App Vibrate"
              subtitle="Vibration feedback for in-app events."
              onPress={() => handleToggle('in_app_vibrate', !localSettings.in_app_vibrate)}
              rightContent={
                <Switch
                  checked={localSettings.in_app_vibrate}
                  onCheckedChange={(v: boolean) => handleToggle('in_app_vibrate', v)}
                />
              }
            />
          </SettingsGroup>
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
          <Text className="font-semibol text-xl text-foreground">Snooze Alerts</Text>
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
                  <Text className="font-semibol ml-3 text-brand">End Snooze</Text>
                </View>
                <Text className="font-semibol text-[11px] uppercase tracking-wider text-brand/60">
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
              <ChevronRight size={16} className="text-muted-foreground" strokeWidth={2.5} />
            </TouchableOpacity>
          ))}
        </View>
      </Drawer>

      {/* Time Picker Drawer for Quiet Hours */}
      <Drawer visible={isTimeDrawerVisible} onClose={() => setIsTimeDrawerVisible(false)}>
        <Text className="font-semibol mb-6 text-center text-xl text-foreground">
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
                    className={`font-semibol ${
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

          {/* Scroll Hint Gradient - Using background token */}
          <LinearGradient
            colors={['transparent', isDark ? 'hsl(0 0% 3.9%)' : 'hsl(0 0% 100%)']}
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
            style={{ opacity: 0.8 }}
          />
        </View>
      </Drawer>
    </View>
  );
}
