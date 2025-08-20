'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Brain, Target, TrendingUp, Clock, Trash2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useAtsScanner, AtsScanResult, AtsScanHistoryItem, AtsScanDetail } from '@/hooks/useAtsScanner';
import { useToast } from '@/components/notifications/ToastContainer';
import { formatDistanceToNow } from 'date-fns';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function AtsScannerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [scanResult, setScanResult] = useState<AtsScanResult | null>(null);
  const [history, setHistory] = useState<AtsScanHistoryItem[]>([]);
  const [selectedScan, setSelectedScan] = useState<AtsScanDetail | null>(null);
  const [showKeywords, setShowKeywords] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { scanResume, getAtsHistory, getScanDetail, deleteScan, isScanning, isLoadingHistory } = useAtsScanner();
  const { showToast } = useToast();

  // Load history on component mount
  useState(() => {
    loadHistory();
  });

  const loadHistory = async () => {
    try {
      const historyData = await getAtsHistory(10, 0);
      setHistory(historyData.scans);
    } catch (error) {
      console.error('Failed to load history:', error);
      showToast({
        icon: '⚠️',
        title: 'Error',
        message: 'Failed to load scan history'
      });
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      showToast({
        icon: '❌',
        title: 'Invalid File',
        message: 'Please upload a DOC or DOCX file. PDF support is temporarily unavailable.'
      });
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      showToast({
        icon: '❌',
        title: 'File Too Large',
        message: 'File size must be under 10MB'
      });
      return;
    }
    
    setFile(selectedFile);
    setScanResult(null); // Clear previous results
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleScan = async () => {
    if (!file) {
      showToast({
        icon: '⚠️',
        title: 'No File',
        message: 'Please select a resume file first'
      });
      return;
    }

    try {
      const result = await scanResume(file, jobDescription.trim() || undefined);
      setScanResult(result);
      loadHistory(); // Refresh history
      
      showToast({
        icon: '✅',
        title: 'Scan Complete',
        message: `Resume processed with ${result.matchScore}% match`
      });
    } catch (error) {
      console.error('Scan failed:', error);
      showToast({
        icon: '❌',
        title: 'Scan Failed',
        message: error instanceof Error ? error.message : 'Failed to scan resume'
      });
    }
  };

  const handleHistoryClick = async (scanId: string) => {
    try {
      const detail = await getScanDetail(scanId);
      setSelectedScan(detail);
      setScanResult({
        scanId: detail.id,
        matchScore: detail.matchScore,
        summary: {
          name: detail.parsedJson.name,
          email: detail.parsedJson.email,
          phone: detail.parsedJson.phone,
          skills: detail.parsedJson.skills
        },
        missingSkills: detail.missingSkills,
        extraSkills: detail.extraSkills,
        keywords: detail.keywords
      });
    } catch (error) {
      console.error('Failed to load scan detail:', error);
      showToast({
        icon: '❌',
        title: 'Error',
        message: 'Failed to load scan details'
      });
    }
  };

  const handleDeleteScan = async (scanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this scan?')) {
      return;
    }
    
    try {
      await deleteScan(scanId);
      loadHistory(); // Refresh history
      
      if (selectedScan?.id === scanId) {
        setSelectedScan(null);
        setScanResult(null);
      }
      
      showToast({
        icon: '✅',
        title: 'Deleted',
        message: 'Scan deleted successfully'
      });
    } catch (error) {
      console.error('Failed to delete scan:', error);
      showToast({
        icon: '❌',
        title: 'Error',
        message: 'Failed to delete scan'
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 50) return 'bg-amber-100 dark:bg-amber-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">ATS Scanner</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload your resume and get an instant ATS compatibility score with detailed feedback.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Brain className="w-4 h-4" />
          <span>AI-Powered Analysis</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload and Scan Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Resume</h2>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-4">
                  <FileText className="w-12 h-12 mx-auto text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Drop your resume here, or{' '}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Supports DOC, DOCX (max 10MB). PDF support coming soon.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".doc,.docx"
              onChange={handleFileChange}
            />
          </div>

          {/* Job Description */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Description (Optional)</h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to get a match score and see missing skills..."
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Scan Button */}
          <button
            onClick={handleScan}
            disabled={!file || isScanning}
            className="w-full bg-[#006B53] hover:bg-[#005A47] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {isScanning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Scanning Resume...</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span>Scan Resume</span>
              </>
            )}
          </button>
        </div>

        {/* History Section */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Recent Scans
            </h2>
            
            {isLoadingHistory ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-3">
                {history.map((scan) => (
                  <div
                    key={scan.id}
                    onClick={() => handleHistoryClick(scan.id)}
                    className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {scan.fileName}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs font-medium ${getScoreColor(scan.matchScore)}`}>
                            {scan.matchScore}% match
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteScan(scan.id, e)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No scans yet. Upload a resume to get started!</p>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {scanResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2" />
            Scan Results
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Match Score */}
            <div className={`rounded-lg p-6 ${getScoreBgColor(scanResult.matchScore)}`}>
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(scanResult.matchScore)} mb-2`}>
                  {scanResult.matchScore}%
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">ATS Match Score</p>
              </div>
            </div>

            {/* Summary Info */}
            <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Resume Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {scanResult.summary.name && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Name:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">{scanResult.summary.name}</span>
                  </div>
                )}
                {scanResult.summary.email && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">{scanResult.summary.email}</span>
                  </div>
                )}
                {scanResult.summary.phone && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">{scanResult.summary.phone}</span>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <span className="text-gray-500 dark:text-gray-400">Skills Found:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">{scanResult.summary.skills.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Analysis */}
          {(scanResult.missingSkills.length > 0 || scanResult.extraSkills.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Missing Skills */}
              {scanResult.missingSkills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3">
                    Missing Skills ({scanResult.missingSkills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {scanResult.missingSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra Skills */}
              {scanResult.extraSkills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-600 dark:text-green-400 mb-3">
                    Additional Skills ({scanResult.extraSkills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {scanResult.extraSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Keywords Section */}
          {scanResult.keywords.length > 0 && (
            <div>
              <button
                onClick={() => setShowKeywords(!showKeywords)}
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span className="font-semibold">Keyword Analysis ({scanResult.keywords.length})</span>
                {showKeywords ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showKeywords && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left py-2 text-gray-700 dark:text-gray-300">Keyword</th>
                        <th className="text-center py-2 text-gray-700 dark:text-gray-300">In Resume</th>
                        <th className="text-center py-2 text-gray-700 dark:text-gray-300">In Job Desc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanResult.keywords.map((keyword, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-2 text-gray-900 dark:text-white">{keyword.keyword}</td>
                          <td className="text-center py-2">
                            <span className={keyword.inResume ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>
                              {keyword.inResume ? '✓' : '✗'}
                            </span>
                          </td>
                          <td className="text-center py-2">
                            <span className={keyword.inJobDesc ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}>
                              {keyword.inJobDesc ? '✓' : '✗'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
