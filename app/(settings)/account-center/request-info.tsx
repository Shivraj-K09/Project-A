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
import { supabase } from '@/lib/supabase';
import { useAppTheme } from '@/store/theme-store';
import dayjs from 'dayjs';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import {
  Download,
  FileText,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  History,
  ChevronRight
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { CryptoHelper } from '@/lib/crypto';

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
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const status = request?.status || 'none';
  const isLoading = createRequest.isPending || isQueryLoading || isGenerating;

  const handleRequest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createRequest.mutateAsync();
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

  const generateHTML = (data: any) => {
    const { profile, privacy, notification, chat, network, storage, messages } = data;

    return `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; color: #1a1a1a; padding: 40px; margin: 0; }
            .header { border-bottom: 2px solid ${brandColor}; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: 800; color: ${brandColor}; margin: 0; }
            .subtitle { font-size: 14px; color: #666; font-weight: 600; text-transform: uppercase; margin-top: 5px; }
            
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: 700; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px; }
            
            .grid { display: flex; flex-wrap: wrap; gap: 20px; }
            .item { min-width: 200px; margin-bottom: 15px; }
            .label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #888; }
            .value { font-size: 14px; font-weight: 500; color: #111; margin-top: 4px; }
            
            .card { background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #f3f4f6; }
            .footer { margin-top: 100px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
            .disclaimer { font-size: 10px; color: #aaa; line-height: 1.6; }

            .msg-row { border-bottom: 1px solid #f0f0f0; padding: 10px 0; }
            .msg-meta { font-size: 11px; color: #999; margin-bottom: 4px; font-weight: 700; }
            .msg-text { font-size: 13px; color: #333; line-height: 1.5; }
            .msg-sender { color: ${brandColor}; }
            .msg-agent { color: #555; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">ACCOUNT DATA REPORT</h1>
            <div class="subtitle">Generated for ${profile.username}</div>
          </div>

          <div class="section">
            <h2 class="section-title">Identity & Profile</h2>
            <div class="grid">
              <div class="item"><div class="label">Full Name</div><div class="value">${profile.first_name || ''} ${profile.last_name || ''}</div></div>
              <div class="item"><div class="label">Email Address</div><div class="value">${profile.email}</div></div>
              <div class="item"><div class="label">Phone Number</div><div class="value">${profile.phone_number || 'N/A'}</div></div>
              <div class="item"><div class="label">Username</div><div class="value">@${profile.username}</div></div>
              <div class="item"><div class="label">Member Since</div><div class="value">${dayjs(profile.created_at).format('MMM D, YYYY')}</div></div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Privacy Settings</h2>
            <div class="card">
              <div class="grid">
                <div class="item"><div class="label">Last Seen Visibility</div><div class="value">${privacy.last_seen}</div></div>
                <div class="item"><div class="label">Profile Photo</div><div class="value">${privacy.profile_photo}</div></div>
                <div class="item"><div class="label">Read Receipts</div><div class="value">${privacy.read_receipts ? 'Enabled' : 'Disabled'}</div></div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Support Chat History (E2E Decrypted)</h2>
            <div class="card" style="padding: 10px 20px;">
              ${messages && messages.length > 0 ? messages.map((m: any) => `
                <div class="msg-row">
                  <div class="msg-meta">
                    <span class="${m.is_mine ? 'msg-sender' : 'msg-agent'}">${m.is_mine ? 'You' : 'Support Team'}</span> • ${dayjs(m.created_at).format('MMM D, YYYY • h:mm A')}
                  </div>
                  <div class="msg-text">${m.text}</div>
                </div>
              `).join('') : '<p style="color: #888; text-align: center; margin: 20px 0;">No support messages found.</p>'}
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Network Usage Statistics</h2>
            <div class="grid">
              <div class="item"><div class="label">Messages Sent</div><div class="value">${network.messages_sent || 0}</div></div>
              <div class="item"><div class="label">Messages Received</div><div class="value">${network.messages_received || 0}</div></div>
              <div class="item"><div class="label">Media Sent</div><div class="value">${(network.media_sent / 1024 / 1024).toFixed(2)} MB</div></div>
              <div class="item"><div class="label">Calls Sent</div><div class="value">${network.calls_sent || 0}</div></div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Export Security</h2>
            <p style="font-size: 13px; color: #444;">This report was generated securely on your device. All end-to-end encrypted chats were decrypted locally using your private key. This document is for your offline reference.</p>
          </div>

          <div class="footer">
            <div class="disclaimer">
              This document is private and confidential. Report ID: ${request?.id || 'LOCAL-SYNC'}<br/>
              Created on ${dayjs().format('MMMM D, YYYY at h:mm A')} via Secure Export Tool.
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);

    // Minimalist toast approach
    const toastId = toast({ message: 'Preparing your secure report...', variant: 'info' });

    try {
      const activeProfileId = await getActiveUsersRowIdForAuth(user.id);
      const allProfileIds = await getAllUsersRowIdsForAuth(user.id);
      if (!activeProfileId) {
        throw new Error('No active profile to export');
      }

      const [
        { data: profile },
        { data: privacy },
        { data: notification },
        { data: chat },
        { data: network },
        { data: storage }
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', activeProfileId).single(),
        supabase.from('privacy_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('notification_settings').select('*').eq('user_id', activeProfileId).single(),
        supabase.from('chat_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('network_usage').select('*').eq('user_id', user.id).single(),
        supabase.from('storage_usage').select('*').eq('user_id', user.id).single(),
      ]);

      // --- 1. DECRYPT SUPPORT CHAT ---
      // Fetch all sessions for this user
      const { data: userSessions } = await supabase
        .from('get_support_sessions')
        .select('id')
        .in('user_id', allProfileIds.length > 0 ? allProfileIds : [activeProfileId]);

      const sessionIds = userSessions?.map(s => s.id) || [];
      let decryptedMessages: any[] = [];

      if (sessionIds.length > 0) {
        // Fetch all messages for these sessions
        const { data: rawMessages } = await supabase
          .from('support_messages')
          .select('*')
          .in('session_id', sessionIds)
          .order('created_at', { ascending: true });

        if (rawMessages && rawMessages.length > 0) {
          await CryptoHelper.initializeKeys();

          decryptedMessages = await Promise.all(rawMessages.map(async (m: any) => {
            try {
              const wrappedKey = m.keys_header?.[user.id];
              if (!wrappedKey) return null;

              const { data: sender } = await supabase.from('users').select('public_key').eq('id', m.sender_id).single();
              if (!sender?.public_key) return null;

              const text = m.message_type === 'image'
                ? "[Image Attachment]"
                : await CryptoHelper.decrypt(m.encrypted_blob, wrappedKey, sender.public_key);

              return {
                text,
                created_at: m.created_at,
                is_mine: allProfileIds.includes(m.sender_id),
              };
            } catch (decError) {
              return {
                text: '[Encrypted Message]',
                created_at: m.created_at,
                is_mine: allProfileIds.includes(m.sender_id),
              };
            }
          }));
        }
      }

      const data = {
        profile,
        privacy,
        notification,
        chat,
        network,
        storage,
        messages: decryptedMessages.filter(Boolean)
      };

      const html = generateHTML(data);
      const { uri: localUri } = await Print.printToFileAsync({ html });

      // --- 2. DIRECT DOWNLOAD (ANDROID) ---
      if (Platform.OS === 'android') {
        // Use casting here because some TS definitions miss SAF on newer Expo SDKs
        const saf = (FileSystem as any).StorageAccessFramework;
        const encodingBase64 = (FileSystem as any).EncodingType?.Base64 || 'base64';

        if (saf) {
          const permissions = await saf.requestDirectoryPermissionsAsync();

          if (permissions.granted) {
            const base64 = await FileSystem.readAsStringAsync(localUri, {
              encoding: encodingBase64
            });
            const fileName = `social-media-report-${dayjs().format('YYYY-MM-DD-HHmm')}.pdf`;

            await saf.createFileAsync(
              permissions.directoryUri,
              fileName,
              'application/pdf',
              base64
            );
            toast({ message: 'Report saved to your device!', variant: 'success' });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            await shareAsync(localUri, { UTI: '.pdf', mimeType: 'application/pdf' });
          }
        } else {
          await shareAsync(localUri, { UTI: '.pdf', mimeType: 'application/pdf' });
        }
      } else {
        await shareAsync(localUri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }

    } catch (err: any) {
      console.error('[Export] Generation Failed:', err);
      toast({ message: 'Failed to generate PDF. Check connection.', variant: 'error' });
    } finally {
      setIsGenerating(false);
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
                <Text className="flex-1 text-[14px] font-bold text-foreground">
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
                    <Text className="text-[14px] font-bold text-muted-foreground">
                      Date Requested
                    </Text>
                    <Text className="text-[14px] font-black text-foreground">
                      {dayjs(request.requested_at).format('MMM D, YYYY')}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-[14px] font-bold text-muted-foreground">Status</Text>
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
                    <Text className="text-[14px] font-bold text-muted-foreground/90">
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
            <Text className="text-center text-[20px] font-bold text-foreground">
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
                <Text className="text-[15px] font-bold text-white">
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
