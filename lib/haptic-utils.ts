import * as Haptics from 'expo-haptics';
import { useThemeStore } from '@/store/theme-store';

/**
 * 📳 Global Haptic Controller
 * Provides a unified interface for haptic feedback that honors the user's global settings.
 */
export const Haptic = {
  /**
   * Impact feedback: light, medium, heavy.
   */
  impact: (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    const { hapticsEnabled } = useThemeStore.getState();
    if (hapticsEnabled) {
      Haptics.impactAsync(style);
    }
  },

  /**
   * Notification feedback: success, warning, error.
   */
  notification: (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
    const { hapticsEnabled } = useThemeStore.getState();
    if (hapticsEnabled) {
      Haptics.notificationAsync(type);
    }
  },

  /**
   * Selection feedback (subtle tick).
   */
  selection: () => {
    const { hapticsEnabled } = useThemeStore.getState();
    if (hapticsEnabled) {
      Haptics.selectionAsync();
    }
  },
};

/**
 * Hook for using haptics in functional components.
 */
export function useHaptics() {
  return Haptic;
}
