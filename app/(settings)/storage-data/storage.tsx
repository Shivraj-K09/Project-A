import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useClearStorage, useStorageUsage } from '@/hooks/use-user';
import { SettingsGroup, cnSettingsMenuItem } from '@/lib/settings-ui';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/theme-store';
import * as Haptics from 'expo-haptics';
import { FileText, Image as ImageIcon, Music, PlayCircle, Trash2 } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const formatBytes = (bytes: number, base: 1000 | 1024 = 1000) => {
  if (bytes === 0) return '0 B';
  const k = base;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const STORAGE_TIERS_GB = [8, 16, 32, 64, 128, 256, 512, 1024, 2048] as const;

const inferNominalCapacity = (usableBytes: number) => {
  if (usableBytes <= 0) return 0;

  for (const tier of STORAGE_TIERS_GB) {
    const tierBytes = tier * 1_000_000_000;
    const ratio = usableBytes / tierBytes;

    // Android/iOS often expose usable/data-partition capacity below the marketed storage tier.
    if (ratio >= 0.8 && ratio <= 1) {
      return tierBytes;
    }
  }

  return 0;
};

export default function ManageStorageScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const brandColor = useThemeStore((state) => state.accentColor);
  const [isCacheDialogOpen, setIsCacheDialogOpen] = React.useState(false);
  const [isDeepCleanDialogOpen, setIsDeepCleanDialogOpen] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<'cache' | 'all' | null>(null);

  const { data: stats, isLoading } = useStorageUsage();
  const clearStorage = useClearStorage();

  const handleClearCache = async () => {
    setIsCacheDialogOpen(false);
    setPendingAction('cache');

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await clearStorage.mutateAsync('cache');
      toast({
        message: 'Cache successfully cleared',
        variant: 'success',
      });
    } catch (error) {
      toast({
        message: 'Failed to clear cache',
        variant: 'error',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleDeepClean = async () => {
    setIsDeepCleanDialogOpen(false);
    setPendingAction('all');

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await clearStorage.mutateAsync('all');
      toast({
        message: 'Storage deep cleaned',
        variant: 'success',
      });
    } catch (error) {
      toast({
        message: 'Action failed',
        variant: 'error',
      });
    } finally {
      setPendingAction(null);
    }
  };

  if (isLoading || !stats) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={brandColor} />
      </View>
    );
  }

  const totalAppBytes =
    (stats.photos || 0) +
    (stats.videos || 0) +
    (stats.documents || 0) +
    (stats.audio || 0) +
    (stats.cache || 0);

  const hasTotalDevice = (stats.total_device_space || 0) > 0;
  const hasFreeSpace = (stats.free_device_space || 0) >= 0;

  // Use only OS-reported total. Do not estimate.
  const effectiveTotalBytes = stats.total_device_space || 0;
  const nominalTotalBytes = inferNominalCapacity(effectiveTotalBytes);
  const displayCapacityBytes = nominalTotalBytes || effectiveTotalBytes;
  
  const freeDeviceBytes = stats.free_device_space || 0;
  const usedDeviceBytes = Math.max(0, effectiveTotalBytes - freeDeviceBytes);
  const otherSystemBytes = Math.max(0, usedDeviceBytes - totalAppBytes);

  // If we don't know device totals, focus graph on app data.
  const totalBarBytes = effectiveTotalBytes > 0 ? effectiveTotalBytes : totalAppBytes || 1; // Avoid divide by zero

  // Single-bar composition: app usage, other used storage, and free storage.
  const appW = (totalAppBytes / totalBarBytes) * 100;
  const systemW = effectiveTotalBytes > 0 ? (otherSystemBytes / totalBarBytes) * 100 : 0;
  const freeW =
    effectiveTotalBytes > 0 ? Math.max(0, (freeDeviceBytes / totalBarBytes) * 100) : 0;

  const appShareOfDevice =
    effectiveTotalBytes > 0
      ? `${((totalAppBytes / effectiveTotalBytes) * 100).toFixed(2)}%`
      : 'N/A';

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}>
        {/* Storage Visualization Section */}
        <View className="border-b border-border/5 px-6 py-6">
          <View className="mb-4 flex-row items-end justify-between">
            <View>
              <Text className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-brand">
                Device Storage
              </Text>
              <Text className="text-3xl font-black text-foreground">
                {
                  (displayCapacityBytes > 0
                    ? formatBytes(displayCapacityBytes)
                    : formatBytes(totalAppBytes)
                  ).split(' ')[0]
                }
                <Text className="text-lg text-muted-foreground">
                  {' '}
                  {
                    (displayCapacityBytes > 0
                      ? formatBytes(displayCapacityBytes)
                      : formatBytes(totalAppBytes)
                    ).split(' ')[1]
                  }
                </Text>
              </Text>
            </View>
            <View className="items-end pb-1">
              <Text className="text-[12px] font-bold text-muted-foreground/60">
                {formatBytes(freeDeviceBytes)} free
              </Text>
              {!hasTotalDevice && (
                <Text className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-amber-500/80">
                  Total unavailable
                </Text>
              )}
            </View>
          </View>

          {(nominalTotalBytes || 0) > 0 && nominalTotalBytes !== effectiveTotalBytes && (
            <Text
              className="mb-4 w-full pr-6 text-[11px] font-medium leading-4 text-muted-foreground/70"
              numberOfLines={2}>
              OS usable storage: {formatBytes(effectiveTotalBytes)}. Device capacity shown:{' '}
              {formatBytes(nominalTotalBytes || 0)}.
            </Text>
          )}

          {/* Single storage bar: app, other used, free */}
          <View className="h-3 w-full flex-row overflow-hidden rounded-full border border-border/5 bg-muted/10">
            {appW > 0 && <View style={{ width: `${appW}%` }} className="h-full bg-violet-500" />}
            {systemW > 0 && (
              <View
                style={{ width: `${systemW}%` }}
                className="h-full border-l border-background/20 bg-amber-500"
              />
            )}
            {freeW > 0 && (
              <View
                style={{ width: `${freeW}%` }}
                className="h-full border-l border-background/20 bg-emerald-400"
              />
            )}
          </View>

          <View className="mt-4 flex-row gap-2">
            <CompactStat
              label="Used"
              value={effectiveTotalBytes > 0 ? formatBytes(usedDeviceBytes) : 'Unavailable'}
              tone="used"
            />
            <CompactStat
              label="Free"
              value={hasFreeSpace ? formatBytes(freeDeviceBytes) : 'Unavailable'}
              tone="green"
            />
            <CompactStat label="This App" value={formatBytes(totalAppBytes)} tone="violet" />
          </View>

          <View className="mt-4 flex-row flex-wrap items-center gap-x-4 gap-y-2">
            <LegendItem label="This App" color="bg-violet-500" />
            {effectiveTotalBytes > 0 && <LegendItem label="Other Used" color="bg-amber-500" />}
            {effectiveTotalBytes > 0 && <LegendItem label="Free" color="bg-emerald-400" />}
          </View>
        </View>

        {/* Breakdown Section */}
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            Storage Breakdown
          </Text>

          <SettingsGroup>
            <SettingRow icon={ImageIcon} title="Photos" value={formatBytes(stats.photos)} />
            <SettingRow icon={PlayCircle} title="Videos" value={formatBytes(stats.videos)} />
            <SettingRow
              icon={FileText}
              title="Internal App Data"
              value={formatBytes(stats.documents)}
            />
            <SettingRow icon={Music} title="Audio Files" value={formatBytes(stats.audio)} />
            <SettingRow icon={Trash2} title="Cached Data" value={formatBytes(stats.cache)} />
          </SettingsGroup>
        </View>

        {/* Action Section */}
        <View className="mt-6 px-6">
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={pendingAction !== null}
            onPress={() => setIsCacheDialogOpen(true)}
            className="flex-row items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 py-4 active:bg-brand/20">
            <Text className="text-[14px] font-bold uppercase tracking-widest text-brand">
              {pendingAction === 'cache' ? 'Working...' : 'Clear All Cache'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={pendingAction !== null}
            onPress={() => setIsDeepCleanDialogOpen(true)}
            className="mt-3 flex-row items-center justify-center rounded-2xl border border-destructive/10 bg-destructive/5 py-4 active:bg-destructive/10">
            <Text className="text-[14px] font-bold uppercase tracking-widest text-destructive">
              {pendingAction === 'all' ? 'Working...' : 'Deep Clean App Data'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AlertDialog open={isCacheDialogOpen} onOpenChange={setIsCacheDialogOpen}>
        <AlertDialogContent className="w-[92%] max-w-[380px]">
          <AlertDialogHeader className="items-start">
            <AlertDialogTitle>Clear cache?</AlertDialogTitle>
            <AlertDialogDescription className="mt-1">
              Remove temporary app files to free up space. Chats and saved media stay untouched.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <View className="mt-8 flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsCacheDialogOpen(false)}
              className="h-14 flex-1 items-center justify-center rounded-[18px] border border-border bg-background">
              <Text className="text-[15px] font-semibold text-muted-foreground">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={pendingAction !== null}
              onPress={handleClearCache}
              className="h-14 flex-1 items-center justify-center rounded-[18px] bg-brand">
              <Text className="text-[15px] font-bold text-white">Clear</Text>
            </TouchableOpacity>
          </View>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeepCleanDialogOpen} onOpenChange={setIsDeepCleanDialogOpen}>
        <AlertDialogContent className="w-[92%] max-w-[380px]">
          <AlertDialogHeader className="items-start">
            <AlertDialogTitle>Deep clean app data?</AlertDialogTitle>
            <AlertDialogDescription className="mt-1">
              Remove cached files and app-managed local media. Some internal app data can still
              remain and rebuild during normal app use.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <View className="mt-8 flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsDeepCleanDialogOpen(false)}
              className="h-14 flex-1 items-center justify-center rounded-[18px] border border-border bg-background">
              <Text className="text-[15px] font-semibold text-muted-foreground">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={pendingAction !== null}
              onPress={handleDeepClean}
              className="h-14 flex-1 items-center justify-center rounded-[18px] bg-destructive">
              <Text className="text-[15px] font-bold text-white">Deep Clean</Text>
            </TouchableOpacity>
          </View>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <View className="flex-row items-center px-1">
      <View className={cn('mr-2 h-1.5 w-1.5 rounded-full', color)} />
      <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
        {label}
      </Text>
    </View>
  );
}

function CompactStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'used' | 'green' | 'violet';
}) {
  const toneClass =
    tone === 'green'
      ? 'border-emerald-400/20 bg-emerald-400/10'
      : tone === 'violet'
        ? 'border-violet-400/20 bg-violet-400/10'
        : 'border-amber-500/20 bg-amber-500/10';

  return (
    <View className={cn('flex-1 rounded-xl border px-3 py-2.5', toneClass)}>
      <Text className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </Text>
      <Text className="mt-1 text-[13px] font-black text-foreground">{value}</Text>
    </View>
  );
}

function SettingRow({ icon: Icon, title, value, className = '' }: any) {
  const brandColor = useThemeStore((state) => state.accentColor);
  return (
    <View className={cn(cnSettingsMenuItem(), 'flex-row items-center', className)}>
      <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
        <Icon size={18} color={brandColor} strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Text className="text-[16px] font-semibold text-foreground">{title}</Text>
      </View>
      <View className="flex-row items-center">
        <Text className="mr-2 text-[14px] font-medium text-muted-foreground">{value}</Text>
      </View>
    </View>
  );
}
