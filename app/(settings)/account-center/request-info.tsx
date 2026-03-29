import { AccountReportData, generateReportHTML } from '@/components/account/report-template';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/auth-context';
import {
  getActiveUsersRowIdForAuth,
  getAllUsersRowIdsForAuth,
  useAccountDataRequest,
  useAccountDataRequests,
  useCreateDataRequest,
  useDeleteDataRequest,
} from '@/hooks/use-user';
import { useAccountReport } from '@/hooks/user/report';
import { useAppTheme } from '@/store/theme-store';
import dayjs from 'dayjs';
import * as Haptics from 'expo-haptics';
import { Download, FileText, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RequestAccountInfoScreen() {
  const insets = useSafeAreaInsets();
  const { brandColor } = useAppTheme();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  // Real Database Hooks
  const { data: request, isLoading: isQueryLoading } = useAccountDataRequest();
  const { data: history } = useAccountDataRequests();
  const createRequest = useCreateDataRequest();
  const deleteRequest = useDeleteDataRequest();
  const generateReport = useAccountReport();
  const { user } = useAuth();

  const status = request?.status || 'none';
  const isLoading = createRequest.isPending || isQueryLoading || generateReport.isPending;

  const handleRequest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Pass an empty object to satisfy mutation variables if typed strictly
      await createRequest.mutateAsync({});
      toast({ message: 'Request sent successfully', variant: 'success' });
    } catch (err: any) {
      toast({ message: err.message || 'Failed to send request', variant: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!request?.id) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await deleteRequest.mutateAsync(request.id);
      setIsAlertOpen(false);
      toast({ message: 'Request cancelled', variant: 'success' });
    } catch (err: any) {
      toast({ message: err.message || 'Failed to cancel request', variant: 'error' });
    }
  };

  const handleDownload = async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    toast({ message: 'Preparing your secure report...', variant: 'info' });

    try {
      const result = await generateReport.mutateAsync({
        brandColor,
        requestId: request?.id,
      });

      if (result.method === 'save') {
        toast({ message: 'Report saved to your device!', variant: 'success' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      if (__DEV__) console.error('[Export] Generation Failed:', err);
      toast({ message: 'Failed to generate PDF. Check connection.', variant: 'error' });
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Main Section */}
        <View className="border-b border-border/20 px-6 py-6">
          <Text
            className="mb-4 text-[13px] font-black uppercase tracking-wider text-brand"
            style={{ color: brandColor }}>
            Account Report
          </Text>

          <Text className="mb-6 text-[16px] font-medium leading-7 text-foreground">
            Request a report of your account information and settings. This report is for your
            reference or to move your data to another service.
          </Text>

          {status === 'none' && (
            <View>
              <View
                className="rounded-2x mb-6 flex-row items-center border border-border/40 bg-muted/5 p-5"
                style={{ borderRadius: 24 }}>
                <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-brand/10">
                  <FileText size={18} color={brandColor} strokeWidth={2.5} />
                </View>
                <Text className="font-semibol flex-1 text-[14px] text-foreground">
                  Your PDF report will be generated instantly for your security.
                </Text>
              </View>

              <Button
                onPress={handleRequest}
                disabled={isLoading}
                className="h-14 rounded-2xl"
                style={{ backgroundColor: brandColor }}>
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-[16px] font-semibold text-white">Request Report</Text>
                )}
              </Button>
            </View>
          )}

          {status === 'pending' && (
            <View>
              <View className="mb-2 rounded-[24px] border-[1.5px] border-border/40 bg-muted/5 p-6">
                <View className="mb-5 flex-row items-center justify-between">
                  <Text className="text-[15px] font-black text-foreground">Pending Request</Text>
                  <View className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5">
                    <Text className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400">
                      Processing
                    </Text>
                  </View>
                </View>

                <View className="space-y-4">
                  <View className="flex-row justify-between">
                    <Text className="font-semibol text-[14px] text-muted-foreground">
                      Date Requested
                    </Text>
                    <Text className="text-[14px] font-black text-foreground">
                      {dayjs(request.requested_at).format('MMM D, YYYY')}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="font-semibol text-[14px] text-muted-foreground">Status</Text>
                    <Text
                      className="text-[14px] font-black text-brand"
                      style={{ color: brandColor }}>
                      Processing Info
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsAlertOpen(true)}
                className="mt-6 flex-row items-center justify-center py-2">
                <Trash2 size={18} color="#ef4444" strokeWidth={2.5} />
                <Text className="ml-2 text-[15px] font-black text-destructive">Cancel Request</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'ready' && (
            <View>
              <View className="mb-6 rounded-[24px] border-[1.5px] border-brand/40 bg-brand/5 p-6">
                <View className="flex-row items-center gap-5">
                  <View className="h-14 w-14 items-center justify-center rounded-xl bg-brand/10">
                    <FileText size={28} color={brandColor} strokeWidth={2.5} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[17px] font-black text-foreground">Report Ready</Text>
                    <Text className="font-semibol text-[14px] text-muted-foreground/90">
                      Secure PDF • 1.2 MB
                    </Text>
                  </View>
                </View>
              </View>

              <Button
                onPress={handleDownload}
                disabled={isLoading}
                className="h-14 rounded-2xl"
                style={{ backgroundColor: brandColor }}>
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Download size={18} color="white" className="mr-2" />
                    <Text className="text-[16px] font-semibold text-white">
                      Download PDF Report
                    </Text>
                  </>
                )}
              </Button>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsAlertOpen(true)}
                className="mt-6 flex-row items-center justify-center py-2">
                <Trash2 size={16} color="#ef4444" strokeWidth={2} />
                <Text className="ml-2 text-[14px] font-semibold text-destructive">
                  Delete Report
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Contextual Notes */}
          <View className="mt-10 space-y-4 border-t border-border/5 pt-6">
            <View className="flex-row gap-2">
              <Text className="text-[12px] leading-5 text-muted-foreground/60">•</Text>
              <Text className="flex-1 text-[12px] leading-5 text-muted-foreground/70">
                Updating your phone number or deleting your account will cancel any active requests.
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Text className="text-[12px] leading-5 text-muted-foreground/60">•</Text>
              <Text className="flex-1 text-[12px] leading-5 text-muted-foreground/70">
                Generated archives are automatically removed after 7 days for your security.
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-12 px-10">
          <Text className="text-center text-[12px] leading-5 text-muted-foreground/80">
            This report contains your profile information, activity logs, and secure support chat
            history. All data is decrypted locally.
          </Text>
        </View>
      </ScrollView>

      {/* Professional Minimalist Confirmation Modal */}
      <Modal
        visible={isAlertOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAlertOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/80 px-10">
          <Pressable className="absolute inset-0" onPress={() => setIsAlertOpen(false)} />

          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="w-full rounded-[24px] bg-background p-8 shadow-2xl">
            <Text className="font-semibol text-center text-[20px] text-foreground">
              {status === 'pending' ? 'Cancel active request?' : 'Delete report?'}
            </Text>

            <Text className="mt-4 px-2 text-center text-[15px] leading-6 text-muted-foreground">
              {status === 'pending'
                ? 'Your request will be stopped and you will need to start over if you need it again.'
                : 'This archived PDF will be removed from our servers permanently.'}
            </Text>

            <View className="mt-10 flex-row gap-4">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsAlertOpen(false)}
                className="h-12 flex-1 items-center justify-center rounded-xl bg-muted/40">
                <Text className="text-[15px] font-semibold text-foreground/60">Not now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={confirmDelete}
                className="h-12 flex-1 items-center justify-center rounded-xl bg-destructive">
                <Text className="font-semibol text-[15px] text-white">
                  {status === 'pending' ? 'Confirm' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
