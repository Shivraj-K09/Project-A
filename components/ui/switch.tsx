import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  useSharedValue,
  interpolateColor,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { useThemeStore } from '@/store/theme-store';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ checked = false, onCheckedChange, disabled = false }: SwitchProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const progress = useSharedValue(checked ? 1 : 0);
  const brandColor = useThemeStore((state) => state.accentColor);
  const { Haptic } = require('@/lib/haptic-utils');

  const inactiveColor = isDark ? '#3f3f46' : '#e4e4e7';

  useEffect(() => {
    // Faster color transition
    progress.value = withTiming(checked ? 1 : 0, {
      duration: 200,
    });
  }, [checked]);

  const animatedTrackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(progress.value, [0, 1], [inactiveColor, brandColor]);

    return {
      backgroundColor,
    };
  });

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      // Snappier spring for the thumb
      transform: [
        {
          translateX: withSpring(progress.value * 18, {
            damping: 20,
            stiffness: 250,
            mass: 0.5,
          }),
        },
      ],
    };
  });

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptic.selection();
        onCheckedChange?.(!checked);
      }}
      style={{ opacity: disabled ? 0.5 : 1 }}
      hitSlop={10}>
      <Animated.View
        style={[
          {
            width: 42,
            height: 24,
            borderRadius: 12,
            padding: 2,
            justifyContent: 'center',
          },
          animatedTrackStyle,
        ]}>
        <Animated.View
          style={[
            {
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#ffffff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 2.5,
              elevation: 2,
            },
            animatedThumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
