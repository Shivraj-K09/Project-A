import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';
import { useReactivateAccount } from '@/hooks/use-user';
import { useAppTheme } from '@/store/theme-store';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUMMARY_LINES = [
  'Your profile and content become visible again based on your privacy settings.',
  'You can use messages, calls, and the rest of the app as usual.',
  'You can deactivate again anytime from Account Center if you need another break.',
];

export default function ReactivateAccountScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const router = useRouter();
  const { brandColor, isDark } = useAppTheme();
  const reactivate = useReactivateAccount();

  const dialogWidth = Math.max(300, Math.min(windowWidth - 40, 420));

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const reactivateInFlightRef = useRef(false);

  const openConfirm = () => {
    if (confirmOpen || reactivateInFlightRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfirmOpen(true);
  };

  const runReactivate = async () => {
    if (reactivateInFlightRef.current) return;
    reactivateInFlightRef.current = true;
    setIsWorking(true);
    try {
      await reactivate.mutateAsync();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfirmOpen(false);
      // Always go to main chats — router.back() can pop past settings or behave like “exit” on some stacks
      requestAnimationFrame(() => {
        router.replace('/(tabs)/chats');
      });
    } catch (e) {
      console.error('[Reactivate]', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setConfirmOpen(false);
      setErrorOpen(true);
    } finally {
      reactivateInFlightRef.current = false;
      setIsWorking(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: insets.bottom + 36,
        }}
        showsVerticalScrollIndicator={false}>
        <Text className="max-w-[520px] text-[15px] leading-[24px] text-muted-foreground">
          Turn your account back on when you&apos;re ready to be visible to others again.
        </Text>

        <Text className="mb-2.5 mt-11 text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
          What happens
        </Text>
        <View className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/5 dark:shadow-black/25">
          {SUMMARY_LINES.map((line, index) => (
            <View
              key={index}
              className={`px-4 py-4 ${index < SUMMARY_LINES.length - 1 ? 'border-b border-border' : ''}`}>
              <View className="flex-row gap-3.5">
                <View
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: brandColor, opacity: 0.55 }}
                />
                <Text className="flex-1 text-[14px] leading-[22px] text-muted-foreground">
                  {line}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={openConfirm}
          disabled={isWorking || reactivate.isPending}
          className="mt-11 h-[52px] items-center justify-center rounded-xl"
          style={{
            backgroundColor: brandColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.35 : 0.12,
            shadowRadius: 10,
            elevation: 3,
          }}>
          {isWorking || reactivate.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-[16px] font-semibold text-white">Reactivate account</Text>
          )}
        </TouchableOpacity>

        <View className="mt-8 rounded-xl border border-border bg-muted/20 px-4 py-3.5 dark:bg-muted/15">
          <Text className="text-center text-[12px] leading-[19px] text-muted-foreground">
            Your privacy settings still apply.{'\n'}
            Need another break later? Deactivate from Account{'\u00A0'}Center.
          </Text>
        </View>
      </ScrollView>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (isWorking || reactivateInFlightRef.current) return;
          setConfirmOpen(open);
        }}>
        <AlertDialogContent
          className="gap-0 rounded-2xl border border-border bg-background p-0"
          style={{ width: dialogWidth, alignSelf: 'center' }}>
          <View className="px-6 pb-2 pt-6">
            <View className="mb-4 h-0.5 w-8 rounded-full" style={{ backgroundColor: brandColor }} />
            <AlertDialogHeader className="items-start gap-0 p-0">
              <AlertDialogTitle className="text-left text-[18px] font-semibold leading-6 text-foreground">
                Reactivate your account?
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-3 text-left text-[15px] font-normal leading-[22px] text-muted-foreground">
                Your profile will be visible to others again according to your privacy settings. You
                can change those anytime in settings.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </View>

          <View className="border-t border-border px-4 pb-4 pt-3">
            <View className="flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isWorking}
                onPress={() => setConfirmOpen(false)}
                className="h-12 flex-1 items-center justify-center rounded-xl border border-border bg-muted/30">
                <Text className="text-[15px] font-semibold text-foreground">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.88}
                disabled={isWorking}
                onPress={() => void runReactivate()}
                className="h-12 flex-1 items-center justify-center rounded-xl"
                style={{ backgroundColor: brandColor }}>
                {isWorking ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-[15px] font-semibold text-white">Reactivate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={errorOpen} onOpenChange={setErrorOpen}>
        <AlertDialogContent
          className="gap-0 rounded-2xl border border-border bg-background p-0"
          style={{ width: dialogWidth, alignSelf: 'center' }}>
          <View className="px-6 pb-2 pt-6">
            <AlertDialogHeader className="items-start gap-0 p-0">
              <AlertDialogTitle className="text-left text-[18px] font-semibold leading-6 text-foreground">
                Couldn&apos;t reactivate
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
