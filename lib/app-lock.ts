import AsyncStorage from '@react-native-async-storage/async-storage';

export const APP_LOCK_STORAGE_KEY = 'app_lock_enabled';

type AppLockListener = (enabled: boolean) => void;

const listeners = new Set<AppLockListener>();

export async function getAppLockEnabled() {
  try {
    const stored = await AsyncStorage.getItem(APP_LOCK_STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

export async function setAppLockEnabled(enabled: boolean) {
  await AsyncStorage.setItem(APP_LOCK_STORAGE_KEY, enabled ? 'true' : 'false');
  listeners.forEach((listener) => listener(enabled));
}

export function subscribeToAppLockChanges(listener: AppLockListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
