import { Text } from '@/components/ui/text';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CallsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: Math.max(insets.top, 20) }}>
      <View className="border-b border-brand/20 px-6 py-4">
        <Text className="text-2xl font-bold tracking-tight text-foreground">
          <Text className="text-2xl font-bold text-brand">C</Text>alls
        </Text>
      </View>
      <View className="flex-1 items-center justify-center p-6 pb-20">
        <Text className="text-center text-muted-foreground">
          Your call history will appear here.
        </Text>
      </View>
    </View>
  );
}
