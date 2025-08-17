'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Camera, Save } from 'lucide-react';

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
  const { user, hasSkippedAuth } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
      setEditingProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
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

      const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: editingProfile.firstName,
          lastName: editingProfile.lastName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
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
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0E8F6B]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] pt-18">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Error Loading Profile</div>
            <div className="text-red-500">{error}</div>
            <button
              onClick={fetchProfile}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
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
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0E8F6B] to-[#10B981] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
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
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
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
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-green-600 font-medium">{success}</div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <div className="text-red-600 font-medium">{error}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
