'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  atsScans: number;
  portfolios: number;
  emails: number;
  referrals: number;
  trackerEvents: number;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const fetchProfile = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stats = [
    { label: 'ATS Scans', value: profile?.atsScans || 0, color: 'bg-blue-500' },
    { label: 'Portfolios Generated', value: profile?.portfolios || 0, color: 'bg-green-500' },
    { label: 'AI Emails Sent', value: profile?.emails || 0, color: 'bg-purple-500' },
    { label: 'Referral Searches', value: profile?.referrals || 0, color: 'bg-orange-500' },
    { label: 'Tracker Updates', value: profile?.trackerEvents || 0, color: 'bg-red-500' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      {isLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-medium text-gray-700 w-24">Name:</span>
                <span className="text-gray-900">{profile.name || 'Not provided'}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-700 w-24">Email:</span>
                <span className="text-gray-900">{profile.email}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium text-gray-700 w-24">Member since:</span>
                <span className="text-gray-900">{formatDate(profile.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className={`${stat.color} text-white rounded-lg p-4 mb-2`}>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
            <div className="space-y-3">
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors">
                Delete Account
              </button>
              <p className="text-sm text-gray-500">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : null}
    </div>
  );
}
