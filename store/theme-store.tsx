import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vars, useColorScheme } from 'nativewind';
import React, { useMemo } from 'react';
import { View } from 'react-native';

export function hexToHsl(hex: string): string {
  // Remove the hash at the start if it's there
  hex = hex.replace(/^#/, '');

  // Parse r, g, b values
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export type BubbleShape = 'round' | 'soft' | 'sharp';

interface ThemeState {
  accentColor: string;
  bubbleShape: BubbleShape;
  stealthMode: boolean;
  setAccentColor: (color: string) => void;
  setBubbleShape: (shape: BubbleShape) => void;
  setStealthMode: (enabled: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      accentColor: '#6366f1',
      bubbleShape: 'round',
      stealthMode: false,
      setAccentColor: (color) => set({ accentColor: color }),
      setBubbleShape: (shape) => set({ bubbleShape: shape }),
      setStealthMode: (enabled) => set({ stealthMode: enabled }),
    }),
    {
      name: 'app-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const accentColor = useThemeStore((state) => state.accentColor);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeVars = useMemo(() => {
    return vars({
      '--brand': hexToHsl(accentColor),
    });
  }, [accentColor]);

  // Always mount the app tree. Waiting on persist hydration left `children === null` and produced a
  // solid black/white screen (only this View's background) when AsyncStorage was slow or stalled.
  return (
    <View style={[themeVars, { flex: 1, backgroundColor: isDark ? '#000' : '#fff' }]}>
      {children}
    </View>
  );
}

export function useAppTheme() {
  const accentColor = useThemeStore((state) => state.accentColor);
  const { colorScheme } = useColorScheme();
  
  // Safe check for development
  const isDark = colorScheme === 'dark';
  
  return {
    brandColor: accentColor,
    isDark,
    accentColor,
  };
}
