import { Image as ExpoImage } from 'expo-image';
import { X } from 'lucide-react-native';
import React from 'react';
import { Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ImageViewerModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const ImageViewerModal = React.memo(
  ({ visible, onClose, imageUrl }: ImageViewerModalProps) => {
    const insets = useSafeAreaInsets();

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        statusBarTranslucent
        onRequestClose={onClose}>
        <View className="flex-1">
          <TouchableWithoutFeedback onPress={onClose}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              className="absolute inset-0 bg-black/90"
            />
          </TouchableWithoutFeedback>

          <View className="flex-1 items-center justify-center">
            <Animated.View
              entering={ZoomIn.duration(250).easing(Easing.out(Easing.quad))}
              exiting={ZoomOut.duration(200).easing(Easing.in(Easing.quad))}
              className="aspect-square w-full px-4">
              {imageUrl ? (
                <ExpoImage
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', height: '100%', borderRadius: 24 }}
                  contentFit="cover"
                  transition={200}
                />
              ) : null}
            </Animated.View>

            <Animated.View
              entering={FadeIn.delay(100).duration(300)}
              exiting={FadeOut.duration(200)}
              style={{ top: insets.top + 10 }}
              className="absolute left-0 right-0 flex-row items-center justify-between px-6">
              <TouchableOpacity
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <X size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-base font-bold text-white shadow-sm">Profile Photo</Text>
              <View className="w-10" />
            </Animated.View>
          </View>
        </View>
      </Modal>
    );
  }
);
