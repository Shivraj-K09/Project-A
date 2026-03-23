import React, { memo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { X, Check } from 'lucide-react-native';

interface UsernameStatusProps {
  username: string;
  isCheckingUsername: boolean;
  usernameError: string | null;
  isUsernameAvailable: boolean | undefined;
}

export const UsernameStatus = memo(
  ({
    username,
    isCheckingUsername,
    usernameError,
    isUsernameAvailable,
  }: UsernameStatusProps) => {
    if (username.length === 0) return null;
    if (isCheckingUsername) return <ActivityIndicator size="small" color="#6366f1" />;

    if (usernameError) {
      return (
        <View className="flex-row items-center gap-1">
          <X size={13} color="#ef4444" strokeWidth={3} />
          <Text className="text-[11px] font-semibold text-red-500">{usernameError}</Text>
        </View>
      );
    }

    if (isUsernameAvailable === true) {
      return (
        <View className="flex-row items-center gap-1">
          <Check size={13} color="#22c55e" strokeWidth={3} />
          <Text className="text-[11px] font-semibold text-green-500">Available</Text>
        </View>
      );
    }
    return null;
  }
);
