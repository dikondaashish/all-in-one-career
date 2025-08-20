import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useProfileImageSync() {
  const { profileImageUrl, user } = useAuth();
  const previousImageUrl = useRef<string | null>(null);
  
  // Check if profile image has changed
  const hasImageChanged = () => {
    const currentImage = profileImageUrl || user?.photoURL || null;
    if (previousImageUrl.current !== currentImage) {
      previousImageUrl.current = currentImage;
      return true;
    }
    return false;
  };

  // Get current profile image URL
  const getCurrentProfileImage = () => {
    return profileImageUrl || user?.photoURL || null;
  };

  // Check if we should show loading state (when image is changing)
  const shouldShowLoading = () => {
    return hasImageChanged();
  };

  return {
    getCurrentProfileImage,
    hasImageChanged,
    shouldShowLoading,
    profileImageUrl,
    userPhotoURL: user?.photoURL
  };
}
