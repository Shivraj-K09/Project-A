import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAppTheme, useThemeStore } from '@/store/theme-store';
import { useIsFocused } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Plus, Send } from 'lucide-react-native';
import { useEffect } from 'react';
import { Keyboard, Platform, View, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onPlusPress?: () => void;
  placeholder?: string;
  footerMessage?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function ChatInput({
  value,
  onChangeText,
  onSend,
  onPlusPress,
  placeholder = 'Message...',
  footerMessage,
  disabled = false,
  children,
}: ChatInputProps) {
  const insets = useSafeAreaInsets();
  const brandColor = useThemeStore((state) => state.accentColor);
  const { isDark } = useAppTheme();
  const isFocused = useIsFocused();

  // Manual tracking to avoid useAnimatedKeyboard bugs on Android
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      if (isFocused && !disabled) {
        keyboardHeight.value = withTiming(e.endCoordinates.height, {
          duration: Platform.OS === 'ios' ? 300 : 250,
          easing: Easing.out(Easing.quad),
        });
      }
    };

    const onHide = () => {
      keyboardHeight.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.quad),
      });
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [isFocused, disabled]);

  // Aggressive reset on focus change
  useEffect(() => {
    if (!isFocused || disabled) {
      keyboardHeight.value = 0;
      Keyboard.dismiss();
    }
  }, [isFocused, disabled]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: keyboardHeight.value,
    };
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedContainerStyle]}>
      <View className="flex-1">{children}</View>

      <BlurView
        intensity={Platform.OS === 'ios' ? 25 : 0}
        tint={isDark ? 'dark' : 'light'}
        className="border-t border-border/10 bg-background/80">
        <View style={{ paddingBottom: Math.max(insets.bottom, 14) }} className="px-4 pt-4">
          <View className="flex-row items-end gap-3">
            <View
              className={cn(
                'relative flex-1 overflow-hidden rounded-[32px] border',
                disabled ? 'border-border/10 bg-muted/50' : 'border-border/5 bg-muted'
              )}>
              <Textarea
                value={value}
                onChangeText={onChangeText}
                placeholder={disabled ? 'Chat ended' : placeholder}
                editable={!disabled}
                className={cn(
                  "max-h-[160px] min-h-[48px] border-0 bg-transparent py-3.5 pl-14 pr-4 text-[16px] font-medium text-foreground",
                  disabled && "opacity-40"
                )}
                placeholderClassName="text-muted-foreground/40"
              />

              <Button
                disabled={disabled}
                className={cn(
                  'absolute bottom-1 left-1 h-10 w-10 items-center justify-center rounded-full !bg-transparent',
                  disabled && "opacity-0"
                )}
                style={{ zIndex: 1000, elevation: 10 }}
                onPress={onPlusPress}>
                <Plus size={20} color={brandColor} strokeWidth={3} />
              </Button>
            </View>

            <Button
              size="icon"
              disabled={disabled || !value.trim()}
              onPress={onSend}
              className={cn(
                'h-12 w-12 rounded-full shadow-lg',
                (disabled || !value.trim()) ? 'opacity-30' : 'opacity-100'
              )}
              style={{ backgroundColor: brandColor }}>
              <Send size={18} color="white" strokeWidth={3} />
            </Button>
          </View>

          {footerMessage && (
            <View className="mt-3 flex-row items-center justify-center opacity-30">
              <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">
                {footerMessage}
              </Text>
            </View>
          )}
        </View>
      </BlurView>
    </Animated.View>
  );
}
