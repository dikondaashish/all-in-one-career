'use client';

import { useState, useEffect } from 'react';
import { Star, Trash2, Calendar, FileText, Plus, Edit2, X } from 'lucide-react';

interface SavedResume {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  lastUsed: string;
}

interface SavedResumesProps {
  onSelectResume: (content: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentResumeText?: string;
}

const SavedResumes = ({ onSelectResume, isOpen, onClose, currentResumeText }: SavedResumesProps) => {
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Load saved resumes from localStorage on component mount
  useEffect(() => {
    if (isOpen) {
      loadSavedResumes();
    }
  }, [isOpen]);

  const loadSavedResumes = () => {
    try {
      const saved = localStorage.getItem('ats-saved-resumes');
      if (saved) {
        const resumes = JSON.parse(saved);
        setSavedResumes(resumes.sort((a: SavedResume, b: SavedResume) => 
          new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
        ));
      }
    } catch (error) {
      console.error('Failed to load saved resumes:', error);
    }
  };

  const saveCurrentResume = () => {
    if (!currentResumeText?.trim()) {
      alert('No resume content to save');
      return;
    }
    
    if (!saveName.trim()) {
      alert('Please enter a name for your resume');
      return;
    }

    const resume: SavedResume = {
      id: Date.now().toString(),
      name: saveName.trim(),
      content: currentResumeText.trim(),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    const updated = [resume, ...savedResumes];
    setSavedResumes(updated);
    localStorage.setItem('ats-saved-resumes', JSON.stringify(updated));
    
    // Reset form
    setSaveName('');
    setShowSaveDialog(false);
  };

  const deleteResume = (id: string) => {
    if (confirm('Are you sure you want to delete this resume?')) {
      const updated = savedResumes.filter(r => r.id !== id);
      setSavedResumes(updated);
      localStorage.setItem('ats-saved-resumes', JSON.stringify(updated));
    }
  };

  const updateLastUsed = (resumeId: string) => {
    const updated = savedResumes.map(resume => 
      resume.id === resumeId 
        ? { ...resume, lastUsed: new Date().toISOString() }
        : resume
    );
    setSavedResumes(updated);
    localStorage.setItem('ats-saved-resumes', JSON.stringify(updated));
  };

  const selectResume = (resume: SavedResume) => {
    updateLastUsed(resume.id);
    onSelectResume(resume.content);
    onClose();
  };

  const startEditing = (resume: SavedResume) => {
    setEditingId(resume.id);
    setEditName(resume.name);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) {
      alert('Resume name cannot be empty');
      return;
    }

    const updated = savedResumes.map(resume => 
      resume.id === id 
        ? { ...resume, name: editName.trim() }
        : resume
    );
    setSavedResumes(updated);
    localStorage.setItem('ats-saved-resumes', JSON.stringify(updated));
    setEditingId(null);
    setEditName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Saved Resumes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your saved resume versions</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Save Current Resume Section */}
        {currentResumeText?.trim() && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            {!showSaveDialog ? (
              <button
                onClick={() => setShowSaveDialog(true)}
                className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Save Current Resume</span>
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter resume name (e.g., Software Engineer Resume)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  onKeyDown={(e) => e.key === 'Enter' && saveCurrentResume()}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={saveCurrentResume}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Save Resume
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveDialog(false);
                      setSaveName('');
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved Resumes List */}
        <div className="flex-1 overflow-y-auto p-6">
          {savedResumes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No saved resumes yet</h4>
              <p className="text-gray-600 dark:text-gray-400">
                {currentResumeText?.trim() 
                  ? "Save your current resume to reuse it later" 
                  : "Add some resume content first, then save it for reuse"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedResumes.map(resume => (
                <div key={resume.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      {editingId === resume.id ? (
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(resume.id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(resume.id)}
                            className="p-1 text-green-600 hover:text-green-700"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">{resume.name}</h4>
                          <button
                            onClick={() => startEditing(resume)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Created: {new Date(resume.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          Used: {new Date(resume.lastUsed).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {resume.content.substring(0, 120)}...
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => deleteResume(resume.id)}
                      className="text-red-400 hover:text-red-600 dark:hover:text-red-300 ml-2 p-1 transition-colors"
                      title="Delete resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => selectResume(resume)}
                    className="w-full text-sm bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Use This Resume
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedResumes;
