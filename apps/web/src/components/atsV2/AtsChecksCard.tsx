/**
 * ATS Checks Card - Foundational ATS compatibility checklist
 */

import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Target,
  ExternalLink
} from 'lucide-react';

interface AtsChecksData {
  fileTypeOk: boolean;
  fileNameOk: boolean;
  contact: {
    email: boolean;
    phone: boolean;
    location: boolean;
    links: string[];
  };
  sections: {
    experience: boolean;
    education: boolean;
    skills: boolean;
    summary: boolean;
  };
  datesValid: boolean;
  wordCount: number;
  wordCountStatus: "under" | "optimal" | "over";
  jobTitleMatch: {
    exact: boolean;
    normalizedSimilarity: number;
  };
}

interface AtsChecksCardProps {
  data: AtsChecksData;
}

export const AtsChecksCard: React.FC<AtsChecksCardProps> = ({ data }) => {
  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getWordCountStatus = () => {
    switch (data.wordCountStatus) {
      case 'optimal':
        return { icon: <CheckCircle className="w-5 h-5 text-green-500" />, color: 'text-green-700', bg: 'bg-green-50' };
      case 'under':
        return { icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />, color: 'text-yellow-700', bg: 'bg-yellow-50' };
      case 'over':
        return { icon: <AlertTriangle className="w-5 h-5 text-orange-500" />, color: 'text-orange-700', bg: 'bg-orange-50' };
    }
  };

  const getJobTitleMatchStatus = () => {
    if (data.jobTitleMatch.exact) {
      return { icon: <CheckCircle className="w-5 h-5 text-green-500" />, color: 'text-green-700', status: 'Exact Match' };
    } else if (data.jobTitleMatch.normalizedSimilarity > 0.8) {
      return { icon: <CheckCircle className="w-5 h-5 text-blue-500" />, color: 'text-blue-700', status: 'High Similarity' };
    } else if (data.jobTitleMatch.normalizedSimilarity > 0.6) {
      return { icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />, color: 'text-yellow-700', status: 'Moderate Similarity' };
    } else {
      return { icon: <XCircle className="w-5 h-5 text-red-500" />, color: 'text-red-700', status: 'Low Similarity' };
    }
  };

  const wordCountStatus = getWordCountStatus();
  const jobTitleStatus = getJobTitleMatchStatus();

  // Calculate overall ATS compatibility percentage
  const totalChecks = 10; // Adjust based on actual checks
  let passedChecks = 0;
  
  if (data.fileTypeOk) passedChecks++;
  if (data.fileNameOk) passedChecks++;
  if (data.contact.email) passedChecks++;
  if (data.contact.phone) passedChecks++;
  if (data.contact.location) passedChecks++;
  if (data.sections.experience) passedChecks++;
  if (data.sections.education) passedChecks++;
  if (data.sections.skills) passedChecks++;
  if (data.sections.summary) passedChecks++;
  if (data.datesValid) passedChecks++;

  const compatibilityScore = Math.round((passedChecks / totalChecks) * 100);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">ATS Compatibility Check</h3>
              <p className="text-sm text-gray-600">Foundational resume scanning requirements</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${compatibilityScore >= 80 ? 'text-green-600' : compatibilityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {compatibilityScore}%
            </div>
            <div className="text-sm text-gray-600">Compatible</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        
        {/* File Format Checks */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-gray-600" />
            File Format
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              {getStatusIcon(data.fileTypeOk)}
              <span className="text-sm font-medium">File Type Supported</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              {getStatusIcon(data.fileNameOk)}
              <span className="text-sm font-medium">File Name Clean</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
            <Mail className="w-4 h-4 mr-2 text-gray-600" />
            Contact Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              {getStatusIcon(data.contact.email)}
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Email Address</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              {getStatusIcon(data.contact.phone)}
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Phone Number</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              {getStatusIcon(data.contact.location)}
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Location</span>
            </div>
          </div>
          
          {/* Web Presence Links */}
          {data.contact.links.length > 0 && (
            <div className="mt-3">
              <div className="text-sm text-gray-600 mb-2">Web Presence Found:</div>
              <div className="flex flex-wrap gap-2">
                {data.contact.links.map((link, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {link.charAt(0).toUpperCase() + link.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resume Sections */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
            <Hash className="w-4 h-4 mr-2 text-gray-600" />
            Resume Sections
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              {getStatusIcon(data.sections.experience)}
              <span className="text-sm font-medium">Work Experience</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              {getStatusIcon(data.sections.education)}
              <span className="text-sm font-medium">Education</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              {getStatusIcon(data.sections.skills)}
              <span className="text-sm font-medium">Skills</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              {getStatusIcon(data.sections.summary)}
              <span className="text-sm font-medium">Summary/Profile</span>
            </div>
          </div>
        </div>

        {/* Additional Checks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Word Count */}
          <div className={`p-4 rounded-lg border-2 ${wordCountStatus.bg} ${wordCountStatus.color === 'text-green-700' ? 'border-green-200' : wordCountStatus.color === 'text-yellow-700' ? 'border-yellow-200' : 'border-orange-200'}`}>
            <div className="flex items-center space-x-3 mb-2">
              {wordCountStatus.icon}
              <span className="font-semibold">Word Count</span>
            </div>
            <div className={`text-sm ${wordCountStatus.color}`}>
              <div className="font-medium">{data.wordCount} words</div>
              <div className="mt-1">
                Status: <span className="capitalize font-semibold">{data.wordCountStatus}</span>
                {data.wordCountStatus === 'under' && <span className="block text-xs mt-1">Consider adding more detail</span>}
                {data.wordCountStatus === 'over' && <span className="block text-xs mt-1">Consider condensing content</span>}
                {data.wordCountStatus === 'optimal' && <span className="block text-xs mt-1">Perfect length for ATS scanning</span>}
              </div>
            </div>
          </div>

          {/* Job Title Match */}
          <div className={`p-4 rounded-lg border-2 ${jobTitleStatus.color === 'text-green-700' ? 'bg-green-50 border-green-200' : jobTitleStatus.color === 'text-blue-700' ? 'bg-blue-50 border-blue-200' : jobTitleStatus.color === 'text-yellow-700' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center space-x-3 mb-2">
              {jobTitleStatus.icon}
              <span className="font-semibold">Job Title Match</span>
            </div>
            <div className={`text-sm ${jobTitleStatus.color}`}>
              <div className="font-medium">{jobTitleStatus.status}</div>
              <div className="mt-1">
                Similarity: <span className="font-semibold">{Math.round(data.jobTitleMatch.normalizedSimilarity * 100)}%</span>
                {!data.jobTitleMatch.exact && data.jobTitleMatch.normalizedSimilarity < 0.8 && (
                  <span className="block text-xs mt-1">Consider including the exact job title</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Date Validation */}
        <div className="flex items-center space-x-3 p-4 rounded-lg bg-gray-50">
          <Calendar className="w-5 h-5 text-gray-500" />
          {getStatusIcon(data.datesValid)}
          <div>
            <span className="font-medium text-gray-900">Date Formatting</span>
            <div className="text-sm text-gray-600">
              {data.datesValid ? 'Proper date format detected' : 'Consider adding clear employment dates'}
            </div>
          </div>
        </div>

        {/* Action Summary */}
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
          <h4 className="font-semibold text-blue-900 mb-2">Quick Fixes</h4>
          <div className="text-sm text-blue-800 space-y-1">
            {!data.contact.email && <div>• Add your email address</div>}
            {!data.contact.phone && <div>• Include your phone number</div>}
            {!data.sections.skills && <div>• Add a dedicated skills section</div>}
            {data.wordCountStatus === 'under' && <div>• Expand your experience descriptions</div>}
            {data.wordCountStatus === 'over' && <div>• Condense content to focus on key achievements</div>}
            {data.jobTitleMatch.normalizedSimilarity < 0.6 && <div>• Include the exact job title you're applying for</div>}
            {passedChecks === totalChecks && <div>✓ Your resume passes all foundational ATS checks!</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
