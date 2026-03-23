import React, { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

interface DimmingSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  brandColor: string;
}

export const DimmingSlider = memo(({ value, onValueChange, brandColor }: DimmingSliderProps) => {
  const translateX = useSharedValue(0);
  const trackWidth = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const context = useSharedValue(0);

  // Sync initial value
  useEffect(() => {
    if (!isDragging.value && trackWidth.value > 0) {
      translateX.value = value * (trackWidth.value - 20);
    }
  }, [value, trackWidth.value, isDragging.value]);

  const onLayout = (event: any) => {
    const width = event.nativeEvent.layout.width;
    trackWidth.value = width;
    translateX.value = value * (width - 20);
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = translateX.value;
      isDragging.value = true;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event) => {
      const maxWidth = trackWidth.value - 20;
      let newX = context.value + event.translationX;
      newX = Math.max(0, Math.min(newX, maxWidth));
      translateX.value = newX;

      // Calculate step (snapped to 0.1)
      const rawValue = newX / maxWidth;
      const steppedValue = Math.round(rawValue * 10) / 10;
      runOnJS(onValueChange)(steppedValue);
    })
    .onEnd(() => {
      isDragging.value = false;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    });

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - 10 }],
    scale: withSpring(isDragging.value ? 1.2 : 1),
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: translateX.value,
  }));

  return (
    <View
      className="h-10 flex-1 justify-center"
      onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <Animated.View className="h-full justify-center">
          {/* Track background */}
          <View pointerEvents="none" className="mx-[10px] h-[3px] rounded-full bg-muted/30">
            {/* Progress fill */}
            <Animated.View
              style={[
                { backgroundColor: brandColor },
                animatedProgressStyle
              ]}
              className="h-full rounded-full"
            />
            {/* Thumb */}
            <Animated.View
              pointerEvents="none"
              style={[
                { borderColor: brandColor },
                animatedThumbStyle
              ]}
              className="absolute -top-[9px] h-5 w-5 rounded-full border-2 bg-white shadow-sm elevation-2 shadow-black/10"
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});
