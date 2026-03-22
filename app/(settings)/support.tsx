import { Text } from '@/components/ui/text';
import { useAppTheme, useThemeStore } from '@/store/theme-store';
import { cn } from '@/lib/utils';
import {
  Activity,
  ChevronRight,
  FileText,
  HelpCircle,
  LifeBuoy,
  MessageCircle,
  ExternalLink,
  Code,
} from 'lucide-react-native';
import { memo, forwardRef } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStableNavigate } from '@/lib/use-stable-navigate';
import { SETTINGS_MENU_LIST_CLASS, cnSettingsMenuCard } from '@/lib/settings-ui';

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const stableNavigate = useStableNavigate();
  const brandColor = useThemeStore((state) => state.accentColor);

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
          <View className={cn('px-8', SETTINGS_MENU_LIST_CLASS)}>
            <SupportRow
              icon={MessageCircle}
              title="Start Support Chat"
              subtitle="Direct line to our human agents"
              onPress={() => stableNavigate('/(settings)/support-chat')}
            />
            {/* 
            <SupportRow
              icon={HelpCircle}
              title="Knowledge Base"
              subtitle="Searchable guides and tutorials"
              onPress={() => stableNavigate('/(settings)/(knowledge)/base')}
              isLast
            /> 
            */}
          </View>
        </View>

        {/* FEEDBACK SECTION */}
        <View className="mb-8">
          <View className="mb-2 px-8">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-brand">
              Feedback
            </Text>
          </View>
          <View className={cn('px-8', SETTINGS_MENU_LIST_CLASS)}>
            <SupportRow
              icon={ExternalLink}
              title="Feature Request"
              subtitle="Help us improve this application"
              onPress={() => stableNavigate('/(settings)/feature-request')}
            />
            <SupportRow
              icon={FileText}
              title="Terms & Privacy"
              subtitle="Your data and legal policies"
              onPress={() => stableNavigate('/(settings)/terms-privacy')}
            />
          </View>
        </View>

        {/* DIAGNOSTICS SECTION */}
        <View className="mb-8">
          <View className="mb-2 px-8">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-brand">
              Technical
            </Text>
          </View>
          <View className={cn('px-8', SETTINGS_MENU_LIST_CLASS)}>
            <SupportRow
              icon={Activity}
              title="Network Diagnostic"
              subtitle="Check connection health"
              onPress={() => stableNavigate('/(settings)/network-diagnostic')}
            />
            <SupportRow
              icon={Code}
              title="Version Info"
              subtitle="Development Build | v1.0.0"
              onPress={() => {}}
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const SupportRow = memo(
  forwardRef(({ icon: Icon, title, subtitle, onPress, isLast: _isLast, ...props }: any, ref: any) => {
    const { brandColor, isDark } = useAppTheme();

    return (
      <TouchableOpacity
        ref={ref}
        activeOpacity={0.7}
        onPress={onPress}
        className={cn(cnSettingsMenuCard(), 'flex-row items-center')}
        {...props}>
        <View
          style={{ backgroundColor: brandColor + '10' }}
          className="mr-4 h-10 w-10 items-center justify-center rounded-xl">
          <Icon size={20} color={brandColor} strokeWidth={2.2} />
        </View>

        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-foreground tracking-tight">{title}</Text>
          <Text className="mt-0.5 text-[11px] font-medium text-muted-foreground/40">
            {subtitle}
          </Text>
        </View>

        <ChevronRight size={14} color={isDark ? '#27272a' : '#d4d4d8'} />
      </TouchableOpacity>
    );
  })
);
