/**
 * PDF Download Component - Generate comprehensive ATS report as PDF
 */

import React, { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';

interface PDFDownloadProps {
  data: {
    overallScoreV2?: any;
    subscoresV2?: any;
    atsChecks?: any;
    skills?: any;
    recruiterPsychology?: any;
    industry?: any;
    market?: any;
    companyOptimization?: any;
    predictive?: any;
    scanId?: string;
    createdAt?: string;
  };
}

export const PDFDownload: React.FC<PDFDownloadProps> = ({ data }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Dynamic import to reduce bundle size
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      
      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        const lines = doc.splitTextToSize(text, contentWidth);
        
        // Check if we need a new page
        if (yPosition + (lines.length * fontSize * 0.5) > doc.internal.pageSize.height - 20) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * fontSize * 0.5 + 5;
      };
      
      // Helper function to add section divider
      const addDivider = () => {
        yPosition += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      };
      
      // Title
      addText('ATS SCAN COMPREHENSIVE REPORT', 20, true);
      addText(`Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 10);
      
      if (data.scanId) {
        addText(`Scan ID: ${data.scanId}`, 10);
      }
      
      addDivider();
      
      // Overall Score V2
      if (data.overallScoreV2) {
        addText('OVERALL ATS SCORE (V2)', 16, true);
        addText(`Score: ${data.overallScoreV2.overall}/100`, 12, true);
        addText(`Confidence: ${data.overallScoreV2.confidence}% (±${data.overallScoreV2.band} points)`, 10);
        
        if (data.overallScoreV2.breakdown) {
          addText('\nScore Breakdown:', 12, true);
          addText(`• ATS Foundation (40%): ${data.overallScoreV2.breakdown.A?.toFixed(1) || 'N/A'} points`, 10);
          addText(`• Skills Relevancy (35%): ${data.overallScoreV2.breakdown.B?.toFixed(1) || 'N/A'} points`, 10);
          addText(`• Recruiter Appeal (10%): ${data.overallScoreV2.breakdown.C?.toFixed(1) || 'N/A'} points`, 10);
          addText(`• Market Context (10%): ${data.overallScoreV2.breakdown.D?.toFixed(1) || 'N/A'} points`, 10);
          addText(`• Future Ready (5%): ${data.overallScoreV2.breakdown.E?.toFixed(1) || 'N/A'} points`, 10);
          
          if (data.overallScoreV2.breakdown.redPenalty > 0) {
            addText(`• Red Flag Penalty: -${data.overallScoreV2.breakdown.redPenalty?.toFixed(1)} points`, 10);
          }
        }
        
        addDivider();
      }
      
      // ATS Foundation Checks
      if (data.atsChecks) {
        addText('ATS FOUNDATION ANALYSIS', 16, true);
        
        // File Analysis
        addText('File Analysis:', 12, true);
        addText(`• File Type: ${data.atsChecks.fileTypeOk ? '✓ Compatible' : '✗ May have issues'}`, 10);
        addText(`• File Name: ${data.atsChecks.fileNameOk ? '✓ Optimized' : '✗ Needs improvement'}`, 10);
        addText(`• Word Count: ${data.atsChecks.wordCount || 'Unknown'} words (${data.atsChecks.wordCountStatus || 'Unknown'})`, 10);
        
        // Contact Information
        if (data.atsChecks.contact) {
          addText('\nContact Information:', 12, true);
          addText(`• Email: ${data.atsChecks.contact.email ? '✓ Present' : '✗ Missing'}`, 10);
          addText(`• Phone: ${data.atsChecks.contact.phone ? '✓ Present' : '✗ Missing'}`, 10);
          addText(`• Location: ${data.atsChecks.contact.location ? '✓ Present' : '✗ Missing'}`, 10);
          
          if (data.atsChecks.contact.links?.length > 0) {
            addText(`• Professional Links: ${data.atsChecks.contact.links.join(', ')}`, 10);
          }
        }
        
        // Section Analysis
        if (data.atsChecks.sections) {
          addText('\nSection Analysis:', 12, true);
          addText(`• Experience Section: ${data.atsChecks.sections.experience ? '✓ Present' : '✗ Missing'}`, 10);
          addText(`• Skills Section: ${data.atsChecks.sections.skills ? '✓ Present' : '✗ Missing'}`, 10);
          addText(`• Education Section: ${data.atsChecks.sections.education ? '✓ Present' : '✗ Missing'}`, 10);
          addText(`• Summary Section: ${data.atsChecks.sections.summary ? '✓ Present' : '✗ Missing'}`, 10);
        }
        
        // Job Title Match
        if (data.atsChecks.jobTitleMatch) {
          addText('\nJob Title Alignment:', 12, true);
          addText(`• Exact Match: ${data.atsChecks.jobTitleMatch.exact ? '✓ Yes' : '✗ No'}`, 10);
          if (data.atsChecks.jobTitleMatch.normalizedSimilarity) {
            addText(`• Similarity Score: ${Math.round(data.atsChecks.jobTitleMatch.normalizedSimilarity * 100)}%`, 10);
          }
        }
        
        addDivider();
      }
      
      // Skills Analysis
      if (data.skills) {
        addText('SKILLS ANALYSIS', 16, true);
        
        if (data.skills.hard) {
          addText('Hard Skills:', 12, true);
          if (data.skills.hard.found?.length > 0) {
            addText(`Found (${data.skills.hard.found.length}): ${data.skills.hard.found.join(', ')}`, 10);
          }
          if (data.skills.hard.missing?.length > 0) {
            addText(`Missing (${data.skills.hard.missing.length}): ${data.skills.hard.missing.join(', ')}`, 10);
          }
        }
        
        if (data.skills.soft) {
          addText('\nSoft Skills:', 12, true);
          if (data.skills.soft.found?.length > 0) {
            addText(`Found (${data.skills.soft.found.length}): ${data.skills.soft.found.join(', ')}`, 10);
          }
        }
        
        if (data.skills.transferable?.length > 0) {
          addText('\nTransferable Skills:', 12, true);
          data.skills.transferable.forEach((skill: any) => {
            addText(`• ${skill.from} → ${skill.towards} (${Math.round(skill.confidence * 100)}% confidence)`, 10);
          });
        }
        
        addDivider();
      }
      
      // Recruiter Psychology
      if (data.recruiterPsychology) {
        addText('RECRUITER PSYCHOLOGY INSIGHTS', 16, true);
        
        if (typeof data.recruiterPsychology.sixSecondImpression === 'number') {
          addText(`6-Second Impression Score: ${data.recruiterPsychology.sixSecondImpression}/100`, 12, true);
        }
        
        if (typeof data.recruiterPsychology.narrativeCoherence === 'number') {
          addText(`Narrative Coherence: ${data.recruiterPsychology.narrativeCoherence}/100`, 12, true);
        }
        
        if (data.recruiterPsychology.authorityLanguage) {
          addText('\nLanguage Analysis:', 12, true);
          if (data.recruiterPsychology.authorityLanguage.strong?.length > 0) {
            addText(`Strong Action Words: ${data.recruiterPsychology.authorityLanguage.strong.join(', ')}`, 10);
          }
          if (data.recruiterPsychology.authorityLanguage.weak?.length > 0) {
            addText(`Weak Language: ${data.recruiterPsychology.authorityLanguage.weak.join(', ')}`, 10);
          }
        }
        
        if (data.recruiterPsychology.redFlags?.length > 0) {
          addText('\nRed Flags Detected:', 12, true);
          data.recruiterPsychology.redFlags.forEach((flag: string) => {
            addText(`• ${flag.replace(/_/g, ' ').toUpperCase()}`, 10);
          });
        }
        
        addDivider();
      }
      
      // Industry & Market Intelligence
      if (data.industry) {
        addText('INDUSTRY & MARKET INTELLIGENCE', 16, true);
        
        if (data.industry.detected) {
          addText(`Primary Industry: ${data.industry.detected.primary}`, 12, true);
          if (data.industry.detected.secondary?.length > 0) {
            addText(`Secondary: ${data.industry.detected.secondary.join(', ')}`, 10);
          }
          if (data.industry.detected.confidence) {
            addText(`Detection Confidence: ${Math.round(data.industry.detected.confidence * 100)}%`, 10);
          }
        }
        
        if (data.industry.trendingSkills?.length > 0) {
          addText(`\nTrending Skills: ${data.industry.trendingSkills.join(', ')}`, 10);
        }
        
        if (data.industry.decliningSkills?.length > 0) {
          addText(`Declining Skills: ${data.industry.decliningSkills.join(', ')}`, 10);
        }
        
        if (typeof data.industry.marketPercentile === 'number') {
          addText(`\nMarket Percentile: ${data.industry.marketPercentile}th percentile`, 12, true);
        }
        
        if (data.industry.careerPaths?.length > 0) {
          addText('\nCareer Progression Paths:', 12, true);
          data.industry.careerPaths.forEach((path: string[], index: number) => {
            addText(`Path ${index + 1}: ${path.join(' → ')}`, 10);
          });
        }
        
        addDivider();
      }
      
      // Predictive Analysis
      if (data.predictive) {
        addText('PREDICTIVE ANALYSIS', 16, true);
        
        if (data.predictive.hireProbability) {
          addText('Hire Probability Analysis:', 12, true);
          addText(`Base Probability: ${data.predictive.hireProbability.point || 'N/A'}%`, 10);
          if (data.predictive.hireProbability.range) {
            addText(`Range: ${data.predictive.hireProbability.range.min}-${data.predictive.hireProbability.range.max}%`, 10);
          }
          if (data.predictive.hireProbability.xFactor) {
            addText(`X-Factor Bonus: +${data.predictive.hireProbability.xFactor}%`, 10);
          }
        }
        
        if (typeof data.predictive.automationRisk === 'number') {
          addText(`\nAutomation Risk: ${Math.round(data.predictive.automationRisk * 100)}%`, 10);
          addText(`Future-Proof Score: ${Math.round((1 - data.predictive.automationRisk) * 100)}%`, 10);
        }
        
        if (data.predictive.salary) {
          addText('\nSalary Intelligence:', 12, true);
          if (data.predictive.salary.market) {
            addText(`Market Rate: $${data.predictive.salary.market.toLocaleString()}`, 10);
          }
          if (data.predictive.salary.range) {
            addText(`Range: $${data.predictive.salary.range.min.toLocaleString()} - $${data.predictive.salary.range.max.toLocaleString()}`, 10);
          }
        }
        
        addDivider();
      }
      
      // Company Optimization (if available)
      if (data.companyOptimization?.enabled) {
        addText('COMPANY-SPECIFIC OPTIMIZATION', 16, true);
        
        if (typeof data.companyOptimization.cultureAlignment === 'number') {
          addText(`Culture Alignment: ${data.companyOptimization.cultureAlignment}%`, 10);
        }
        if (typeof data.companyOptimization.techStackMatch === 'number') {
          addText(`Tech Stack Match: ${data.companyOptimization.techStackMatch}%`, 10);
        }
        if (typeof data.companyOptimization.backgroundFit === 'number') {
          addText(`Background Fit: ${data.companyOptimization.backgroundFit}%`, 10);
        }
        
        if (data.companyOptimization.recommendations?.length > 0) {
          addText('\nOptimization Recommendations:', 12, true);
          data.companyOptimization.recommendations.forEach((rec: string, index: number) => {
            addText(`${index + 1}. ${rec}`, 10);
          });
        }
        
        addDivider();
      }
      
      // Footer
      addText('\nGenerated by All-in-One Career ATS Scanner', 8);
      addText('Advanced AI-powered resume analysis with market intelligence', 8);
      
      // Save the PDF
      const fileName = `ATS_Report_${data.scanId || 'scan'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
    >
      {isGenerating ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Download className="w-5 h-5" />
      )}
      <span>{isGenerating ? 'Generating PDF...' : 'Download PDF Report'}</span>
    </button>
  );
};
