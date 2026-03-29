import React, { useEffect, useCallback, useState } from 'react';
import { Text } from '@/components/ui/text';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  BackHandler,
  Modal,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Haptic } from '@/lib/haptic-utils';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const SPRING_CONFIG = {
  damping: 50,
  stiffness: 300,
  mass: 1,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.1,
};

export function Drawer({ visible, onClose, children, title }: DrawerProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const keyboardOffset = useSharedValue(0);
  const opacity = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);

  const closeDrawer = useCallback(() => {
    Keyboard.dismiss();
    Haptic.impact(Haptics.ImpactFeedbackStyle.Light);

    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(onClose)();
      runOnJS(setMounted)(false);
    });
    opacity.value = withTiming(0, { duration: 250 });
  }, [onClose]);

  // 🛡️ MANUAL KEYBOARD HANDLER
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, (e) => {
      keyboardOffset.value = e.endCoordinates.height;
    });

    const hideListener = Keyboard.addListener(hideEvent, () => {
      keyboardOffset.value = 0;
    });

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = withSpring(0, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: 200 });
    } else if (mounted) {
      closeDrawer();
    }
  }, [visible, mounted, closeDrawer]);

  // Android Hardware Back
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        closeDrawer();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [visible, closeDrawer]);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        runOnJS(closeDrawer)();
      } else {
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const rDrawerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value - keyboardOffset.value }],
    };
  });

  const rBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={closeDrawer}
      statusBarTranslucent={true}>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        {/* Backdrop Layer */}
        <View style={StyleSheet.absoluteFill}>
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <Animated.View className="flex-1 bg-background/60" style={rBackdropStyle} />
          </TouchableWithoutFeedback>
        </View>

        <View style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
          <GestureDetector gesture={gesture}>
            <Animated.View
              className="rounded-t-[32px] bg-background shadow-2xl"
              style={[rDrawerStyle, { minHeight: 200, maxHeight: SCREEN_HEIGHT * 0.85 }]}>
              <View className="items-center py-4">
                <View className="h-1.5 w-12 rounded-full bg-muted" />
              </View>

              {title && (
                <View className="px-6 pb-4">
                  <Text className="font-semibol text-lg text-foreground">{title}</Text>
                </View>
              )}

              <ScrollView
                className="px-6 pb-12"
                contentContainerStyle={{ flexGrow: 0 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                {children}
              </ScrollView>
            </Animated.View>
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
