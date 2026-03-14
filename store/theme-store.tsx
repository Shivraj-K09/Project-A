import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vars, useColorScheme } from 'nativewind';
import React, { useMemo, useState, useEffect } from 'react';
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

interface ThemeState {
  accentColor: string;
  language: string;
  setAccentColor: (color: string) => void;
  setLanguage: (lang: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      accentColor: '#6366f1',
      language: 'en',
      setAccentColor: (color) => set({ accentColor: color }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'app-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const accentColor = useThemeStore((state) => state.accentColor);

  useEffect(() => {
    // Check if store is already hydrated
    if (useThemeStore.persist.hasHydrated()) {
      setIsHydrated(true);
    } else {
      // Listen for hydration finish
      const unsub = useThemeStore.persist.onFinishHydration(() => {
        setIsHydrated(true);
      });
      return unsub;
    }
  }, []);

  const themeVars = useMemo(() => {
    return vars({
      '--brand': hexToHsl(accentColor),
    });
  }, [accentColor]);

  // Prevent rendering until theme is loaded from storage
  if (!isHydrated) return null;

  return <View style={[themeVars, { flex: 1 }]}>{children}</View>;
}

/**
 * Simplified hook to get common theme values in one line.
 * @example const { brandColor, isDark } = useAppTheme();
 */
export function useAppTheme() {
  const accentColor = useThemeStore((state) => state.accentColor);
  const { colorScheme } = useColorScheme();
  return {
    brandColor: accentColor,
    isDark: colorScheme === 'dark',
    accentColor, // Alias for convenience
  };
}
