import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence 
} from 'react-native-reanimated';

export function ContactSkeleton() {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View className="mx-3 my-0.5 flex-row items-center gap-3 rounded-2xl border border-border bg-muted/50 p-2.5">
      <Animated.View 
        style={animatedStyle}
        className="h-12 w-12 rounded-full bg-muted-foreground/10 border border-border/50" 
      />
      
      <View className="flex-1 gap-2">
        <Animated.View 
          style={animatedStyle}
          className="h-4 w-1/3 rounded-lg bg-muted-foreground/10" 
        />
        <Animated.View 
          style={animatedStyle}
          className="h-3 w-1/2 rounded-lg bg-muted-foreground/5" 
        />
      </View>

      <Animated.View 
        style={animatedStyle}
        className="h-8 w-16 rounded-full bg-muted-foreground/10" 
      />
    </View>
  );
}

export function ContactListSkeleton() {
  return (
    <View className="flex-1 bg-background pt-2">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <ContactSkeleton key={i} />
      ))}
    </View>
  );
}
