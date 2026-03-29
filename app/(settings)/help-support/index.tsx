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
import appConfig from '../../(settings)/../../app.json';
import Constants from 'expo-constants';

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
            <Text className="font-semibol text-[11px] uppercase tracking-widest text-brand">
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
            <Text className="font-semibol text-[11px] uppercase tracking-widest text-brand">
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
            <Text className="font-semibol text-[11px] uppercase tracking-widest text-brand">
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
              subtitle={`Build · v${appConfig.expo.version}`}
              onPress={() => {}}
            />
          </SettingsGroup>
        </View>

        {/* Dynamic Footer */}
        <View className="mb-10 mt-12 items-center justify-center">
          <View className="mb-2 flex-row items-center gap-1.5 opacity-45">
            <View className="h-[1px] w-4 bg-muted-foreground" />
            <Text className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              {appConfig.expo.name}
            </Text>
            <View className="h-[1px] w-4 bg-muted-foreground" />
          </View>
          <Text className="font-semibol text-[9px] uppercase tracking-[0.15em] text-muted-foreground/60">
            Release v{appConfig.expo.version}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Local SupportRow replaced by centralized SettingsRow component.
