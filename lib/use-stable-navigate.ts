import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useRef } from 'react';

function hrefKey(href: Href): string {
  if (typeof href === 'string') return href;
  const o = href as { pathname?: string; params?: Record<string, string | undefined> };
  return `${String(o.pathname ?? '')}:${JSON.stringify(o.params ?? {})}`;
}

/**
 * Imperative navigation that avoids stacking the same screen repeatedly (double taps).
 * Uses `router.navigate` so Expo Router can merge with an existing route when possible.
 * @see https://docs.expo.dev/router/basics/navigation — navigate vs push
 */
export function useStableNavigate(cooldownMs = 380) {
  const router = useRouter();
  const lastRef = useRef<{ key: string; at: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      lastRef.current = null;
    }, [])
  );

  return useCallback(
    (href: Href) => {
      const key = hrefKey(href);
      const now = Date.now();
      const last = lastRef.current;
      if (last && last.key === key && now - last.at < cooldownMs) return;
      lastRef.current = { key, at: now };
      router.navigate(href);
    },
    [router, cooldownMs]
  );
}
