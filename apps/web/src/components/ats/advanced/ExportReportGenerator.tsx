'use client';

import React, { useState } from 'react';
import { FileText, FileSpreadsheet, File } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ATSAnalysis {
  overall_score: number;
  keyword_match: KeywordAnalysis;
  section_analysis: SectionAnalysis;
  formatting_score: FormattingAnalysis;
  recommendations: Recommendation[];
  missing_keywords: string[];
  strength_areas: string[];
  improvement_areas: string[];
  ats_compatibility: number;
  estimated_pass_rate: number;
}

interface KeywordAnalysis {
  total_keywords: number;
  matched_keywords: number;
  match_percentage: number;
  critical_missing: string[];
  matched_list: MatchedKeyword[];
  keyword_density: number;
  semantic_matches: number;
}

interface MatchedKeyword {
  keyword: string;
  resume_frequency: number;
  job_frequency: number;
  importance_weight: number;
  match_type: 'exact' | 'partial' | 'synonym' | 'semantic';
  context: string;
}

interface SectionAnalysis {
  personal_info_score: number;
  experience_score: number;
  education_score: number;
  skills_score: number;
  formatting_score: number;
  completeness_score: number;
}

interface FormattingAnalysis {
  readability_score: number;
  structure_score: number;
  length_score: number;
  bullet_usage: number;
  action_verbs: number;
  quantifiable_results: number;
}

interface Recommendation {
  type: 'critical' | 'important' | 'suggestion';
  category: 'keywords' | 'formatting' | 'content' | 'structure';
  title: string;
  description: string;
  before?: string;
  after?: string;
  impact_score: number;
}

interface ResumeData {
  content: string;
  wordCount: number;
  characterCount: number;
  sections: ResumeSection[];
  source: 'manual' | 'file' | 'url';
  filename?: string;
  extractedAt: Date;
}

interface ResumeSection {
  type: 'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'summary';
  content: string;
  keywords: string[];
  startIndex: number;
  endIndex: number;
}

interface JobDescription {
  title: string;
  company: string;
  requirements: string[];
  responsibilities: string[];
  qualifications: string[];
  keywords: string[];
  experience_level: 'entry' | 'mid' | 'senior' | 'executive';
  content: string;
  source: 'manual' | 'file' | 'url';
  url?: string;
  extractedAt: Date;
}

interface ExportOptions {
  includeRecommendations: boolean;
  includeScoreBreakdown: boolean;
  includeMissingKeywords: boolean;
  includeMatchedKeywords: boolean;
  includeResumeText: boolean;
  includeJobDescription: boolean;
}

interface ExportReportGeneratorProps {
  analysis: ATSAnalysis;
  resumeData: ResumeData | null;
  jobData: JobDescription | null;
}

