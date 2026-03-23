import { Link, Stack } from 'expo-router';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HelpCircle, ChevronLeft } from 'lucide-react-native';
import { useAppTheme } from '@/store/theme-store';
import { cn } from '@/lib/utils';
import * as Haptics from 'expo-haptics';

export default function NotFoundScreen() {
  const { brandColor, isDark } = useAppTheme();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Oops!', headerShown: false }} />
      
      <View className="flex-1 items-center justify-center px-8">
        {/* Hero Icon */}
        <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-brand/10 dark:bg-brand/20">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-brand/20 dark:bg-brand/30">
            <HelpCircle size={40} color={brandColor} strokeWidth={2.5} />
          </View>
        </View>

        {/* Text Content */}
        <Text className="mb-3 text-center text-[32px] font-bold tracking-tight text-foreground">
          Page Not Found
        </Text>
        <Text className="mb-10 text-center text-[16px] leading-[22px] text-muted-foreground">
          The link you followed may be broken, or the page may have been removed.
        </Text>

        {/* Action Button */}
        <Link href="/" asChild>
          <Pressable
            className="w-full flex-row items-center justify-center space-x-2 rounded-2xl bg-brand py-4 active:opacity-90"
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <ChevronLeft size={20} color="white" strokeWidth={2.5} />
            <Text className="text-base font-bold text-white">
              Back to Safety
            </Text>
          </Pressable>
        </Link>
      </View>

      {/* Footer Branding */}
      <View className="items-center pb-6">
        <Text className="text-[12px] font-bold tracking-widest text-muted-foreground/40 uppercase">
          Shivraj-K09 • Project-A
        </Text>
      </View>
    </SafeAreaView>
  );
}
