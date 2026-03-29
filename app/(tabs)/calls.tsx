import { Text } from '@/components/ui/text';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/shared/header';

export default function CallsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <Header title="Calls" />

      <View className="flex-1 items-center justify-center p-6 pb-20">
        <Text className="font-semibol text-center text-muted-foreground">
          Your call history will appear here.
        </Text>
      </View>
    </View>
  );
}
