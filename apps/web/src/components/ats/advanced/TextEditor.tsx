'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Type, Copy, Trash2, Eye, EyeOff, Maximize2 } from 'lucide-react';

interface TextEditorProps {
  onTextChange: (text: string) => void;
  isProcessing: boolean;
  placeholder?: string;
  initialValue?: string;
  maxLength?: number;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  onTextChange,
  isProcessing,
  placeholder = "Enter your resume content here...",
  initialValue = '',
  maxLength = 50000
}) => {
  const [text, setText] = useState(initialValue);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update counts when text changes
  useEffect(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharacterCount(text.length);
    
    // Debounced callback to parent
    const timer = setTimeout(() => {
      onTextChange(text);
    }, 500);

    return () => clearTimeout(timer);
  }, [text, onTextChange]);

  // Handle text change
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= maxLength) {
      setText(newText);
    }
  }, [maxLength]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [text]);

  // Clear text
  const handleClear = useCallback(() => {
    setText('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    if (textareaRef.current && !isFullscreen) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isFullscreen]);

  useEffect(() => {
    autoResize();
  }, [text, autoResize]);

  // Format text for preview
  const formatPreviewText = (text: string): string => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n');
  };

  // Get progress color based on character count
  const getProgressColor = (): string => {
    const percentage = (characterCount / maxLength) * 100;
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`text-editor ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-6' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Type className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Resume Text Editor
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title={showPreview ? 'Hide preview' : 'Show preview'}
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          
          <button
            onClick={handleCopy}
            disabled={!text.trim()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            title="Copy text"
          >
            <Copy className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleClear}
            disabled={!text.trim() || isProcessing}
            className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
            title="Clear text"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={`${showPreview ? 'grid grid-cols-2 gap-4' : ''}`}>
        {/* Editor */}
        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            placeholder={placeholder}
            disabled={isProcessing}
            className={`
              w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
              disabled:opacity-50 resize-none
              dark:bg-gray-800 dark:text-white
              ${isFullscreen ? 'h-96' : 'min-h-[300px]'}
            `}
            style={!isFullscreen ? { height: 'auto', minHeight: '300px' } : {}}
          />

          {/* Character Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Characters: {characterCount.toLocaleString()} / {maxLength.toLocaleString()}</span>
              <span>Words: {wordCount.toLocaleString()}</span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${Math.min((characterCount / maxLength) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Text Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {wordCount}
              </div>
              <div className="text-xs text-blue-500 dark:text-blue-300">Words</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {text.split('\n').filter(line => line.trim()).length}
              </div>
              <div className="text-xs text-green-500 dark:text-green-300">Lines</div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {Math.ceil(characterCount / 1000)}
              </div>
              <div className="text-xs text-purple-500 dark:text-purple-300">KB</div>
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Formatted Preview
            </h4>
            <div className="h-96 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                {formatPreviewText(text) || (
                  <span className="text-gray-400 italic">Start typing to see preview...</span>
                )}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      {!text.trim() && (
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            💡 Tips for better ATS results
          </h4>
          <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Include relevant keywords from the job description</li>
            <li>• Use standard section headings (Experience, Education, Skills)</li>
            <li>• Include quantifiable achievements and results</li>
            <li>• Keep formatting simple and clean</li>
            <li>• Use action verbs to start bullet points</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default TextEditor;
