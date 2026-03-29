import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/hooks/use-user';
import { useStableNavigate } from '@/lib/use-stable-navigate';
import { useAppTheme } from '@/store/theme-store';
import { AlertTriangle } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function DeactivatedAccountBanner() {
  const stableNavigate = useStableNavigate();
  const { isAuthenticated } = useAuth();
  const { data: profile, isLoading, isFetching } = useUserProfile();
  const { brandColor, isDark } = useAppTheme();

  if (!isAuthenticated || isLoading || !profile?.is_deactivated) {
    return null;
  }

  const tint = isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.18)';
  const border = isDark ? 'rgba(251, 191, 36, 0.35)' : 'rgba(217, 119, 6, 0.4)';

  return (
    <SafeAreaView
      edges={['top']}
      style={{ backgroundColor: tint, borderBottomWidth: 1, borderBottomColor: border }}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens your account reactivation screen"
        onPress={() => stableNavigate('/account-center/reactivate')}
        disabled={isFetching}
        className="flex-row items-center gap-2.5 px-4 py-3 active:opacity-80">
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: (isDark ? '#78350f' : '#fef3c7') + 'cc' }}>
          <AlertTriangle size={18} color={brandColor} strokeWidth={2.2} />
        </View>
        <View className="flex-1">
          <Text className="font-semibol text-[14px] text-foreground">Account deactivated</Text>
          <Text className="mt-0.5 text-[12px] font-medium leading-snug text-muted-foreground">
            Your profile is hidden from others. Tap to reactivate.
          </Text>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}
