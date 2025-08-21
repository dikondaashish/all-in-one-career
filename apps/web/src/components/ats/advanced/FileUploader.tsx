'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, File, X, Check, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => Promise<void>;
  isProcessing: boolean;
  acceptedTypes?: string;
  maxSize?: number;
  multiple?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  isProcessing,
  acceptedTypes = '.pdf,.doc,.docx,.txt',
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size must be less than ${formatFileSize(maxSize)}`;
    }

    // Check file type
    const allowedTypes = acceptedTypes.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return `File type not supported. Allowed types: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      setErrorMessage(validationError);
      setUploadStatus('error');
      return;
    }

    setSelectedFile(file);
    setUploadStatus('uploading');
    setErrorMessage('');

    try {
      await onFileSelect(file);
      setUploadStatus('success');
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    }
  }, [onFileSelect, maxSize, acceptedTypes]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Get status icon
  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>;
      case 'success':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Upload className="h-8 w-8 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = () => {
    if (isDragOver) return 'border-blue-400 bg-blue-50';
    switch (uploadStatus) {
      case 'uploading':
        return 'border-blue-400 bg-blue-50';
      case 'success':
        return 'border-green-400 bg-green-50';
      case 'error':
        return 'border-red-400 bg-red-50';
      default:
        return 'border-gray-300 hover:border-gray-400';
    }
  };

  return (
    <div className="file-uploader">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={isProcessing}
      />

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${getStatusColor()}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
        `}
      >
        <div className="flex flex-col items-center space-y-4">
          {getStatusIcon()}
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {uploadStatus === 'success' ? 'File uploaded successfully!' :
               uploadStatus === 'uploading' ? 'Processing file...' :
               uploadStatus === 'error' ? 'Upload failed' :
               'Drop your resume here or click to browse'}
            </h3>
            
            {uploadStatus === 'idle' && (
              <p className="text-sm text-gray-500">
                Supports PDF, DOC, DOCX, and TXT files up to {formatFileSize(maxSize)}
              </p>
            )}
          </div>

          {/* File info */}
          {selectedFile && (
            <div className="bg-white rounded-lg p-4 shadow-sm border w-full max-w-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <File className="h-8 w-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                
                {uploadStatus !== 'uploading' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelection();
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Progress bar for uploading state */}
              {uploadStatus === 'uploading' && (
                <div className="mt-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 w-full max-w-md">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-100 bg-opacity-50 border-2 border-blue-400 border-dashed rounded-lg flex items-center justify-center">
            <p className="text-blue-700 font-medium">Drop file here</p>
          </div>
        )}
      </div>

      {/* File type info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Supported formats: {acceptedTypes.replace(/\./g, '').toUpperCase()}
        </p>
      </div>
    </div>
  );
};

export default FileUploader;
