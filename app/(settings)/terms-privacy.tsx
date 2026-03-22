import { Text } from '@/components/ui/text';
import { useThemeStore } from '@/store/theme-store';
import { FileText, Shield, Info } from 'lucide-react-native';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsPrivacyScreen() {
  const insets = useSafeAreaInsets();
  const brandColor = useThemeStore((state) => state.accentColor);

  return (
    <View className="flex-1 bg-background">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center justify-center px-10 py-12">
          <View 
            style={{ backgroundColor: brandColor + '10' }}
            className="mb-6 h-20 w-20 items-center justify-center rounded-[24px]"
          >
            <Shield size={40} color={brandColor} strokeWidth={1.5} />
          </View>
          <Text className="mb-2 text-center text-xl font-bold text-foreground">
            Legal Center
          </Text>
          <Text className="text-center text-[13px] font-medium leading-5 text-muted-foreground/60">
            Terms of Service and Privacy Policy documentation.
          </Text>
        </View>

        <View className="px-8 mt-10 items-center">
          <View className="flex-row items-center mb-4 opacity-20">
            <Info size={16} color={brandColor} className="mr-2" />
            <Text className="text-sm font-bold text-foreground">In Review</Text>
          </View>
          <View className="h-[2px] w-20 bg-border/5 rounded-full mb-6" />
          <Text className="text-center text-[14px] font-medium leading-6 text-muted-foreground/40 italic px-4">
            Our legal documents are currently being updated to reflect our commitment to privacy and transparency. Please check back later for the full disclosure.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
