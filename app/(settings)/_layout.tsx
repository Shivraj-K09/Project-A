import { Stack } from 'expo-router';
import { SettingsHeader } from '@/components/settings-header';
import { View } from 'react-native';
import { useAuth } from '@/contexts/auth-context';
import {
  SETTINGS_DIRECTORY,
  SETTINGS_STACK_ROUTE_ICONS,
  SETTINGS_STACK_ROUTE_TITLES,
} from '@/lib/settings-directory';

export default function SettingsLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <View className="flex-1 bg-background" />;
  }

  if (!isAuthenticated) {
    // Navigation is handled once in root _layout — avoids stacked Redirect + replace (triple onboarding mount)
    return <View className="flex-1 bg-background" />;
  }

  return (
    <Stack
      screenOptions={({ route }) => {
        const routeName = route.name;
        const isPreview = routeName === 'wallpaper-preview';

        const headerDestructive = SETTINGS_DIRECTORY.some(
          (e) => e.stackScreenKey === routeName && e.destructive
        );

        return {
          headerShown: !isPreview,
          header: () => (
            <SettingsHeader
              title={SETTINGS_STACK_ROUTE_TITLES[routeName] || 'Settings'}
              icon={SETTINGS_STACK_ROUTE_ICONS[routeName]}
              iconColor={headerDestructive ? '#ef4444' : undefined}
            />
          ),
          animation: 'slide_from_right',
        };
      }}
    />
  );
}
