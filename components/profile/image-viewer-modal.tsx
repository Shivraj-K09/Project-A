import { Image as ExpoImage } from 'expo-image';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/store/theme-store';
import { Haptic } from '@/lib/haptic-utils';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageViewerModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

/**
 * 🎨 Synchronized Minimalist Photo Viewer
 * Features: Header architecture matching 'Account' and 'Profile Details' screens.
 */
export const ImageViewerModal = React.memo(
  ({ visible, onClose, imageUrl }: ImageViewerModalProps) => {
    const insets = useSafeAreaInsets();
    const { isDark } = useAppTheme();

    if (!visible) return null;

    const handleClose = () => {
      Haptic.impact(Haptics.ImpactFeedbackStyle.Light);
      onClose();
    };

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        statusBarTranslucent
        onShow={() => Haptic.selection()}
        onRequestClose={handleClose}>
        <View className="flex-1 bg-background">
          {/* SOLID BACKGROUND LAYER - Matches Screen BG */}
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}
          />

          {/* 
             🏗️ SYNCHRONIZED HEADER
             Matches app/profile-details.tsx and (tabs)/account.tsx
          */}
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{ paddingTop: Math.max(insets.top, 20) }}
            className="absolute left-0 right-0 z-50 border-b border-brand/20 bg-background">
            <View className="flex-row items-center px-4 py-4">
              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.7}
                className="h-10 w-10 items-center justify-center">
                <ChevronLeft size={24} color={isDark ? '#fff' : '#000'} strokeWidth={2.5} />
              </TouchableOpacity>

              <View className="ml-1 h-8 justify-center">
                <Text className="font-semibol text-2xl tracking-tight text-foreground">
                  <Text className="font-semibol text-2xl text-brand">P</Text>rofile Photo
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* CENTERED IMAGE CARD */}
          <TouchableWithoutFeedback onPress={handleClose}>
            <View className="flex-1 items-center justify-center p-6 pt-20">
              <Animated.View
                entering={ZoomIn.duration(250)}
                exiting={ZoomOut.duration(200)}
                className="shadow-sm">
                <View
                  className="overflow-hidden bg-muted/10"
                  style={{
                    width: SCREEN_WIDTH - 48,
                    height: SCREEN_WIDTH - 48,
                    borderRadius: 16,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  }}>
                  {imageUrl ? (
                    <ExpoImage
                      source={{ uri: imageUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Text className="text-[12px] font-medium uppercase tracking-widest text-muted-foreground">
                        No Image
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    );
  }
);
