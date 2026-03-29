import { Header } from '@/components/shared/header';
import { useAuth } from '@/contexts/auth-context';
import {
  SETTINGS_DIRECTORY,
  SETTINGS_STACK_ROUTE_ICONS,
  SETTINGS_STACK_ROUTE_TITLES,
} from '@/lib/settings-directory';
import { Stack } from 'expo-router';
import { View } from 'react-native';

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
        const isPreview = routeName === 'chats/wallpaper-preview';

        const isSupportChat = routeName === 'support-management/[id]';
        const headerDestructive = SETTINGS_DIRECTORY.some(
          (e) => e.stackScreenKey === routeName && e.destructive
        );

        return {
          headerShown: !isPreview,
          header: () => (
            <Header
              title={
                (route.params as any)?.title || 
                SETTINGS_STACK_ROUTE_TITLES[routeName] || 
                'Settings'
              }
              avatar={(route.params as any)?.avatar}
              icon={SETTINGS_STACK_ROUTE_ICONS[routeName]}
              iconColor={headerDestructive ? '#ef4444' : undefined}
              showBackButton={true}
              small={isSupportChat}
            />
          ),
          animation: 'slide_from_right',
        };
      }}
    />
  );
}
