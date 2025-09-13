'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Calendar, Loader2, Trash2, X, Eye, Upload } from 'lucide-react';
import { useToast } from '../../../../components/notifications/ToastContainer';
import { useAuth } from '@/contexts/AuthContext';

interface SavedResume {
  id: string;
  resumeName: string;
  resumeText: string;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://all-in-one-career.onrender.com';

const SavedResumesPage: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<SavedResume | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<SavedResume | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSavedResumes();
  }, []);

  const fetchSavedResumes = async () => {
    try {
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

      let response = await fetch(`${API_BASE_URL}/api/ats/saved-resumes`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      // If unauthorized, refresh token once and retry
      if (response.status === 401 && user) {
        try {
          const freshToken = await user.getIdToken(true);
          response = await fetch(`${API_BASE_URL}/api/ats/saved-resumes`, {
            headers: {
              'Authorization': `Bearer ${freshToken}`,
            },
          });
        } catch (refreshErr) {
          console.error('Failed to refresh token:', refreshErr);
        }
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved resumes');
      }
      
      const data = await response.json();
      
      // Debug what we received from the backend
      console.log('📥 Received saved resumes from backend:', data.map((r: SavedResume) => ({
        id: r.id,
        resumeName: r.resumeName,
        resumeTextLength: r.resumeText?.length || 0,
        hasResumeText: !!r.resumeText,
        resumeTextPreview: r.resumeText?.slice(0, 100) + '...'
      })));
      
      setResumes(data);
    } catch (error) {
      console.error('Failed to fetch saved resumes:', error);
      showToast({ 
        icon: '❌', 
        title: 'Error', 
        message: 'Failed to load saved resumes' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseResume = (resume: SavedResume) => {
    console.log('Using saved resume:', {
      resumeName: resume.resumeName,
      resumeTextLength: resume.resumeText?.length || 0,
      resumeTextPreview: resume.resumeText?.slice(0, 200) + '...'
    });
    
    // Double-check that we have the full content (backend should have reassembled it)
    if (resume.resumeText && resume.resumeText.length < 1000) {
      console.warn('Resume content seems short - this might indicate reassembly issues');
      console.log('Full resume text received:', resume.resumeText);
    }
    
    // Store the resume data in localStorage to be picked up by the ATS scanner
    const resumeDataToStore = {
      text: resume.resumeText,
      filename: `${resume.resumeName}.txt`,
      source: 'saved' as const
    };
    
    console.log('Storing in localStorage:', {
      textLength: resumeDataToStore.text?.length || 0,
      filename: resumeDataToStore.filename,
      source: resumeDataToStore.source
    });
    
    localStorage.setItem('selectedResumeData', JSON.stringify(resumeDataToStore));
    
    showToast({
      icon: '✅',
      title: 'Resume Selected',
      message: `"${resume.resumeName}" is ready to use (${resumeDataToStore.text?.length || 0} chars)`
    });
    
    // Navigate to ATS scanner
    router.push('/ats-scanner');
  };

  const handleViewResume = (resume: SavedResume) => {
    setSelectedResume(resume);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setSelectedResume(null);
  };

  const handleDeleteClick = (resume: SavedResume) => {
    setResumeToDelete(resume);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resumeToDelete || !user) return;

    setIsDeleting(true);
    try {
      const authToken = await user.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/api/ats/saved-resumes/${resumeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the deleted resume from the local state
        setResumes(prevResumes => 
          prevResumes.filter(resume => resume.id !== resumeToDelete.id)
        );
        
        showToast({
          icon: '✅',
          title: 'Resume Deleted',
          message: `"${resumeToDelete.resumeName}" has been deleted successfully`
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete resume');
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      showToast({
        icon: '❌',
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete resume'
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setResumeToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setResumeToDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600">Loading saved resumes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/ats-scanner')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Scanner</span>
            </button>
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-xl font-semibold text-gray-900">Saved Resumes</h1>
              <p className="text-sm text-gray-500">
                {resumes.length} saved resume{resumes.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {resumes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No saved resumes</h3>
            <p className="mt-2 text-gray-600">
              You haven't saved any resumes yet. Upload and save resumes from the ATS Scanner.
            </p>
            <button
              onClick={() => router.push('/ats-scanner')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to ATS Scanner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div key={resume.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{resume.resumeName}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <button
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    onClick={() => handleDeleteClick(resume)}
                    title="Delete resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleUseResume(resume)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    Use Resume
                  </button>
                  <button
                    onClick={() => handleViewResume(resume)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Resume Modal */}
      {viewModalOpen && selectedResume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedResume.resumeName}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Saved on {new Date(selectedResume.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={closeViewModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="bg-gray-50 rounded-lg p-4 border">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                  {selectedResume.resumeText}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <div className="text-sm text-gray-500">
                {selectedResume.resumeText.length} characters
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleUseResume(selectedResume);
                    closeViewModal();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Use This Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && resumeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            {/* Modal Header */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Delete Resume</h2>
              <p className="text-sm text-gray-500 mt-1">
                This action cannot be undone
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-700">
                Are you sure you want to delete <span className="font-medium">"{resumeToDelete.resumeName}"</span>? 
                This will permanently remove the resume from your saved resumes.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Resume
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedResumesPage;
