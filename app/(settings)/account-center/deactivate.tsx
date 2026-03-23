import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/auth-context';
import { useDeactivateAccount } from '@/hooks/use-user';
import { useAppTheme } from '@/store/theme-store';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUMMARY_LINES = [
  'Your profile and content are hidden from others while your account is deactivated.',
  'Your messages and data stay on your account until you choose to reactivate.',
  'Sign in anytime, then turn your account back on from Account Center.',
];

export default function DeactivateAccountScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { signOut } = useAuth();
  const { brandColor, isDark } = useAppTheme();
  const deactivate = useDeactivateAccount();

  const dialogWidth = Math.max(300, Math.min(windowWidth - 40, 420));

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const openConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfirmOpen(true);
  };

  const runDeactivate = async () => {
    setIsWorking(true);
    try {
      await deactivate.mutateAsync();
      await signOut();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfirmOpen(false);
      // Navigation to onboarding: root _layout only (avoid duplicate replace + remounts)
    } catch (e) {
      console.error('[Deactivate]', e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setConfirmOpen(false);
      setErrorOpen(true);
    } finally {
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
          Pause your presence without losing your account. You can reactivate when you&apos;re
          ready.
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
          disabled={isWorking || deactivate.isPending}
          className="mt-11 h-[52px] items-center justify-center rounded-xl"
          style={{
            backgroundColor: brandColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.35 : 0.12,
            shadowRadius: 10,
            elevation: 3,
          }}>
          {isWorking || deactivate.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text className="text-[16px] font-semibold text-white">Deactivate account</Text>
          )}
        </TouchableOpacity>

        <View className="mt-8 rounded-xl border border-border bg-muted/20 px-4 py-3.5 dark:bg-muted/15">
          <Text className="text-center text-[12px] leading-[19px] text-muted-foreground">
            You&apos;ll be signed out.{'\n'}
            Your past messages may still be{'\u00A0'}visible.
          </Text>
        </View>
      </ScrollView>

      {/* Confirm */}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => !isWorking && setConfirmOpen(open)}>
        <AlertDialogContent
          className="gap-0 rounded-2xl border border-border bg-background p-0"
          style={{ width: dialogWidth, alignSelf: 'center' }}>
          <View className="px-6 pb-2 pt-6">
            <View className="mb-4 h-0.5 w-8 rounded-full" style={{ backgroundColor: brandColor }} />
            <AlertDialogHeader className="items-start gap-0 p-0">
              <AlertDialogTitle className="text-left text-[18px] font-semibold leading-6 text-foreground">
                Deactivate your account?
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-3 text-left text-[15px] font-normal leading-[22px] text-muted-foreground">
                You will be signed out. You can sign in again later; your profile stays hidden until
                you reactivate in Account Center.
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
                onPress={() => void runDeactivate()}
                className="h-12 flex-1 items-center justify-center rounded-xl bg-destructive">
                {isWorking ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-[15px] font-semibold text-white">Deactivate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error */}
      <AlertDialog open={errorOpen} onOpenChange={setErrorOpen}>
        <AlertDialogContent
          className="gap-0 rounded-2xl border border-border bg-background p-0"
          style={{ width: dialogWidth, alignSelf: 'center' }}>
          <View className="px-6 pb-2 pt-6">
            <AlertDialogHeader className="items-start gap-0 p-0">
              <AlertDialogTitle className="text-left text-[18px] font-semibold leading-6 text-foreground">
                Couldn&apos;t deactivate
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
