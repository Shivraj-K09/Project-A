import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useCallback } from 'react';

export function useFeatureRequests() {
  const queryClient = useQueryClient();

  // 1. Fetch Request
  const { data: features, isLoading, refetch } = useQuery({
    queryKey: ['feature_requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_requests')
        .select(`
          *,
          feature_votes (user_id, vote_type)
        `)
        .order('vote_count', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // 2. Real-time Subscription with In-Place Patching
  React.useEffect(() => {
    const channel = supabase
      .channel('roadmap-updates')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'feature_requests' }, 
        (payload) => {
          queryClient.setQueryData(['feature_requests'], (oldData: any[] | undefined) => {
            if (!oldData) return [];

            if (payload.eventType === 'INSERT') {
              return [payload.new, ...oldData];
            }

            if (payload.eventType === 'UPDATE') {
              return oldData.map((item) => 
                item.id === payload.new.id ? { ...item, ...payload.new } : item
              );
            }

            if (payload.eventType === 'DELETE') {
              return oldData.filter((item) => item.id !== payload.old.id);
            }

            return oldData;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_votes' },
        (payload) => {
          queryClient.setQueryData(['feature_requests'], (oldData: any[] | undefined) => {
            if (!oldData) return [];

            return oldData.map((feature) => {
              const vote = payload.new as any || payload.old as any;
              if (feature.id !== vote.request_id) return feature;

              let updatedVotes = [...(feature.feature_votes || [])];

              if (payload.eventType === 'INSERT') {
                updatedVotes.push(payload.new);
              } else if (payload.eventType === 'UPDATE') {
                updatedVotes = updatedVotes.map((v) => 
                  v.user_id === payload.new.user_id ? payload.new : v
                );
              } else if (payload.eventType === 'DELETE') {
                updatedVotes = updatedVotes.filter((v) => 
                  v.user_id !== payload.old.user_id
                );
              }

              return { ...feature, feature_votes: updatedVotes };
            });
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    features,
    isLoading,
    refresh: refetch,
  };
}

export function useFeatureVoting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      type, 
      profileRowId, 
      isRemoving 
    }: { 
      id: string; 
      type: 'up' | 'down'; 
      profileRowId: string; 
      isRemoving: boolean;
    }) => {
      if (isRemoving) {
        const { error } = await supabase
          .from('feature_votes')
          .delete()
          .match({ request_id: id, user_id: profileRowId });
        if (error) throw error;
        return { success: true };
      }

      const { error } = await supabase.from('feature_votes').upsert(
        {
          request_id: id,
          user_id: profileRowId,
          vote_type: type,
        },
        { onConflict: 'request_id,user_id' }
      );

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      // SCALING RESOLUTION: We removed invalidateQueries here.
      // The 'useFeatureRequests' hook already has a real-time listener
      // that catches the 'UPDATE' event on the feature_requests table 
      // (fired by a DB trigger when a vote is cast). This keeps the 
      // UI in sync without a full network refetch.
    },
  });
}
