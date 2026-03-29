import React, { useMemo, useEffect, useRef, useState } from 'react';
import { View, Pressable, Modal, Animated, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Chat } from '@/lib/demo-data';
import { UserPlus } from 'lucide-react-native';
import { Icon, UserIcon } from '@/components/ui/icon';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

interface ContactProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: Chat | null;
  onInvite?: (id: string) => void;
}

export function ContactProfileModal({
  visible,
  onClose,
  user,
  onInvite,
}: ContactProfileModalProps) {
  // Kinetic Theme Entry Vectors
  const animValue = useRef(new Animated.Value(0)).current;
  const [activeVector, setActiveVector] = useState(() => ({
    rot: '-10deg',
    tx: -150,
    ty: 400,
  }));

  useEffect(() => {
    if (visible) {
      // Pick a unique 'throw' vector per launch
      setActiveVector({
        rot: (Math.random() - 0.5) * 20 + 'deg',
        tx: (Math.random() - 0.5) * 350,
        ty: 450 + Math.random() * 100,
      });

      animValue.setValue(0);
      Animated.spring(animValue, {
        toValue: 1,
        damping: 16,
        stiffness: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // High-Resolution Upscale Bridge
  const highResAvatar = useMemo(() => {
    if (!user?.avatar) return null;
    // Intercept low-res Unsplash thumbnails and upgrade to HD (200px -> 800px)
    if (user.avatar.includes('w=200')) {
      return user.avatar.replace('w=200', 'w=800').replace('h=200', 'h=600');
    }
    return user.avatar;
  }, [user]);

  if (!user) return null;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Snappy kinetic exit (150ms to ensure no perceived delay)
    Animated.timing(animValue, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const cardStyle = {
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [activeVector.ty, 0],
        }),
      },
      {
        translateX: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [activeVector.tx, 0],
        }),
      },
      {
        rotate: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [activeVector.rot, '0deg'],
        }),
      },
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
    opacity: animValue,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent>
      <View className="flex-1">
        {/* Animated Premium Blur Backdrop (Stable Cross-Platform Mapping) */}
        <Animated.View style={{ opacity: animValue }} className="absolute inset-0 bg-background/60">
          <BlurView intensity={80} tint="dark" className="flex-1" />
        </Animated.View>

        {/* Kinetic interaction and card layer */}
        <Animated.View
          style={{ opacity: animValue }}
          className="flex-1 items-center justify-center px-6">
          {/* Click Outside to Close Trigger */}
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

          {/* Strictly Theme Compliant Professional Card */}
          <Animated.View
            style={cardStyle}
            className="w-full max-w-[320px] overflow-hidden rounded-[30px] border-2 border-border bg-card shadow-2xl">
            {/* High-Fidelity Expo Cover Header */}
            <View className="relative h-[220px] w-full overflow-hidden bg-muted">
              {highResAvatar ? (
                <ExpoImage
                  source={{ uri: highResAvatar }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={300}
                  priority="high"
                  cachePolicy="disk"
                />
              ) : (
                <View className="flex-1 items-center justify-center bg-brand">
                  <Icon as={UserIcon} size={80} color="white" />
                </View>
              )}
            </View>

            {/* Minimal Invite Separator */}
            <View className="h-[1px] w-full border-b border-dashed border-border" />

            {/* Theme-Driven Identity Action Section */}
            <View className="p-8">
              <View className="mb-8 items-center">
                <Text
                  className="text-center text-[26px] font-semibold tracking-tight text-foreground"
                  numberOfLines={1}>
                  {user.name}
                </Text>
                {!user.canInvite && (
                  <Text className="mt-2 text-center text-[15px] leading-5 text-muted-foreground/80 px-4">
                    {user.about || 'Available on Social Media'}
                  </Text>
                )}
              </View>

              {/* Action Interactions (Design Locked) */}
              {user.canInvite ? (
                <Button
                  className="h-14 w-full rounded-2xl bg-brand shadow-xl shadow-brand/20 active:scale-[0.98] active:opacity-90"
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onInvite?.(user.id);
                    onClose();
                  }}>
                  <View className="flex-row items-center gap-2">
                    <Icon as={UserPlus} size={18} className="text-white" />
                    <Text className="text-[16px] font-semibold text-white">Invite Now</Text>
                  </View>
                </Button>
              ) : (
                <Button
                  className="h-14 w-full rounded-2xl bg-brand shadow-xl shadow-brand/20 active:scale-[0.98] active:opacity-90"
                  onPress={handleClose}>
                  <Text className="text-[16px] font-semibold text-white">Start Message</Text>
                </Button>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}
