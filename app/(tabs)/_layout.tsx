import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import * as Haptics from 'expo-haptics';
import { useRouter, withLayoutContext } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Dimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import React, { useMemo, useCallback } from 'react';

// Custom Components
import { TabButton } from '@/components/shared/tab-button';
import {
  CameraBoldIcon,
  ChatTabIcon,
  MomentsTabIcon,
  PhoneTabIcon,
  UserBoldIcon,
  UserLinearIcon,
} from '@/components/shared/icons';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/theme-store';

// Create the swipable navigator
const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

const TAB_CONFIG: Record<string, any> = {
  chats: { ActiveIcon: ChatTabIcon, InactiveIcon: ChatTabIcon },
  moments: { ActiveIcon: MomentsTabIcon, InactiveIcon: MomentsTabIcon },
  camera: { isCenter: true, ActiveIcon: CameraBoldIcon },
  calls: { ActiveIcon: PhoneTabIcon, InactiveIcon: PhoneTabIcon },
  account: { ActiveIcon: UserBoldIcon, InactiveIcon: UserLinearIcon },
};

function CustomTabBar({ state, navigation }: MaterialTopTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const brandColor = useThemeStore((state) => state.accentColor);
  
  const isDark = colorScheme === 'dark';

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const MARGIN = 16;
  const TAB_BAR_WIDTH = SCREEN_WIDTH - MARGIN * 2;
  const TAB_BAR_HEIGHT = 70;
  const TAB_BAR_RADIUS = 28;

  const pathString = useMemo(() => {
    const CENTER = TAB_BAR_WIDTH / 2;
    const CUTOUT_R = 40;
    const CUT_DEPTH = 36;

    const p1 = CENTER - CUTOUT_R - 15;
    const p2 = CENTER - CUTOUT_R + 5;
    const p3 = CENTER - CUTOUT_R + 5;
    const p4 = CENTER;
    const p5 = CENTER + CUTOUT_R - 5;
    const p6 = CENTER + CUTOUT_R - 5;
    const p7 = CENTER + CUTOUT_R + 15;

    return `
      M ${TAB_BAR_RADIUS} 0
      L ${p1} 0
      C ${p2} 0, ${p3} ${CUT_DEPTH}, ${p4} ${CUT_DEPTH}
      C ${p5} ${CUT_DEPTH}, ${p6} 0, ${p7} 0
      L ${TAB_BAR_WIDTH - TAB_BAR_RADIUS} 0
      A ${TAB_BAR_RADIUS} ${TAB_BAR_RADIUS} 0 0 1 ${TAB_BAR_WIDTH} ${TAB_BAR_RADIUS}
      L ${TAB_BAR_WIDTH} ${TAB_BAR_HEIGHT - TAB_BAR_RADIUS}
      A ${TAB_BAR_RADIUS} ${TAB_BAR_RADIUS} 0 0 1 ${TAB_BAR_WIDTH - TAB_BAR_RADIUS} ${TAB_BAR_HEIGHT}
      L ${TAB_BAR_RADIUS} ${TAB_BAR_HEIGHT}
      A ${TAB_BAR_RADIUS} ${TAB_BAR_RADIUS} 0 0 1 0 ${TAB_BAR_HEIGHT - TAB_BAR_RADIUS}
      L 0 ${TAB_BAR_RADIUS}
      A ${TAB_BAR_RADIUS} ${TAB_BAR_RADIUS} 0 0 1 ${TAB_BAR_RADIUS} 0
      Z
    `;
  }, [TAB_BAR_WIDTH]);

  const visualOrder = useMemo(() => ['chats', 'moments', 'camera', 'calls', 'account'], []);

  const handleCameraPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/camera');
  }, [router]);

  return (
    <View
      style={{
        bottom: insets.bottom > 0 ? insets.bottom : 24,
        left: MARGIN,
        right: MARGIN,
      }}
      className={cn(
        'elevation-8 absolute h-[70px]',
        isDark ? 'shadow-black/40' : 'shadow-black/5',
        'shadow-2xl shadow-black/10'
      )}>
      <Svg
        width={TAB_BAR_WIDTH}
        height={TAB_BAR_HEIGHT}
        viewBox={`0 0 ${TAB_BAR_WIDTH} ${TAB_BAR_HEIGHT}`}>
        <Path
          d={pathString}
          fill={isDark ? '#18181b' : '#ffffff'}
          stroke={isDark ? '#27272a' : '#f4f4f5'}
          strokeWidth={1.5}
        />
      </Svg>

      <View className="absolute inset-0 flex-row">
        {visualOrder.map((name) => {
          const config = TAB_CONFIG[name];

          if (name === 'camera') {
            return (
              <TabButton
                key="camera-button"
                route={{ name: 'camera' }}
                isFocused={false}
                config={config}
                onPress={handleCameraPress}
                brandColor={brandColor}
                isDark={isDark}
                profile={profile}
                user={user}
              />
            );
          }

          const routeIndex = state.routes.findIndex((r) => r.name === name);
          if (routeIndex === -1) return null;
          
          const route = state.routes[routeIndex];
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TabButton
              key={route.key}
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
  );
}

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { width } = Dimensions.get('window');

  if (isLoading || !isAuthenticated) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1">
        <MaterialTopTabs
          tabBar={(props: MaterialTopTabBarProps) => <CustomTabBar {...props} />}
          tabBarPosition="bottom"
          keyboardDismissMode="on-drag"
          initialLayout={{ width }}
          screenOptions={{
            lazy: true,
          }}>
          <MaterialTopTabs.Screen name="chats" />
          <MaterialTopTabs.Screen name="moments" />
          <MaterialTopTabs.Screen name="calls" />
          <MaterialTopTabs.Screen name="account" />
        </MaterialTopTabs>
      </View>
    </View>
  );
}
