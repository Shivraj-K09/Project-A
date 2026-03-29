import { Text } from '@/components/ui/text';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/shared/header';

export default function MomentsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <Header title="Moments" />

      <View className="flex-1 items-center justify-center p-6 pb-20">
        <Text className="font-semibol text-center text-muted-foreground">
          Your moments will appear here.
        </Text>
      </View>
    </View>
  );
}
