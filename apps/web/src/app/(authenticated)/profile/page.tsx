'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Save } from 'lucide-react';
import RouteGuard from '@/components/RouteGuard';
import { useUserStore } from '@/stores/useUserStore';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

// Environment-based API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://all-in-one-career-api.onrender.com'
  : 'http://localhost:4000';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
}

export default function ProfilePage() {
  // STEP 4: Protect Profile route from guest users
  return (
    <RouteGuard restrictedForGuests={true} redirectTo="/">
      <ProfileContent />
    </RouteGuard>
  );
}

function ProfileContent() {
  const { user, updateProfileImage } = useAuth();
  const { updateProfileImage: updateStoreProfileImage } = useUserStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get Firebase ID token for authentication
      let authToken = '';
      if (user) {
        try {
          authToken = await user.getIdToken();
          console.log('Firebase ID token obtained');
        } catch (tokenError) {
          console.error('Failed to get Firebase ID token:', tokenError);
          throw new Error('Authentication failed. Please log in again.');
        }
      } else if (typeof window !== 'undefined' && localStorage.getItem('climbly_skip_guest') === 'true') {
        // For guest users, we'll use a special header
        authToken = 'guest-mode';
      } else {
        throw new Error('No user authentication available');
      }
      
      console.log('Fetching profile from:', `${API_BASE_URL}/api/profile`);
      console.log('Full API URL:', `${API_BASE_URL}/api/profile`);
      console.log('Environment:', process.env.NODE_ENV);
      console.log('API_BASE_URL value:', API_BASE_URL);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authentication header
      if (authToken === 'guest-mode') {
        headers['X-Guest-Mode'] = 'true';
      } else {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      console.log('Request headers:', headers);
      console.log('Making fetch request to:', `${API_BASE_URL}/api/profile`);
      
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers,
      });

      console.log('Profile response status:', response.status);
      console.log('Profile response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Profile response URL:', response.url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile fetch error:', response.status, errorText);
        console.error('Response URL:', response.url);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        console.error('Request URL that was called:', `${API_BASE_URL}/api/profile`);
        
        if (response.status === 404) {
          throw new Error(`Profile endpoint not found at: ${response.url}. Please check if the backend is running.`);
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else {
          throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Profile data received:', data);
      
      setProfile(data);
      setEditingProfile(data);
      
      // Sync global store so header uses the same image instantly
      if (data?.profileImage) {
        try { updateStoreProfileImage(data.profileImage); } catch {}
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
      
      // Set fallback data for demo purposes
      if (retryCount === 0) {
        const fallbackProfile: UserProfile = {
          firstName: user?.displayName?.split(' ')[0] || 'User',
          lastName: user?.displayName?.split(' ').slice(1).join(' ') || 'Name',
          email: user?.email || 'user@example.com',
          profileImage: undefined
        };
        setProfile(fallbackProfile);
        setEditingProfile(fallbackProfile);
      }
    } finally {
      setLoading(false);
    }
  }, [user, retryCount, updateStoreProfileImage]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchProfile();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      setError(null);

      // Get Firebase ID token for authentication
      let authToken = '';
      if (user) {
        try {
          authToken = await user.getIdToken();
        } catch (tokenError) {
          console.error('Failed to get Firebase ID token:', tokenError);
          throw new Error('Authentication failed. Please log in again.');
        }
      } else {
        throw new Error('No user authentication available');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading avatar with token:', authToken ? 'present' : 'missing');
      
      // Upload avatar
      let response = await fetch(`${API_BASE_URL}/api/profile/upload-avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData,
      });

      // If unauthorized, refresh token once and retry
      if (response.status === 401 && user) {
        try {
          const freshToken = await user.getIdToken(true);
          response = await fetch(`${API_BASE_URL}/api/profile/upload-avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${freshToken}` },
            body: formData,
          });
        } catch (refreshErr) {
          console.error('Failed to refresh token:', refreshErr);
        }
      }

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload failed with status:', response.status, 'Error:', errorData);
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(errorData.error || `Upload failed with status ${response.status}. Please try again.`);
      }

      const { avatarUrl } = await response.json();

      // Update profile state with new avatar
      setProfile(prev => prev ? { ...prev, profileImage: avatarUrl } : null);
      setEditingProfile(prev => prev ? { ...prev, profileImage: avatarUrl } : null);
      
      // Update auth context - this will trigger re-renders in Topbar and other components
      updateProfileImage(avatarUrl);
      updateStoreProfileImage(avatarUrl); // Update Zustand store
      
      // Force a re-fetch of the profile to ensure consistency
      await fetchProfile();
      
      setSuccess('Avatar updated successfully!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (editingProfile) {
      setEditingProfile({
        ...editingProfile,
        [field]: value
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!editingProfile) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Get Firebase ID token for authentication
      let authToken = '';
      if (user) {
        try {
          authToken = await user.getIdToken();
        } catch (tokenError) {
          console.error('Failed to get Firebase ID token:', tokenError);
          throw new Error('Authentication failed. Please log in again.');
        }
      } else if (typeof window !== 'undefined' && localStorage.getItem('climbly_skip_guest') === 'true') {
        authToken = 'guest-mode';
      } else {
        throw new Error('No user authentication available');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authentication header
      if (authToken === 'guest-mode') {
        headers['X-Guest-Mode'] = 'true';
      } else {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          firstName: editingProfile.firstName,
          lastName: editingProfile.lastName
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile update error:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else {
          throw new Error(`Failed to update profile: ${response.status} ${response.statusText}`);
        }
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setEditingProfile(updatedProfile);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] pt-18">
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
              <p className="text-gray-600">Loading your profile information...</p>
            </div>

            {/* Loading Placeholder */}
            <div className="bg-white rounded-2xl p-8 shadow-[0px_12px_30px_rgba(0,0,0,0.05)]">
              <div className="text-center mb-8">
                <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4 animate-pulse"></div>
              </div>
              
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="w-20 h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="w-full h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center">
                <div className="w-32 h-12 bg-gray-200 rounded-xl mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] pt-18">
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center shadow-[0px_12px_30px_rgba(0,0,0,0.05)]">
              <div className="text-red-600 text-6xl mb-4">⚠️</div>
              <div className="text-red-600 text-xl font-medium mb-2">Error Loading Profile</div>
              <div className="text-red-500 mb-6 max-w-md mx-auto">{error}</div>
              
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                >
                  Try Again
                </button>
                
                <div className="text-sm text-gray-500">
                  <p>If the problem persists, try:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Refreshing the page</li>
                    <li>• Checking your internet connection</li>
                    <li>• Logging out and back in</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] pt-18">
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600">Manage your account information and preferences</p>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-2xl p-8 shadow-[0px_12px_30px_rgba(0,0,0,0.05)]">
            {/* Avatar Section */}
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0E8F6B] to-[#10B981] flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden relative">
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center z-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                  {profile?.profileImage ? (
                    <img 
                      src={profile.profileImage} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    getInitials(profile?.firstName || 'U', profile?.lastName || 'S')
                  )}
                </div>
                
                {/* Hidden file input */}
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
                
                {/* Camera icon button */}
                <label
                  htmlFor="avatar-upload"
                  className={`absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer ${
                    uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0E8F6B]"></div>
                  ) : (
                    <Camera className="w-4 h-4 text-gray-600" />
                  )}
                </label>
              </div>
              
              {/* Avatar upload status */}
              {uploadingAvatar && (
                <p className="text-sm text-gray-500 mt-2">Uploading avatar...</p>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={editingProfile?.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder:text-gray-400 placeholder:uppercase placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-[#0E8F6B] focus:border-transparent transition-all duration-200"
                  placeholder="FIRST NAME"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editingProfile?.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder:text-gray-400 placeholder:uppercase placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-[#0E8F6B] focus:border-transparent transition-all duration-200"
                  placeholder="LAST NAME"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder="EMAIL"
                />
                <p className="text-xs text-gray-400 mt-1">Email address cannot be changed</p>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 text-center">
              <button
                onClick={handleSaveChanges}
                disabled={saving || !editingProfile || (editingProfile.firstName === profile?.firstName && editingProfile.lastName === profile?.lastName)}
                className="px-8 py-3 bg-[#0E8F6B] text-white rounded-xl font-medium hover:bg-[#0D7A5A] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center mx-auto space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              
              {/* Support Message */}
              <p className="mt-3 text-sm text-gray-500">
                If you have any difficulties with your profile information, please reach out to{' '}
                <a 
                  href="mailto:support@climbly.ai" 
                  className="text-[#0E8F6B] hover:text-[#0D7A5A] underline"
                >
                  support@climbly.ai
                </a>{' '}
                for support.
              </p>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-green-600 font-medium">{success}</div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <div className="text-red-600 font-medium mb-2">⚠️ Profile Update Issue</div>
                <div className="text-red-500 text-sm mb-3">{error}</div>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <div className="text-gray-600 text-xs">
                  <div>Debug: API Base URL: {API_BASE_URL}</div>
                  <div>User ID: {user?.uid || 'Not available'}</div>
                  <div>Profile Data: {profile ? 'Loaded' : 'Not loaded'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
