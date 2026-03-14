import { Text } from '@/components/ui/text';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: Math.max(insets.top, 20) }}>
      {/* ─── Header ────────────────────────────────────────── */}
      <View className="border-b border-brand/20 px-6 py-4">
        <Text className="text-2xl font-bold tracking-tight text-foreground">
          <Text className="text-2xl font-bold text-brand">C</Text>hats
        </Text>
      </View>

      <View className="flex-1 items-center justify-center pb-24">
        <Text className="text-center text-base text-muted-foreground">No chats yet.</Text>
      </View>
    </View>
  );
}
