import { Text } from '@/components/ui/text';
import { useNetworkUsage, useResetNetworkUsage } from '@/hooks/use-user';
import { SettingsGroup, cnSettingsMenuItem } from '@/lib/settings-ui';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/theme-store';
import {
  ChevronRight,
  Database,
  HardDrive,
  MessageSquare,
  PhoneCall,
  RefreshCw,
} from 'lucide-react-native';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NetworkUsageScreen() {
  const insets = useSafeAreaInsets();
  const brandColor = useThemeStore((state) => state.accentColor);

  const { data: usage, isLoading } = useNetworkUsage();
  const resetStats = useResetNetworkUsage();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={brandColor} />
      </View>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalBytes =
    (usage?.media_sent || 0) +
    (usage?.media_received || 0) +
    (usage?.calls_sent || 0) +
    (usage?.calls_received || 0) +
    (usage?.messages_sent || 0) +
    (usage?.messages_received || 0);

  const totalFormatted = formatBytes(totalBytes);
  const [value, unit] = totalFormatted.split(' ');

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}>
        {/* Overview Information */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            Overview
          </Text>

          <SettingsGroup>
            <View className={cn(cnSettingsMenuItem(), 'justify-between')}>
              <View className="mr-4 flex-1 flex-row items-center">
                <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
                  <Database size={18} color={brandColor} strokeWidth={2} />
                </View>
                <Text className="text-[16px] font-semibold text-foreground">Total Usage</Text>
              </View>
              <Text className="text-[14px] font-medium text-muted-foreground">
                {totalFormatted}
              </Text>
            </View>

            <SettingRow
              icon={RefreshCw}
              title="Last Reset"
              value={
                usage?.last_reset_at
                  ? new Date(usage.last_reset_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Never'
              }
            />
          </SettingsGroup>
        </View>

        {/* Detailed Stats Section */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            Breakdown
          </Text>

          <SettingsGroup>
            <SettingRow
              icon={HardDrive}
              title="Media"
              value={formatBytes((usage?.media_sent || 0) + (usage?.media_received || 0))}
            />

            <SettingRow
              icon={PhoneCall}
              title="Calls"
              value={formatBytes((usage?.calls_sent || 0) + (usage?.calls_received || 0))}
            />

            <SettingRow
              icon={MessageSquare}
              title="Messages"
              value={formatBytes((usage?.messages_sent || 0) + (usage?.messages_received || 0))}
            />
          </SettingsGroup>
        </View>

        {/* Action Section */}
        <View className="mt-6 px-6">
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={resetStats.isPending}
            onPress={() => resetStats.mutate()}
            className="flex-row items-center justify-center rounded-2xl border border-destructive/10 bg-destructive/5 py-4">
            {resetStats.isPending ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Text className="text-[14px] font-semibold text-destructive">Reset Statistics</Text>
            )}
          </TouchableOpacity>
          <Text className="mt-4 px-4 text-center text-[12px] leading-5 text-muted-foreground">
            Resetting your statistics will clear all current network usage counters.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingRow({ icon: Icon, title, value, onPress, className = '' }: any) {
  const brandColor = useThemeStore((state) => state.accentColor);
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.6 : 1}
      onPress={onPress}
      className={cn(cnSettingsMenuItem(), className)}>
      <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
        <Icon size={18} color={brandColor} strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Text className="text-[16px] font-semibold text-foreground">{title}</Text>
      </View>
      <View className="flex-row items-center">
        <Text className="mr-2 text-[14px] font-medium text-muted-foreground">{value}</Text>
        {onPress && <ChevronRight size={14} color="#71717a" strokeWidth={2} />}
      </View>
    </TouchableOpacity>
  );
}
