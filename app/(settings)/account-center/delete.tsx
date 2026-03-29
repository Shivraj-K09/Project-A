import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/auth-context';
import { useArchiveAccount } from '@/hooks/use-user';
import { useAppTheme } from '@/store/theme-store';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { AlertTriangle, ShieldAlert, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DeleteAccountScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const router = useRouter();
  const { brandColor } = useAppTheme();
  const { signOut } = useAuth();
  const archiveAccount = useArchiveAccount();

  const dialogWidth = Math.max(300, Math.min(windowWidth - 40, 420));

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  // Warning Animation
  const pulseValue = useSharedValue(1);
  React.useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const runArchive = async () => {
    setIsWorking(true);
    try {
      await archiveAccount.mutateAsync();
      await signOut();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAlertOpen(false);
    } catch (e) {
      if (__DEV__) console.error('[DeleteAccount]', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsAlertOpen(false);
      setErrorOpen(true);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
      <View className="flex-1 justify-between px-8 pb-4 pt-8">
        {/* Simple Header */}
        <View className="items-center">
          <Animated.View
            style={pulseStyle}
            className="mb-6 h-24 w-24 items-center justify-center rounded-[32px] bg-destructive/10">
            <ShieldAlert size={44} color="#ef4444" strokeWidth={1.5} />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800)}>
            <Text className="text-center text-[28px] font-black leading-9 tracking-tight text-foreground">
              Delete account?
            </Text>
            <Text className="mt-3 px-4 text-center text-[15px] leading-6 text-muted-foreground">
              This closes your account for good. We archive your row in our database (not an instant
              wipe of all data). You can sign up again with the same phone number.
            </Text>
          </Animated.View>
        </View>

        {/* Consequences Grid */}
        <View className="flex-row flex-wrap justify-between">
          {[
            { label: 'Messages', sub: 'Chat history deleted', delay: 100 },
            { label: 'Media', sub: 'Photos & videos gone', delay: 150 },
            { label: 'Groups', sub: 'Left all communities', delay: 200 },
            { label: 'Account', sub: 'Profile & info wiped', delay: 250 },
          ].map((item, idx) => (
            <Animated.View
              key={idx}
              entering={FadeInDown.delay(item.delay).duration(400)}
              className="mb-3 w-[48%] rounded-[24px] border-[1.5px] border-destructive/40 bg-destructive/5 p-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-[17px] font-black text-foreground">{item.label}</Text>
                <X size={14} color="#ef4444" strokeWidth={3} />
              </View>
              <Text className="font-semibol mt-1 text-[13px] text-muted-foreground/90">
                {item.sub}
              </Text>
            </Animated.View>
          ))}
        </View>

        {/* Note */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          className="rounded-[24px] border-[1.5px] border-border/40 bg-muted/5 p-6">
          <View className="mb-2 flex-row items-center">
            <AlertTriangle size={16} color="#ef4444" strokeWidth={2.5} />
            <Text className="ml-2 text-[13px] font-black uppercase tracking-widest text-destructive">
              Please note
            </Text>
          </View>
          <Text className="font-semibol text-[14px] leading-6 text-foreground">
            Details of retention and deletion are in our privacy policy. This action cannot be
            undone from the app.
          </Text>
        </Animated.View>

        {/* Primary Actions */}
        <View className="space-y-4">
          <Button
            onPress={() => setIsAlertOpen(true)}
            disabled={isWorking || archiveAccount.isPending}
            className="h-16 rounded-2xl bg-destructive">
            <Text className="font-semibol text-[17px] text-white">Delete my account</Text>
          </Button>

          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            disabled={isWorking || archiveAccount.isPending}
            className="h-12 items-center justify-center">
            <Text className="text-[15px] font-semibold text-muted-foreground/60">
              No, I want to stay
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Danger Zone Footer */}
      <View className="items-center border-t border-destructive/20 bg-destructive/10 py-4">
        <Text className="text-[11px] font-black uppercase tracking-[4px] text-destructive">
          Danger zone
        </Text>
      </View>

      <Modal visible={isAlertOpen} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 px-6 dark:bg-black/65">
          <Pressable
            className="absolute inset-0"
            disabled={isWorking}
            onPress={() => setIsAlertOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close confirmation"
          />

          <View
            className="w-full max-w-[400px] overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-black/10 dark:shadow-black/30"
            accessibilityViewIsModal>
            <View className="px-6 pb-2 pt-6">
              <View className="mb-4 h-0.5 w-8 rounded-full bg-destructive/80" />
              <View className="flex-row items-start gap-3.5">
                <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 dark:bg-destructive/15">
                  <Trash2 size={20} color="#dc2626" strokeWidth={2} />
                </View>
                <View className="min-w-0 flex-1 pt-0.5">
                  <Text className="text-[18px] font-semibold leading-6 text-foreground">
                    Delete your account?
                  </Text>
                  <Text className="mt-2 text-[15px] font-normal leading-[22px] text-muted-foreground">
                    You&apos;ll be signed out. Your account is archived, not erased.
                  </Text>
                </View>
              </View>
            </View>

            <View className="border-t border-border px-4 pb-4 pt-3">
              <View className="flex-row gap-3">
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isWorking}
                  onPress={() => setIsAlertOpen(false)}
                  className="h-12 flex-1 items-center justify-center rounded-xl border border-border bg-muted/25 dark:bg-muted/15">
                  <Text className="text-[15px] font-semibold text-foreground">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.88}
                  disabled={isWorking}
                  onPress={() => void runArchive()}
                  className="h-12 flex-1 items-center justify-center rounded-xl bg-destructive">
                  {isWorking ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text className="text-[15px] font-semibold text-white">Delete account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <AlertDialog open={errorOpen} onOpenChange={setErrorOpen}>
        <AlertDialogContent
          className="gap-0 rounded-2xl border border-border bg-background p-0"
          style={{ width: dialogWidth, alignSelf: 'center' }}>
          <View className="px-6 pb-2 pt-6">
            <AlertDialogHeader className="items-start gap-0 p-0">
              <AlertDialogTitle className="text-left text-[18px] font-semibold leading-6 text-foreground">
                Couldn&apos;t delete account
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-3 text-left text-[15px] font-normal leading-[22px] text-muted-foreground">
                Check your connection and try again. If the problem continues, contact support.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </View>
          <View className="border-t border-border px-4 pb-4 pt-2">
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setErrorOpen(false)}
              className="h-12 w-full items-center justify-center rounded-xl"
              style={{ backgroundColor: brandColor }}>
              <Text className="text-[16px] font-semibold text-white">OK</Text>
            </TouchableOpacity>
          </View>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
