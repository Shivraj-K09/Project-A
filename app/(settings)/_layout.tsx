import { Stack } from 'expo-router';
import { Redirect } from 'expo-router';
import { SettingsHeader } from '@/components/settings-header';
import { View } from 'react-native';
import {
  MessageSquare,
  Bell,
  Shield,
  ShieldCheck,
  Monitor,
  LifeBuoy,
  UserCircle,
  Lock,
  Image as ImageIcon,
  Database,
  Trash2,
  HardDrive,
  Globe,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';

const ROUTE_ICONS: Record<string, any> = {
  'chat-settings': MessageSquare,
  'chat-wallpaper': ImageIcon,
  'network-usage': Database,
  'manage-storage': Trash2,
  'notification-settings': Bell,
  'privacy-settings': Shield,
  'security-settings': ShieldCheck,
  'two-step-verification': Lock,
  'appearance-settings': Monitor,
  'language-settings': Globe,
  support: LifeBuoy,
  'account-management': UserCircle,
};

const ROUTE_TITLES: Record<string, string> = {
  'chat-settings': 'Chats & Media',
  'chat-wallpaper': 'Chat Wallpaper',
  'network-usage': 'Network Usage',
  'manage-storage': 'Manage Storage',
  'notification-settings': 'Notifications',
  'privacy-settings': 'Privacy',
  'security-settings': 'Security',
  'two-step-verification': 'Two-Step Verification',
  'appearance-settings': 'Appearance',
  'language-settings': 'App Language',
  support: 'Help & Support',
  'account-management': 'Account Center',
};

export default function SettingsLayout() {
  const { isAuthenticated, isLoading, requiresTwoStepVerification, isTwoStepVerified } = useAuth();

  if (isLoading) {
    return <View className="flex-1 bg-background" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (requiresTwoStepVerification && !isTwoStepVerified) {
    return <Redirect href="/(auth)/two-step-verify" />;
  }

  return (
    <Stack
      screenOptions={({ route }) => {
        const routeName = route.name;
        const isPreview = routeName === 'wallpaper-preview';

        return {
          headerShown: !isPreview,
          header: () => (
            <SettingsHeader
              title={ROUTE_TITLES[routeName] || 'Settings'}
              icon={ROUTE_ICONS[routeName]}
            />
          ),
          animation: 'slide_from_right',
        };
      }}
    />
  );
}
