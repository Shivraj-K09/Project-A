import { Haptic } from '@/lib/haptic-utils';
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, withLayoutContext } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Dimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Custom Components
import {
  CameraActiveIcon,
  CameraInactiveIcon,
  ChatActiveIcon,
  ChatInactiveIcon,
  MomentsActiveIcon,
  MomentsInactiveIcon,
  PhoneActiveIcon,
  PhoneInactiveIcon,
  UserActiveIcon,
  UserInactiveIcon,
} from '@/components/shared/icons';
import { TabButton } from '@/components/shared/tab-button';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/hooks/use-user';
import { useThemeStore } from '@/store/theme-store';

// Create the swipable navigator
const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

const TAB_CONFIG: Record<string, any> = {
  chats: { ActiveIcon: ChatActiveIcon, InactiveIcon: ChatInactiveIcon },
  moments: { ActiveIcon: MomentsActiveIcon, InactiveIcon: MomentsInactiveIcon },
  camera: { ActiveIcon: CameraActiveIcon, InactiveIcon: CameraInactiveIcon },
  calls: { ActiveIcon: PhoneActiveIcon, InactiveIcon: PhoneInactiveIcon },
  account: { ActiveIcon: UserActiveIcon, InactiveIcon: UserInactiveIcon },
};

const VISUAL_ORDER = ['chats', 'moments', 'camera', 'calls', 'account'];

function CustomTabBar({ state, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const brandColor = useThemeStore((s) => s.accentColor);
  const isDark = colorScheme === 'dark';
  const BAR_HEIGHT = 68;
  const TAB_BAR_BOTTOM = insets.bottom > 0 ? insets.bottom + 8 : 20;
  const wallColor = isDark ? 'hsl(0 0% 3.9%)' : 'hsl(0 0% 100%)';
  const transparentColor = isDark ? 'hsla(0, 0%, 3.9%, 0)' : 'hsla(0, 0%, 100%, 0)';

  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0">
      <View
        pointerEvents="none"
        className="absolute inset-x-0 bottom-0 overflow-hidden"
        style={{ height: TAB_BAR_BOTTOM + BAR_HEIGHT + 20, zIndex: 90 }}>
        <LinearGradient
          colors={[transparentColor, wallColor, wallColor]}
          locations={[0, 0.4, 1]}
          className="flex-1"
        />
      </View>

      {/* Floating Tab Bar Container */}
      <View
        pointerEvents="box-none"
        className="absolute inset-x-3"
        style={{ bottom: TAB_BAR_BOTTOM, height: BAR_HEIGHT, zIndex: 100 }}>
        <View className="flex-1 flex-row items-center overflow-hidden rounded-full border border-border bg-background">
          {VISUAL_ORDER.map((name) => {
            const config = TAB_CONFIG[name];
            const routeIndex = state.routes.findIndex((r) => r.name === name);
            const isFocused = routeIndex !== -1 && state.index === routeIndex;
            const route =
              routeIndex !== -1 ? state.routes[routeIndex] : { name, key: name, params: {} };

            const onPress = () => {
              if (name === 'camera') {
                Haptic.impact(Haptics.ImpactFeedbackStyle.Light);
                router.push('/camera');
                return;
              }

              if (routeIndex === -1) return;
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <TabButton
                key={name}
                route={route}
                isFocused={isFocused}
                config={config}
                onPress={onPress}
                brandColor={brandColor}
                isDark={isDark}
                profile={profile}
                user={user}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { width } = Dimensions.get('window');

  if (isLoading || !isAuthenticated) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <View className="flex-1 border bg-background">
      <MaterialTopTabs
        tabBar={(props: MaterialTopTabBarProps) => <CustomTabBar {...props} />}
        tabBarPosition="bottom"
        keyboardDismissMode="on-drag"
        initialLayout={{ width }}
        screenOptions={{ lazy: true }}>
        <MaterialTopTabs.Screen name="chats" />
        <MaterialTopTabs.Screen name="moments" />
        <MaterialTopTabs.Screen name="calls" />
        <MaterialTopTabs.Screen name="account" />
      </MaterialTopTabs>
    </View>
  );
}
