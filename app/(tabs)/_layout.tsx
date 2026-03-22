import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import * as Haptics from 'expo-haptics';
import { useRouter, withLayoutContext } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Dimensions, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

// Custom SVG Icons
import {
  CameraBoldIcon,
  ChatTabIcon,
  MomentsTabIcon,
  PhoneTabIcon,
  UserBoldIcon,
  UserLinearIcon,
} from '@/components/shared/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/use-user';
import { useThemeStore } from '@/store/theme-store';

// Create the swipable navigator
const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

const TAB_CONFIG: Record<string, any> = {
  chats: { ActiveIcon: ChatTabIcon, InactiveIcon: ChatTabIcon },
  moments: { ActiveIcon: MomentsTabIcon, InactiveIcon: MomentsTabIcon },
  camera: { isCenter: true },
  calls: { ActiveIcon: PhoneTabIcon, InactiveIcon: PhoneTabIcon },
  account: { ActiveIcon: UserBoldIcon, InactiveIcon: UserLinearIcon },
};

function TabButton({
  route,
  isFocused,
  config,
  onPress,
}: {
  route: any;
  isFocused: boolean;
  config: any;
  onPress: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const isDark = colorScheme === 'dark';
  const brandColor = useThemeStore((state) => state.accentColor);

  if (!config) return <View style={{ flex: 1 }} />;

  // Center "Floating Action" Button
  if (config.isCenter) {
    const centerColor = brandColor;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
        <Pressable
          onPress={onPress}
          style={{
            position: 'absolute',
            top: -38,
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: centerColor,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 8,
          }}>
          <CameraBoldIcon width={32} height={32} color="#ffffff" />
        </Pressable>
      </View>
    );
  }

  // Standard Tabs
  const { ActiveIcon, InactiveIcon } = config;
  const isAccount = route.name === 'account';
  const Icon = isFocused ? ActiveIcon : InactiveIcon;

  const activeColor = brandColor;
  const inactiveColor = isDark ? '#71717a' : '#a1a1aa';
  const color = isFocused ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {isAccount && user ? (
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              overflow: 'hidden',
              backgroundColor: isDark ? '#312e81' : '#e0e7ff',
              borderWidth: isFocused ? 2 : 0,
              borderColor: brandColor,
            }}>
            <Avatar
              alt={profile?.username || 'User'}
              className={cn('size-full', isFocused ? 'opacity-100' : 'opacity-80')}>
              <AvatarImage source={{ uri: profile?.avatar_url || undefined }} />
              <AvatarFallback className="flex size-full items-center justify-center bg-brand">
                <Text className="text-center text-[10px] font-bold text-white">
                  {profile?.username?.charAt(0) || 'U'}
                </Text>
              </AvatarFallback>
            </Avatar>
          </View>
        ) : (
          <Icon width={30} height={30} color={color} />
        )}
      </View>
    </Pressable>
  );
}

function CustomTabBar({ state, navigation, descriptors }: MaterialTopTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const MARGIN = 16;
  const TAB_BAR_WIDTH = SCREEN_WIDTH - MARGIN * 2;
  const TAB_BAR_HEIGHT = 70;
  const TAB_BAR_RADIUS = 28;

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

  const pathString = `
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

  // visualOrder includes camera, but it will be handled manually
  const visualOrder = ['chats', 'moments', 'camera', 'calls', 'account'];

  return (
    <View
      style={{
        position: 'absolute',
        bottom: insets.bottom > 0 ? insets.bottom : 24,
        left: MARGIN,
        right: MARGIN,
        height: TAB_BAR_HEIGHT,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: isDark ? 0.4 : 0.08,
        shadowRadius: 16,
        elevation: 8,
      }}>
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

      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
        }}>
        {visualOrder.map((name) => {
          const config = TAB_CONFIG[name];

          if (name === 'camera') {
            const onCameraPress = () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/camera');
            };
            return (
              <TabButton
                key="camera-button"
                route={{ name: 'camera' }}
                isFocused={false}
                config={config}
                onPress={onCameraPress}
              />
            );
          }

          const route = state.routes.find((r) => r.name === name);
          if (!route) return null;

          const actualIndex = state.routes.findIndex((r) => r.name === name);
          const isFocused = state.index === actualIndex;

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

  if (isLoading) {
    return <View className="flex-1 bg-background" />;
  }

  if (!isAuthenticated) {
    return <View className="flex-1 bg-background" />;
  }

  return (
    <View className="flex-1 bg-background">
      {/* flex:1 ensures tab scenes fill the screen (without it, content can appear blank). */}
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
