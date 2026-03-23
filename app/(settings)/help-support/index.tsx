import { SettingsRow } from '@/components/settings/settings-row';
import { Text } from '@/components/ui/text';
import { SettingsGroup, cnSettingsMenuItem } from '@/lib/settings-ui';
import { useStableNavigate } from '@/lib/use-stable-navigate';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/store/theme-store';
import {
  Activity,
  ChevronRight,
  Code,
  ExternalLink,
  FileText,
  MessageCircle,
} from 'lucide-react-native';
import { memo } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const stableNavigate = useStableNavigate();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}>
        {/* HELP SECTION */}
        <View className="mb-8">
          <View className="mb-2 px-8">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-brand">
              Assistance
            </Text>
          </View>
          <SettingsGroup className="mx-8">
            <SettingsRow
              icon={MessageCircle}
              title="Start Support Chat"
              subtitle="Direct line to our human agents"
              onPress={() => stableNavigate('/help-support/chat')}
            />
          </SettingsGroup>
        </View>

        {/* FEEDBACK SECTION */}
        <View className="mb-8">
          <View className="mb-2 px-8">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-brand">
              Feedback
            </Text>
          </View>
          <SettingsGroup className="mx-8">
            <SettingsRow
              icon={ExternalLink}
              title="Feature Request"
              subtitle="Help us improve this application"
              onPress={() => stableNavigate('/help-support/feature-request')}
            />
            <SettingsRow
              icon={FileText}
              title="Terms & Privacy"
              subtitle="Your data and legal policies"
              onPress={() => stableNavigate('/help-support/terms-privacy')}
            />
          </SettingsGroup>
        </View>

        {/* DIAGNOSTICS SECTION */}
        <View className="mb-8">
          <View className="mb-2 px-8">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-brand">
              Technical
            </Text>
          </View>
          <SettingsGroup className="mx-8">
            <SettingsRow
              icon={Activity}
              title="Network Diagnostic"
              subtitle="Check connection health"
              onPress={() => stableNavigate('/storage-data/network-diagnostic')}
            />
            <SettingsRow
              icon={Code}
              title="Version Info"
              subtitle="Development Build | v1.0.0"
              onPress={() => {}}
            />
          </SettingsGroup>
        </View>
      </ScrollView>
    </View>
  );
}

// Local SupportRow replaced by centralized SettingsRow component.
