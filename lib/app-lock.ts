import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const APP_LOCK_STORAGE_KEY = 'app_lock_enabled';

type AppLockListener = (enabled: boolean) => void;

const listeners = new Set<AppLockListener>();

export async function getAppLockEnabled() {
  try {
    // 🛡️ Security Check: Priority to SecureStore (Hardware Encrypted)
    const isAvailable = await SecureStore.isAvailableAsync();
    
    if (isAvailable) {
      const stored = await SecureStore.getItemAsync(APP_LOCK_STORAGE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
    }

    // 🔄 Migration/Fallback: Check old unencrypted storage
    const legacy = await AsyncStorage.getItem(APP_LOCK_STORAGE_KEY);
    if (legacy !== null) {
      const enabled = legacy === 'true';
      // If SecureStore is available, move it there and clean up
      if (isAvailable) {
        await SecureStore.setItemAsync(APP_LOCK_STORAGE_KEY, enabled ? 'true' : 'false');
        await AsyncStorage.removeItem(APP_LOCK_STORAGE_KEY).catch(() => {});
      }
      return enabled;
    }

    return false;
  } catch (err) {
    console.error('[AppLock] getEnabled error:', err);
    return false;
  }
}

export async function setAppLockEnabled(enabled: boolean) {
  try {
    const isAvailable = await SecureStore.isAvailableAsync();
    if (isAvailable) {
      await SecureStore.setItemAsync(APP_LOCK_STORAGE_KEY, enabled ? 'true' : 'false');
    } else {
      // Fallback for devices without SecureStore support
      await AsyncStorage.setItem(APP_LOCK_STORAGE_KEY, enabled ? 'true' : 'false');
    }
    listeners.forEach((listener) => listener(enabled));
  } catch (err) {
    console.error('[AppLock] Failed to save setting:', err);
  }
}

export function subscribeToAppLockChanges(listener: AppLockListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
