import { Text } from '@/components/ui/text';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, memo, useRef, forwardRef } from 'react';
import { Monitor, Check, ChevronRight, Palette, Globe } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { cn } from '@/lib/utils';
import { Drawer } from '@/components/ui/drawer';
import * as Haptics from 'expo-haptics';
import { useThemeStore, useAppTheme } from '@/store/theme-store';
import { router } from 'expo-router';

const ACCENT_COLORS = [
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Rose', color: '#f43f5e' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Sky', color: '#0ea5e9' },
  { name: 'Violet', color: '#8b5cf6' },
];

const THEME_OPTIONS = {
  light: { title: 'Light', subtitle: 'Standard bright mode' },
  dark: { title: 'Dark', subtitle: 'Comfortable dark mode' },
  system: { title: 'System', subtitle: 'Sync with device' },
} as const;

const LANGUAGE_TITLES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  bn: 'Bengali (বাংলা)',
  te: 'Telugu (తెలుగు)',
  mr: 'Marathi (मराठी)',
  ta: 'Tamil (தமிழ்)',
  ur: 'Urdu (اردو)',
  gu: 'Gujarati (ગુજરાતી)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  or: 'Odia (ଓଡ଼ିଆ)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  as: 'Assamese (অসমীয়া)',
  ma: 'Manipuri (মৈতৈলোন)',
  ks: 'Kashmiri (کأشُر)',
  sa: 'Sanskrit (संस्कृतम्)',
  sd: 'Sindhi (سنڌي)',
  ne: 'Nepali (नेपाली)',
  ko: 'Konkani (कोंकणी)',
  do: 'Dogri (डोगरी)',
  mai: 'Maithili (मैथिली)',
  bod: 'Bodo (बड़ो)',
  sat: 'Santali (সংताली)',
};

export default function AppearanceSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme, setColorScheme } = useColorScheme();
  const accentColor = useThemeStore((state) => state.accentColor);
  const setAccentColor = useThemeStore((state) => state.setAccentColor);
  const language = useThemeStore((state) => state.language);
  const [editingKey, setEditingKey] = useState<'theme' | 'accent' | null>(null);
  const [themeSetting, setThemeSetting] = useState<'light' | 'dark' | 'system'>('system');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (hasMounted && colorScheme) {
      // Sync local UI state with active color scheme if needed
      // But only if we want the UI selection to match the active scheme on first load
      setThemeSetting(colorScheme as any);
    }
  }, [hasMounted, colorScheme]);

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
        {/* CUSTOMIZATION SECTION - TOP */}
        <View className="mb-10 mt-6">
          <View className="mb-2 px-6">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-brand">
              Personalization
            </Text>
          </View>

          <View className="bg-background">
            <SettingRow
              icon={Monitor}
              title="App Theme"
              subtitle={THEME_OPTIONS[themeSetting].title}
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
              icon={Globe}
              title="App Language"
              subtitle={LANGUAGE_TITLES[language] || 'Select Language'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/language-settings');
              }}
              isLast
            />
          </View>
        </View>

        {/* LIVE PREVIEW SECTION - BOTTOM */}
        <View className="px-5">
          <View className="mb-4 flex-row items-center justify-center space-x-2">
            <View className="h-[1px] flex-1 bg-border/5" />
            <Text className="text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground/30">
              Live Preview
            </Text>
            <View className="h-[1px] flex-1 bg-border/5" />
          </View>

          <View className="rounded-[32px] border border-border/5 bg-muted/5 px-4 py-8">
            <View className="gap-5">
              <View className="self-center rounded-2xl border border-border/5 bg-muted/10 px-4 py-1.5">
                <Text className="text-[11px] font-bold text-muted-foreground/60">
                  Wednesday, October 23
                </Text>
              </View>

              {/* Incoming Bubble */}
              <View
                style={{
                  backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                }}
                className="max-w-[85%] self-start overflow-hidden rounded-[24px] rounded-tl-[4px] border px-4 py-3 shadow-sm">
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
                }}
                className="max-w-[85%] self-end rounded-[24px] rounded-tr-[4px] border px-4 py-3">
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
                  <Check
                    size={12}
                    color="#fff"
                    strokeWidth={3.5}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Standard List-style Drawers */}
      <Drawer visible={!!editingKey} onClose={() => setEditingKey(null)}>
        <Text className="mb-6 text-center text-xl font-bold text-foreground">
          {editingKey === 'theme' ? 'Select Theme' : 'Select Accent'}
        </Text>
        <View className="overflow-hidden rounded-[32px] border border-border bg-muted/40">
          {editingKey &&
            (editingKey === 'accent' ? ACCENT_COLORS : Object.entries(THEME_OPTIONS)).map(
              (option: any, index: number, array: any[]) => {
                const isAccent = editingKey === 'accent';
                const key = isAccent ? option.color : option[0];
                const data = isAccent ? option : option[1];
                const isSelected = isAccent ? accentColor === key : themeSetting === key;
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
                        !isAccent && (
                          <View className="h-6 w-6 rounded-full border-2 border-muted-foreground/20" />
                        )
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }
            )}
        </View>
      </Drawer>
    </View>
  );
}

const SettingRow = memo(
  forwardRef(({ icon: Icon, title, subtitle, onPress, isLast, color, ...props }: any, ref: any) => {
    const { brandColor, isDark } = useAppTheme();
    const displayColor = color || brandColor;

    return (
      <TouchableOpacity
        ref={ref}
        activeOpacity={0.7}
        onPress={onPress}
        className={cn(
          'flex-row items-center bg-background px-6 py-4',
          !isLast && 'border-b border-border/5'
        )}
        {...props}>
        <View
          style={{ backgroundColor: displayColor + '10' }}
          className="mr-4 h-10 w-10 items-center justify-center rounded-xl">
          <Icon size={20} color={displayColor} strokeWidth={2.2} />
        </View>

        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-foreground">{title}</Text>
          <Text className="mt-0.5 text-[11px] font-medium text-muted-foreground/60">{subtitle}</Text>
        </View>

        <ChevronRight size={14} color={isDark ? '#27272a' : '#d4d4d8'} />
      </TouchableOpacity>
    );
  })
);
