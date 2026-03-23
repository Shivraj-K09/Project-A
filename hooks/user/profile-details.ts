import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/components/ui/toast';
import {
  useUpdateProfile,
  useUpdateProfileDetails,
  useUserProfile,
  useUserProfileDetails,
} from './profile';

export function useProfileDetails() {
  const router = useRouter();
  const { user, signOut, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: details, isLoading: detailsLoading } = useUserProfileDetails();

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const { mutate: updateDetails } = useUpdateProfileDetails();

  const [isUploading, setIsUploading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  const isLoading = profileLoading || detailsLoading;

  const handleSignOut = useCallback(() => {
    setIsSigningOut(true);
    setTimeout(async () => {
      try {
        await signOut();
      } catch (err) {
        setIsSigningOut(false);
      }
    }, 400);
  }, [signOut]);

  const handleUpdateProfile = useCallback((data: any) => {
    updateProfile(data, {
      onSuccess: () => toast({ message: 'Saved successfully', variant: 'success' }),
      onError: (err: any) => toast({ message: err?.message || 'Update failed', variant: 'error' }),
    });
  }, [updateProfile, toast]);

  const handleUpdateDetails = useCallback((data: any) => {
    updateDetails(data, {
      onSuccess: () => toast({ message: 'Details updated', variant: 'success' }),
      onError: (err: any) => toast({ message: err?.message || 'Update failed', variant: 'error' }),
    });
  }, [updateDetails, toast]);

  const handleImagePick = async () => {
    try {
      if (!user?.id) {
        toast({ message: 'User session not found', variant: 'error' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets[0].base64) return;

      setIsUploading(true);
      const file = result.assets[0];
      const filePath = `${user.id}/avatar-${Date.now()}.png`;

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(file.base64!), {
          contentType: 'image/png',
          upsert: true,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      updateProfile(
        { avatar_url: publicUrl },
        {
          onSuccess: () => {
            toast({ message: 'Avatar updated', variant: 'success' });
            setIsUploading(false);
          },
          onError: (err: any) => {
            toast({ message: err?.message || 'Avatar sync failed', variant: 'error' });
            setIsUploading(false);
          },
        }
      );
    } catch (error: any) {
      toast({ message: error?.message || 'Upload failed', variant: 'error' });
      setIsUploading(false);
    }
  };

  return {
    router,
    profile,
    details,
    isLoading,
    isAuthenticated,
    isUpdatingProfile,
    isUploading,
    isSigningOut,
    showViewer,
    setShowViewer,
    handleSignOut,
    handleUpdateProfile,
    handleUpdateDetails,
    handleImagePick,
  };
}
