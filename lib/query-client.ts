import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache is kept for 30 minutes after last use
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      /** 
       * MOBILE OPTIMIZATION:
       * 
       * We disable these aggressive refetch triggers globally to save battery 
       * and data. For a mobile app, window focus and reconnect happen 
       * constantly (e.g., swiping the notification shade or driving).
       */
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
