'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://all-in-one-career-api.onrender.com'
  : 'http://localhost:4000';

type PreferenceType = 'system' | 'task' | 'promotion' | 'activity';

interface PreferenceItem { type: PreferenceType; enabled: boolean }

const fetcher = async (url: string, token: string | null) => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${url}`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export default function NotificationPreferencesPage() {
  const { getAuthToken, isGuest } = useAuth();
  const token = getAuthToken();
  const shouldFetch = !isGuest && token;

  const { data, mutate, isLoading } = useSWR<{ preferences: PreferenceItem[] }>(
    shouldFetch ? ['/api/notifications/preferences', token] : null,
    ([url, t]: [string, string | null]) => fetcher(url, t)
  );

  const [localPrefs, setLocalPrefs] = useState<PreferenceItem[]>([
    { type: 'system', enabled: true },
    { type: 'task', enabled: true },
    { type: 'promotion', enabled: true },
    { type: 'activity', enabled: true },
  ]);

  useEffect(() => {
    if (data?.preferences) setLocalPrefs(data.preferences);
  }, [data]);

  const togglePref = async (type: PreferenceType, enabled: boolean) => {
    if (!token) return;
    setLocalPrefs(prev => prev.map(p => p.type === type ? { ...p, enabled } : p));
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      headers.Authorization = `Bearer ${token}`;
      await fetch(`${API_URL}/api/notifications/preferences/update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type, enabled })
      });
      mutate();
    } catch (e) {
      console.error('Failed to update preference', e);
    }
  };

  const rows = [
    { type: 'system', label: 'System Alerts', desc: 'Announcements, maintenance, and important updates.' },
    { type: 'task', label: 'Task Updates', desc: 'Resume scans, application statuses, and reminders.' },
    { type: 'promotion', label: 'Promotional Updates', desc: 'New features, offers, and newsletters.' },
    { type: 'activity', label: 'Activity / Misc.', desc: 'General activity and informational messages.' },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold text-gray-900">Notification Preferences</h1>
      <p className="text-sm text-gray-500 mt-1">Choose which notifications you want to receive.</p>

      <div className="mt-6 bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {rows.map(row => {
          const current = localPrefs.find(p => p.type === row.type) || { enabled: true };
          return (
            <div key={row.type} className="flex items-center justify-between px-4 py-4">
              <div>
                <div className="text-sm font-medium text-gray-900">{row.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{row.desc}</div>
              </div>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={current ? current.enabled : true}
                  onChange={(e) => togglePref(row.type, e.target.checked)}
                />
                <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute relative after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0E8F6B]"></div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}


