import { Text } from '@/components/ui/text';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, UserCircle } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useThemeStore } from '@/store/theme-store';
import { SettingsHeader } from '@/components/settings-header';

export default function AccountManagementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const brandColor = useThemeStore((state) => state.accentColor);
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <View className="items-center justify-center px-10 pt-20">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-brand/10">
            <UserCircle size={40} color={brandColor} strokeWidth={1.5} />
          </View>
          <Text className="mb-2 text-center text-xl font-bold text-foreground">
            Account Management
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            Manage your account deactivation, deletion, and personal data exports here. Feature
            coming soon.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
