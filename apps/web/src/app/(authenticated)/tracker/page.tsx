'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Application {
  id: string;
  company: string;
  role: string;
  status: string;
  appliedDate: string;
  jdId?: string;
  notes?: string;
  createdAt: string;
}

interface ApplicationForm {
  company: string;
  role: string;
  status: string;
  jdId: string;
  notes: string;
}

export default function TrackerPage() {
  const { user, loading, hasSkippedAuth } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ApplicationForm>({
    company: '',
    role: '',
    status: 'APPLIED',
    jdId: '',
    notes: ''
  });

  useEffect(() => {
    if (!loading && !user && !hasSkippedAuth()) {
      router.push('/');
    }
  }, [user, loading, hasSkippedAuth, router]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user && !hasSkippedAuth()) {
    return null;
  }

  const fetchApplications = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications`, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const result = await response.json();
      setApplications(result.applications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.company.trim() || !form.role.trim()) {
      setError('Company and Role are required');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          ...form,
          jdId: form.jdId || null,
          notes: form.notes || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create application');
      }

      // Reset form and refresh applications
      setForm({
        company: '',
        role: '',
        status: 'APPLIED',
        jdId: '',
        notes: ''
      });
      setShowForm(false);
      fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: keyof ApplicationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED': return 'bg-blue-100 text-blue-800';
      case 'INTERVIEWING': return 'bg-yellow-100 text-yellow-800';
      case 'OFFER': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'SAVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Job Applications Tracker</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Application'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Application</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Company *
              </label>
              <input
                type="text"
                id="company"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company name"
                value={form.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <input
                type="text"
                id="role"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter job role"
                value={form.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={form.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="SAVED">Saved</option>
                <option value="APPLIED">Applied</option>
                <option value="INTERVIEWING">Interviewing</option>
                <option value="OFFER">Offer</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <label htmlFor="jdId" className="block text-sm font-medium text-gray-700 mb-2">
                Job Description ID
              </label>
              <input
                type="text"
                id="jdId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional JD reference"
                value={form.jdId}
                onChange={(e) => handleInputChange('jdId', e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add any notes about this application..."
                value={form.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                disabled={isCreating}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create Application'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Applications ({applications.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No applications found. Add your first application above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {app.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {app.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(app.appliedDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {app.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
