import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Icon, UserIcon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Chat } from '@/lib/demo-data';
import * as SMS from 'expo-sms';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';

interface InviteDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: Chat | null;
  onInvite?: (id: string, message: string) => void;
}

export function InviteDrawer({ visible, onClose, user, onInvite }: InviteDrawerProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Default message when user changes
  React.useEffect(() => {
    if (user) {
      // Premium invitation text
      setMessage(
        `Hey ${user.name}! Join me on Social Media. It's an amazing new way to stay connected! 🚀\n\nDownload here: https://socialmedia.app/get`
      );
    }
  }, [user]);

  const handleSendSMS = async () => {
    if (!user) return;

    try {
      setIsSending(true);
      const isAvailable = await SMS.isAvailableAsync();
      
      if (isAvailable) {
        // Use the original, formatted phone number from the contacts list
        // This allows the OS to correctly identify the contact name in the To field
        const phoneNumber = user.phoneNumber;
        
        if (!phoneNumber) {
          Alert.alert('Error', 'No valid phone number found for this contact.');
          return;
        }

        const { result } = await SMS.sendSMSAsync([phoneNumber], message);
        
        if (result === 'sent') {
          onInvite?.(user.id, message);
        }
      } else {
        Alert.alert('Error', 'SMS is not available on this device');
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      Alert.alert('Error', 'An unexpected error occurred while sending the invite.');
    } finally {
      setIsSending(false);
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Drawer visible={visible} onClose={onClose} title="Send SMS Invite">
      <View className="items-center py-6">
        <Avatar className="h-24 w-24 border-2 border-brand/20 shadow-xl" alt={user.name}>
          <AvatarImage source={user.avatar ? { uri: user.avatar } : undefined} />
          <AvatarFallback className="bg-brand/5">
            <Icon as={UserIcon} size={48} className="text-brand/30" />
          </AvatarFallback>
        </Avatar>

        <Text className="font-semibol mt-4 text-xl text-foreground">{user.name}</Text>
        <View className="mt-1 flex-row items-center gap-1.5 rounded-full bg-muted/30 px-3 py-1">
          <Icon as={UserIcon} size={12} className="text-muted-foreground/60" />
          <Text className="text-[11px] font-bold uppercase tracking-[0.5px] text-muted-foreground/60">
            Contacts List
          </Text>
        </View>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="mb-2 ml-1 text-sm font-medium text-muted-foreground">
            Invitation Message
          </Text>
          <Input
            multiline
            numberOfLines={4}
            className="h-32 items-start rounded-2xl border-none bg-muted/40 p-4 text-base leading-6"
            placeholder="Write your invitation message..."
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />
        </View>

        <View className="flex-row gap-3 pt-6">
          <Button 
            variant="ghost" 
            className="h-14 flex-1 rounded-2xl bg-muted/30 active:opacity-80" 
            onPress={onClose}
            disabled={isSending}
          >
            <Text className="font-semibol text-[16px] text-foreground">Cancel</Text>
          </Button>
          <Button
            className="h-14 flex-1 rounded-2xl bg-brand shadow-lg shadow-brand/20 active:opacity-80"
            onPress={handleSendSMS}
            disabled={isSending}
          >
            <Text className="font-semibol text-[16px] text-white">
              {isSending ? 'Syncing...' : 'Send Invite'}
            </Text>
          </Button>
        </View>
      </View>
    </Drawer>
  );
}