export const ExportReportGenerator: React.FC<ExportReportGeneratorProps> = ({
  analysis,
  resumeData,
  jobData
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeRecommendations: true,
    includeScoreBreakdown: true,
    includeMissingKeywords: true,
    includeMatchedKeywords: false,
    includeResumeText: false,
    includeJobDescription: false
  });
  const [isExporting, setIsExporting] = useState(false);

  const generatePDFReport = async () => {
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF();
      let yPosition = 20;
      const pageHeight = pdf.internal.pageSize.height;
      const lineHeight = 6;
      const margin = 20;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPosition = 20;
        }
      };

      // Helper function to add text with wrapping
      const addText = (text: string, fontSize = 10, isBold = false) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        const lines = pdf.splitTextToSize(text, 170);
        checkPageBreak(lines.length * lineHeight + 5);
        
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * lineHeight + 5;
      };

      // Header
      addText('ATS ANALYSIS REPORT', 20, true);
      addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
      yPosition += 10;

      // Executive Summary
      addText('EXECUTIVE SUMMARY', 16, true);
      addText(`Overall ATS Score: ${analysis.overall_score}/100`);
      addText(`Keyword Match Rate: ${analysis.keyword_match.match_percentage}%`);
      addText(`ATS Compatibility: ${analysis.ats_compatibility}%`);
      addText(`Estimated Pass Rate: ${analysis.estimated_pass_rate}%`);
      yPosition += 10;

      // Resume Information
      if (resumeData) {
        addText('RESUME INFORMATION', 16, true);
        addText(`Source: ${resumeData.source}`);
        addText(`Word Count: ${resumeData.wordCount.toLocaleString()}`);
        addText(`Character Count: ${resumeData.characterCount.toLocaleString()}`);
        addText(`Sections Found: ${resumeData.sections.length}`);
        if (resumeData.filename) {
          addText(`Filename: ${resumeData.filename}`);
        }
        yPosition += 10;
      }

      // Job Information
      if (jobData) {
        addText('JOB INFORMATION', 16, true);
        addText(`Position: ${jobData.title}`);
        addText(`Company: ${jobData.company}`);
        addText(`Experience Level: ${jobData.experience_level}`);
        addText(`Source: ${jobData.source}`);
        if (jobData.url) {
          addText(`URL: ${jobData.url}`);
        }
        yPosition += 10;
      }

      // Score Breakdown
      if (exportOptions.includeScoreBreakdown) {
        addText('SCORE BREAKDOWN', 16, true);
        addText(`Personal Information: ${analysis.section_analysis.personal_info_score}/100`);
        addText(`Professional Experience: ${analysis.section_analysis.experience_score}/100`);
        addText(`Education: ${analysis.section_analysis.education_score}/100`);
        addText(`Skills: ${analysis.section_analysis.skills_score}/100`);
        addText(`Formatting: ${analysis.section_analysis.formatting_score}/100`);
        addText(`Completeness: ${analysis.section_analysis.completeness_score}/100`);
        yPosition += 10;

        addText('FORMATTING ANALYSIS', 14, true);
        addText(`Readability Score: ${analysis.formatting_score.readability_score}/100`);
        addText(`Structure Score: ${analysis.formatting_score.structure_score}/100`);
        addText(`Length Score: ${analysis.formatting_score.length_score}/100`);
        addText(`Action Verbs Found: ${analysis.formatting_score.action_verbs}`);
        addText(`Quantifiable Results: ${analysis.formatting_score.quantifiable_results}`);
        yPosition += 10;
      }

      // Keyword Analysis
      addText('KEYWORD ANALYSIS', 16, true);
      addText(`Total Keywords in Job Description: ${analysis.keyword_match.total_keywords}`);
      addText(`Keywords Found in Resume: ${analysis.keyword_match.matched_keywords}`);
      addText(`Match Percentage: ${analysis.keyword_match.match_percentage}%`);
      addText(`Semantic Matches: ${analysis.keyword_match.semantic_matches}`);
      addText(`Keyword Density: ${analysis.keyword_match.keyword_density.toFixed(2)}%`);
      yPosition += 10;

      // Critical Missing Keywords
      if (exportOptions.includeMissingKeywords && analysis.missing_keywords.length > 0) {
        addText('CRITICAL MISSING KEYWORDS', 14, true);
        analysis.missing_keywords.forEach(keyword => {
          addText(`• ${keyword}`);
        });
        yPosition += 10;
      }

      // Matched Keywords
      if (exportOptions.includeMatchedKeywords && analysis.keyword_match.matched_list.length > 0) {
        addText('MATCHED KEYWORDS', 14, true);
        analysis.keyword_match.matched_list.slice(0, 20).forEach(match => {
          addText(`• ${match.keyword} (${match.match_type}, weight: ${(match.importance_weight * 100).toFixed(0)}%)`);
        });
        yPosition += 10;
      }

      // Strengths
      if (analysis.strength_areas.length > 0) {
        addText('STRENGTHS', 14, true);
        analysis.strength_areas.forEach(strength => {
          addText(`• ${strength}`);
        });
        yPosition += 10;
      }

      // Areas for Improvement
      if (analysis.improvement_areas.length > 0) {
        addText('AREAS FOR IMPROVEMENT', 14, true);
        analysis.improvement_areas.forEach(area => {
          addText(`• ${area}`);
        });
        yPosition += 10;
      }

      // Recommendations
      if (exportOptions.includeRecommendations && analysis.recommendations.length > 0) {
        addText('RECOMMENDATIONS', 16, true);
        
        // Group recommendations by type
        const criticalRecs = analysis.recommendations.filter(r => r.type === 'critical');
        const importantRecs = analysis.recommendations.filter(r => r.type === 'important');
        const suggestionRecs = analysis.recommendations.filter(r => r.type === 'suggestion');

        if (criticalRecs.length > 0) {
          addText('Critical Issues', 12, true);
          criticalRecs.forEach((rec, index) => {
            addText(`${index + 1}. ${rec.title}`);
            addText(`   ${rec.description}`);
            addText(`   Impact Score: ${rec.impact_score}/100`);
          });
          yPosition += 5;
        }

        if (importantRecs.length > 0) {
          addText('Important Improvements', 12, true);
          importantRecs.forEach((rec, index) => {
            addText(`${index + 1}. ${rec.title}`);
            addText(`   ${rec.description}`);
            addText(`   Impact Score: ${rec.impact_score}/100`);
          });
          yPosition += 5;
        }

        if (suggestionRecs.length > 0) {
          addText('Suggestions', 12, true);
          suggestionRecs.forEach((rec, index) => {
            addText(`${index + 1}. ${rec.title}`);
            addText(`   ${rec.description}`);
            addText(`   Impact Score: ${rec.impact_score}/100`);
          });
        }
      }

      // Resume Text (if included)
      if (exportOptions.includeResumeText && resumeData) {
        checkPageBreak(50);
        addText('RESUME CONTENT', 16, true);
        addText(resumeData.content.substring(0, 2000) + (resumeData.content.length > 2000 ? '...' : ''), 8);
      }

      // Job Description (if included)
      if (exportOptions.includeJobDescription && jobData) {
        checkPageBreak(50);
        addText('JOB DESCRIPTION', 16, true);
        addText(jobData.content.substring(0, 2000) + (jobData.content.length > 2000 ? '...' : ''), 8);
      }

      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.width - 40, pdf.internal.pageSize.height - 10);
        pdf.text('Generated by All-in-One Career Platform', margin, pdf.internal.pageSize.height - 10);
      }

      // Save the PDF
      const filename = `ats-analysis-${Date.now()}.pdf`;
      pdf.save(filename);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        analysis,
        resumeData: exportOptions.includeResumeText ? resumeData : {
          ...resumeData,
          content: '[Content excluded from export]'
        },
        jobData: exportOptions.includeJobDescription ? jobData : {
          ...jobData,
          content: '[Content excluded from export]'
        },
        exportOptions,
        generatedAt: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ats-analysis-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting JSON:', error);
      alert('Failed to export JSON data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      const csvData = [
        ['Metric', 'Value', 'Description'],
        ['Overall Score', analysis.overall_score, 'Overall ATS compatibility score'],
        ['Keyword Match Rate', `${analysis.keyword_match.match_percentage}%`, 'Percentage of job keywords found in resume'],
        ['ATS Compatibility', `${analysis.ats_compatibility}%`, 'Resume format compatibility with ATS systems'],
        ['Estimated Pass Rate', `${analysis.estimated_pass_rate}%`, 'Likelihood of passing initial ATS screening'],
        ['', '', ''],
        ['Section Scores', '', ''],
        ['Personal Information', analysis.section_analysis.personal_info_score, 'Contact information completeness'],
        ['Experience', analysis.section_analysis.experience_score, 'Professional experience quality'],
        ['Education', analysis.section_analysis.education_score, 'Educational background presentation'],
        ['Skills', analysis.section_analysis.skills_score, 'Technical and professional skills'],
        ['Formatting', analysis.section_analysis.formatting_score, 'Resume structure and formatting'],
        ['Completeness', analysis.section_analysis.completeness_score, 'Overall resume completeness'],
        ['', '', ''],
        ['Keyword Analysis', '', ''],
        ['Total Keywords', analysis.keyword_match.total_keywords, 'Total keywords in job description'],
        ['Matched Keywords', analysis.keyword_match.matched_keywords, 'Keywords found in resume'],
        ['Semantic Matches', analysis.keyword_match.semantic_matches, 'Contextually similar terms found'],
        ['Keyword Density', `${analysis.keyword_match.keyword_density.toFixed(2)}%`, 'Keyword concentration in resume'],
        ['', '', ''],
        ['Critical Missing Keywords', '', ''],
        ...analysis.missing_keywords.map(keyword => ['Missing', keyword, 'High-priority keyword not found in resume'])
      ];

      if (exportOptions.includeRecommendations) {
        csvData.push(['', '', ''], ['Recommendations', '', '']);
        analysis.recommendations.forEach((rec, index) => {
          csvData.push([`${rec.type} ${index + 1}`, rec.title, rec.description]);
        });
      }

      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ats-analysis-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-report-generator bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Export Analysis Report
      </h3>

      {/* Export Options */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Export Options
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(exportOptions).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setExportOptions(prev => ({
                  ...prev,
                  [key]: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={generatePDFReport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileText className="w-4 h-4" />
          {isExporting ? 'Generating...' : 'Export PDF'}
        </button>

        <button
          onClick={exportToJSON}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <File className="w-4 h-4" />
          Export JSON
        </button>

        <button
          onClick={exportToCSV}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Export Info */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>• PDF: Comprehensive formatted report</p>
        <p>• JSON: Complete data for technical analysis</p>
        <p>• CSV: Tabular data for spreadsheet analysis</p>
      </div>
    </div>
  );
};

export default ExportReportGenerator;
