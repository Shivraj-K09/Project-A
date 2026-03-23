import { Drawer } from '@/components/ui/drawer';
import { Text } from '@/components/ui/text';
import { SettingsGroup, cnSettingsMenuItem } from '@/lib/settings-ui';
import { cn } from '@/lib/utils';
import { useAppTheme, useThemeStore } from '@/store/theme-store';
import * as Haptics from 'expo-haptics';
import { Check, ChevronRight, MessageSquare, Monitor, Palette } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { forwardRef, memo, useCallback, useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT_COLORS = [
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Rose', color: '#f43f5e' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Sky', color: '#0ea5e9' },
  { name: 'Violet', color: '#8b5cf6' },
];

const THEME_OPTIONS = {
  light: { title: 'Light', subtitle: 'Standard light theme' },
  dark: { title: 'Dark', subtitle: 'Comfortable dark theme' },
  system: { title: 'System', subtitle: 'Sync with device' },
} as const;

const BUBBLE_SHAPES = {
  round: { title: 'Modern Pill', subtitle: 'Ultra rounded aesthetic' },
  soft: { title: 'Soft Rounded', subtitle: 'Balanced modern look' },
  sharp: { title: 'Minimal Sharp', subtitle: 'Rectangular clean lines' },
} as const;

export default function AppearanceSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { accentColor, bubbleShape, stealthMode, setAccentColor, setBubbleShape, setStealthMode } =
    useThemeStore();
  const { brandColor, isDark } = useAppTheme();
  const [editingKey, setEditingKey] = useState<'theme' | 'accent' | 'bubble' | null>(null);
  const [themeSetting, setThemeSetting] = useState<'light' | 'dark' | 'system'>('system');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted) {
      if (colorScheme) setThemeSetting(colorScheme as any);

      // Repair logic for persisted old bubble shape values
      if (!BUBBLE_SHAPES[bubbleShape as keyof typeof BUBBLE_SHAPES]) {
        setBubbleShape('round');
      }
    }
  }, [hasMounted, colorScheme, bubbleShape]);

  const handleSelectOption = useCallback(
    (key: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Use queueMicrotask to ensure the state update happens AFTER the current render cycle/event
      queueMicrotask(() => {
        if (!hasMounted) return;

        if (editingKey === 'theme') {
          const id = key as 'light' | 'dark' | 'system';
          setThemeSetting(id);
          setColorScheme(id);
        } else if (editingKey === 'accent') {
          setAccentColor(key);
        } else if (editingKey === 'bubble') {
          setBubbleShape(key as any);
        }
        setEditingKey(null);
      });
    },
    [editingKey, setColorScheme, setAccentColor, hasMounted]
  );

  const accentName = ACCENT_COLORS.find((c) => c.color === accentColor)?.name || 'Custom';

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        bounces={false}>
        {/* LIVE PREVIEW SECTION - TOP */}
        <View className="mb-8 mt-2 px-5">
          <View className="overflow-hidden rounded-[32px] border border-border/5 bg-muted/5 px-4 pb-8 pt-0">
            <View className="mt-6 gap-5">
              <View className="self-center rounded-2xl border border-border/5 bg-muted/10 px-4 py-1.5">
                <Text className="text-[11px] font-bold text-muted-foreground/60">
                  Wednesday, October 23
                </Text>
              </View>

              {/* Incoming Bubble */}
              <View
                style={{
                  backgroundColor:
                    colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  borderColor:
                    colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  borderRadius: bubbleShape === 'round' ? 24 : bubbleShape === 'soft' ? 12 : 4,
                  borderTopLeftRadius: bubbleShape === 'sharp' ? 4 : 4,
                }}
                className="max-w-[85%] self-start overflow-hidden border px-4 py-3 shadow-sm">
                <Text
                  style={{
                    fontSize: 15,
                    color: colorScheme === 'dark' ? '#fff' : '#1c1c1e',
                  }}
                  className="font-medium leading-[22px]">
                  Swipe to browse wallpapers, or tap here to customize my bubble color! 🎨✨
                </Text>
                <Text
                  style={{ color: colorScheme === 'dark' ? '#ffffff40' : '#00000040' }}
                  className="mt-1.5 text-[10px] font-bold uppercase tracking-tight">
                  11:04 PM
                </Text>
              </View>

              {/* Outgoing Bubble */}
              <View
                style={{
                  backgroundColor: accentColor,
                  borderColor: 'rgba(255,255,255,0.15)',
                  shadowColor: accentColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                  borderRadius: bubbleShape === 'round' ? 24 : bubbleShape === 'soft' ? 12 : 4,
                  borderTopRightRadius: bubbleShape === 'sharp' ? 4 : 4,
                }}
                className="max-w-[85%] self-end border px-4 py-3">
                <Text
                  style={{
                    fontSize: 15,
                    color: '#fff',
                  }}
                  className="font-semibold leading-[22px]">
                  I can customize every message now. Personalization is level 100.
                </Text>
                <View className="mt-1.5 flex-row items-center justify-end">
                  <Text
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                    className="mr-1.5 text-[10px] font-bold uppercase tracking-tight">
                    11:04 PM
                  </Text>
                  <Check size={12} color="#fff" strokeWidth={3.5} />
                </View>
              </View>
            </View>

            {/* Stealth Mode Overlay in Preview - Commented Out for Future
            {stealthMode && (
              <View className="absolute inset-0 items-center justify-center z-50">
                <BlurView 
                  intensity={40} 
                  tint={isDark ? 'dark' : 'light'} 
                  className="absolute inset-0"
                />
                <View className="bg-background/90 px-5 py-2.5 rounded-full border border-brand/20 flex-row items-center space-x-2 shadow-sm">
                  <EyeOff size={16} color={brandColor} />
                  <Text className="text-[13px] font-bold text-foreground tracking-tight">Privacy Shield Active</Text>
                </View>
              </View>
            )} */}
          </View>
        </View>

        {/* CUSTOMIZATION SECTION */}
        <View className="mb-10">
          <View className="mb-2 px-6">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-brand">
              Styling
            </Text>
          </View>

          <SettingsGroup className="mx-6">
            <SettingRow
              icon={Monitor}
              title="Theme Mode"
              subtitle={THEME_OPTIONS[themeSetting]?.title || 'Select Theme'}
              onPress={() => {
                queueMicrotask(() => {
                  if (hasMounted) setEditingKey('theme');
                });
              }}
            />

            <SettingRow
              icon={Palette}
              title="Accent Color"
              subtitle={accentName}
              onPress={() => {
                queueMicrotask(() => {
                  if (hasMounted) setEditingKey('accent');
                });
              }}
              color={accentColor}
            />

            <SettingRow
              icon={MessageSquare}
              title="Bubble Style"
              subtitle={BUBBLE_SHAPES[bubbleShape]?.title || 'Select Style'}
              onPress={() => {
                queueMicrotask(() => {
                  if (hasMounted) setEditingKey('bubble');
                });
              }}
            />

            {/* <SettingRow
              icon={ShieldHalf}
              title="Privacy Shield"
              subtitle={stealthMode ? 'Enabled (Gaussian Blur)' : 'Disabled'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStealthMode(!stealthMode);
              }}
              isLast
            /> */}
          </SettingsGroup>

          {/* {stealthMode && (
            <View className="mt-3 px-6">
              <Text className="text-[11px] font-medium leading-[16px] text-muted-foreground/50">
                <Text className="font-bold text-brand">Pro Tip:</Text> When Shield is active, long-press any chat in your list to peek through the blur.
              </Text>
            </View>
          )} */}
        </View>
      </ScrollView>

      {/* Standard List-style Drawers */}
      <Drawer visible={!!editingKey} onClose={() => setEditingKey(null)}>
        <Text className="mb-6 text-center text-xl font-bold text-foreground">
          {editingKey === 'theme'
            ? 'Select Theme'
            : editingKey === 'bubble'
              ? 'Bubble Style'
              : 'Select Accent'}
        </Text>
        <View className="overflow-hidden rounded-[14px] border border-border bg-muted/40">
          {editingKey &&
            (editingKey === 'accent'
              ? ACCENT_COLORS
              : editingKey === 'bubble'
                ? Object.entries(BUBBLE_SHAPES)
                : Object.entries(THEME_OPTIONS)
            ).map((option: any, index: number, array: any[]) => {
              const isAccent = editingKey === 'accent';
              const isBubble = editingKey === 'bubble';
              const key = isAccent ? option.color : option[0];
              const data = isAccent ? option : option[1];
              const isSelected = isAccent
                ? accentColor === key
                : isBubble
                  ? bubbleShape === key
                  : themeSetting === key;
              const isLast = index === array.length - 1;

              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.7}
                  onPress={() => handleSelectOption(key)}
                  className={`flex-row items-center bg-background/50 p-5 ${!isLast ? 'border-b border-border' : ''}`}>
                  {isAccent ? (
                    <View
                      style={{ backgroundColor: option.color }}
                      className="mr-4 h-8 w-8 rounded-full border border-black/5 shadow-sm"
                    />
                  ) : (
                    <View className="mr-4 flex-1">
                      <Text
                        className={`text-[17px] font-bold ${isSelected ? 'text-brand' : 'text-foreground'}`}>
                        {data.title}
                      </Text>
                      <Text className="mt-1 text-[13px] font-medium text-muted-foreground/50">
                        {data.subtitle}
                      </Text>
                    </View>
                  )}

                  {isAccent && (
                    <View className="flex-1">
                      <Text
                        className={`text-[16px] font-bold ${isSelected ? 'text-brand' : 'text-foreground'}`}>
                        {option.name}
                      </Text>
                    </View>
                  )}

                  <View className="ml-2 items-center justify-center">
                    {isSelected ? (
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-brand">
                        <Check size={12} color="#ffffff" strokeWidth={4} />
                      </View>
                    ) : (
                      !isAccent &&
                      !isBubble && (
                        <View className="h-6 w-6 rounded-full border-2 border-muted-foreground/20" />
                      )
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>
      </Drawer>
    </View>
  );
}

const SettingRow = memo(
  forwardRef(
    ({ icon: Icon, title, subtitle, onPress, isLast: _isLast, color, ...props }: any, ref: any) => {
      const { brandColor, isDark } = useAppTheme();
      const displayColor = color || brandColor;

      return (
        <TouchableOpacity
          ref={ref}
          activeOpacity={0.7}
          onPress={onPress}
          className={cn(cnSettingsMenuItem(), 'flex-row items-center')}
          {...props}>
          <View
            style={{ backgroundColor: displayColor + '10' }}
            className="mr-4 h-10 w-10 items-center justify-center rounded-xl">
            <Icon size={20} color={displayColor} strokeWidth={2.2} />
          </View>

          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-foreground">{title}</Text>
            <Text className="mt-0.5 text-[11px] font-medium text-muted-foreground/60">
              {subtitle}
            </Text>
          </View>

          <ChevronRight size={14} color="#71717a" strokeWidth={2.5} />
        </TouchableOpacity>
      );
    }
  )
);
