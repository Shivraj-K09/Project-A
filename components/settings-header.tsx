import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useThemeStore } from '@/store/theme-store';
import { Haptic } from '@/lib/haptic-utils';

interface SettingsHeaderProps {
  title: string;
  icon?: any;
  iconColor?: string;
  rightElement?: React.ReactNode;
}

export function SettingsHeader({
  title,
  icon: Icon,
  iconColor,
  rightElement,
}: SettingsHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const brandColor = useThemeStore((state) => state.accentColor);
  const isDark = colorScheme === 'dark';

  return (
    <View style={{ paddingTop: insets.top }} className="border-b border-border/5 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-1 flex-row items-center">
          <TouchableOpacity
            onPress={() => {
              Haptic.selection();
              router.back();
            }}
            activeOpacity={0.7}
            className="-ml-2 mr-2 h-10 w-10 items-center justify-center">
            <ChevronLeft size={28} color={isDark ? '#ffffff' : '#000000'} strokeWidth={2} />
          </TouchableOpacity>

          <View className="flex-row items-center">
            {Icon && (
              <View className="mr-3 h-8 w-8 items-center justify-center rounded-lg bg-brand/10">
                <Icon size={18} color={iconColor || brandColor} strokeWidth={2.5} />
              </View>
            )}
            <Text className="font-semibol text-xl tracking-tight text-foreground">{title}</Text>
          </View>
        </View>

        {rightElement && <View>{rightElement}</View>}
      </View>
    </View>
  );
}
