import 'react-native-get-random-values';

import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage adapter using expo-secure-store (works with Expo Go)
// Custom storage adapter using expo-secure-store (works with Expo Go)
// This version handles the 2048 byte limit on Android by chunking large values
const CHUNK_SIZE = 2000;

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      // Check for chunked data first
      const count = await SecureStore.getItemAsync(`${key}_count`);
      if (count) {
        const totalChunks = parseInt(count, 10);
        let combined = '';
        for (let i = 0; i < totalChunks; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
          if (chunk) combined += chunk;
        }
        return combined;
      }
      // Fallback to single item
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      // Clear any previous chunked data first
      const prevCount = await SecureStore.getItemAsync(`${key}_count`);
      if (prevCount) {
        for (let i = 0; i < parseInt(prevCount, 10); i++) {
          await SecureStore.deleteItemAsync(`${key}_${i}`);
        }
        await SecureStore.deleteItemAsync(`${key}_count`);
      }

      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
      } else {
        // Chunk the data
        const totalChunks = Math.ceil(value.length / CHUNK_SIZE);
        await SecureStore.setItemAsync(`${key}_count`, totalChunks.toString());
        for (let i = 0; i < totalChunks; i++) {
          const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await SecureStore.setItemAsync(`${key}_${i}`, chunk);
        }
        // Remove the old single key if it existed
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {
      if (__DEV__) console.error('SecureStore: Failed to save item after chunking attempt', e);
    }
  },
  removeItem: async (key: string) => {
    try {
      // Clear chunked data
      const count = await SecureStore.getItemAsync(`${key}_count`);
      if (count) {
        for (let i = 0; i < parseInt(count, 10); i++) {
          await SecureStore.deleteItemAsync(`${key}_${i}`);
        }
        await SecureStore.deleteItemAsync(`${key}_count`);
      }
      // Clear single key
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore errors on deletion
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
