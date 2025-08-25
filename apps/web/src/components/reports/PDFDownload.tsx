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
      const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        doc.setTextColor(color[0], color[1], color[2]);
        
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
      
      // Helper function to add colored box
      const addColoredBox = (title: string, score: string, color: [number, number, number]) => {
        const boxHeight = 15;
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(margin, yPosition, contentWidth, boxHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(title, margin + 5, yPosition + 10);
        doc.text(score, pageWidth - margin - 30, yPosition + 10);
        yPosition += boxHeight + 10;
        doc.setTextColor(0, 0, 0);
      };
      
      // Helper function to add metric card
      const addMetricCard = (title: string, value: string, description: string) => {
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPosition, contentWidth/2 - 5, 25);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(title, margin + 5, yPosition + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.text(value, margin + 5, yPosition + 15);
        doc.setFontSize(8);
        doc.text(description, margin + 5, yPosition + 22);
        yPosition += 30;
      };
      
      // Header - Matching UI
      addText('🚀 ENHANCED ATS ANALYSIS RESULTS', 18, true, [37, 99, 235]);
      addText('Comprehensive foundational checks, recruiter psychology, and market intelligence', 10, false, [75, 85, 99]);
      addText(`Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 9, false, [107, 114, 128]);
      
      if (data.scanId) {
        addText(`Scan ID: ${data.scanId}`, 9, false, [107, 114, 128]);
      }
      
      yPosition += 10;
      addDivider();
      
      // Overall Score V2 - Matching OverallScoreV2 component
      if (data.overallScoreV2) {
        const score = data.overallScoreV2.overall;
        const getScoreColor = (score: number): [number, number, number] => {
          if (score >= 90) return [34, 197, 94]; // green-500
          if (score >= 80) return [59, 130, 246]; // blue-500
          if (score >= 70) return [234, 179, 8]; // yellow-500
          if (score >= 60) return [249, 115, 22]; // orange-500
          return [239, 68, 68]; // red-500
        };
        
        const getScoreLabel = (score: number) => {
          if (score >= 90) return 'Exceptional';
          if (score >= 80) return 'Strong';
          if (score >= 70) return 'Good';
          if (score >= 60) return 'Fair';
          return 'Needs Work';
        };
        
        // Main score display
        addColoredBox('OVERALL ATS SCORE (V2)', '', [71, 85, 105]);
        yPosition -= 5;
        
        // Large score circle (simulated as box)
        const scoreColor = getScoreColor(score);
        addColoredBox(`${score}/100 - ${getScoreLabel(score)}`, `Confidence: ${data.overallScoreV2.confidence}% (±${data.overallScoreV2.band})`, scoreColor);
        
        // Score breakdown cards
        if (data.overallScoreV2.breakdown) {
          addText('SCORE BREAKDOWN', 14, true);
          yPosition += 5;
          
          const components = [
            { title: 'ATS Foundation', score: data.overallScoreV2.breakdown.A?.toFixed(1) || '0', weight: '40%', desc: 'Format, sections, contact, job title match' },
            { title: 'Skills Relevancy', score: data.overallScoreV2.breakdown.B?.toFixed(1) || '0', weight: '35%', desc: 'Hard/soft skills, experience fit, keyword density' },
            { title: 'Recruiter Appeal', score: data.overallScoreV2.breakdown.C?.toFixed(1) || '0', weight: '10%', desc: '6-second impression, authority language' },
            { title: 'Market Context', score: data.overallScoreV2.breakdown.D?.toFixed(1) || '0', weight: '10%', desc: 'Industry position, company alignment' },
            { title: 'Future Ready', score: data.overallScoreV2.breakdown.E?.toFixed(1) || '0', weight: '5%', desc: 'X-factor, automation resistance' }
          ];
          
          components.forEach(comp => {
            addMetricCard(comp.title, `${comp.score} (${comp.weight})`, comp.desc);
          });
          
          if (data.overallScoreV2.breakdown.redPenalty > 0) {
            addText(`🚨 Red Flag Penalty: -${data.overallScoreV2.breakdown.redPenalty?.toFixed(1)} points`, 11, true, [239, 68, 68]);
          }
        }
        
        // Quick wins section
        addText('QUICK WINS TO BOOST YOUR SCORE', 12, true, [37, 99, 235]);
        const quickWins = [];
        if (data.overallScoreV2.breakdown?.A < 30) quickWins.push('• Improve ATS foundation: Add missing contact info and optimize formatting');
        if (data.overallScoreV2.breakdown?.B < 25) quickWins.push('• Enhance skills alignment: Add trending skills and reduce gaps');
        if (data.overallScoreV2.breakdown?.C < 7) quickWins.push('• Boost recruiter appeal: Use stronger action words and improve narrative flow');
        
        if (quickWins.length === 0) {
          quickWins.push('• Excellent work! Your resume is well-optimized across all areas.');
        }
        
        quickWins.forEach(win => addText(win, 10));
        
        addDivider();
      }
      
      // TAB 1: OVERVIEW - ATS Foundation Checks (matching AtsChecksCard component)
      if (data.atsChecks) {
        addColoredBox('📋 ATS FOUNDATION CHECKS', '', [34, 197, 94]);
        
        // File Quality Analysis
        addText('FILE QUALITY ANALYSIS', 12, true, [34, 197, 94]);
        const fileChecks = [
          { label: 'File Type', status: data.atsChecks.fileTypeOk, details: 'ATS-compatible format' },
          { label: 'File Name', status: data.atsChecks.fileNameOk, details: 'Professional naming' },
          { label: 'Word Count', status: data.atsChecks.wordCountStatus === 'optimal', details: `${data.atsChecks.wordCount || 'Unknown'} words (${data.atsChecks.wordCountStatus || 'Unknown'})` }
        ];
        
        fileChecks.forEach(check => {
          addText(`${check.status ? '✅' : '❌'} ${check.label}: ${check.details}`, 10);
        });
        
        // Contact Information
        if (data.atsChecks.contact) {
          yPosition += 5;
          addText('CONTACT INFORMATION', 12, true, [34, 197, 94]);
          const contactChecks = [
            { label: 'Email Address', status: data.atsChecks.contact.email },
            { label: 'Phone Number', status: data.atsChecks.contact.phone },
            { label: 'Location', status: data.atsChecks.contact.location }
          ];
          
          contactChecks.forEach(check => {
            addText(`${check.status ? '✅' : '❌'} ${check.label}: ${check.status ? 'Present' : 'Missing'}`, 10);
          });
          
          if (data.atsChecks.contact.links?.length > 0) {
            addText(`🔗 Professional Links: ${data.atsChecks.contact.links.join(', ')}`, 10);
          }
        }
        
        // Essential Sections
        if (data.atsChecks.sections) {
          yPosition += 5;
          addText('ESSENTIAL SECTIONS', 12, true, [34, 197, 94]);
          const sectionChecks = [
            { label: 'Professional Experience', status: data.atsChecks.sections.experience },
            { label: 'Skills & Competencies', status: data.atsChecks.sections.skills },
            { label: 'Education & Certifications', status: data.atsChecks.sections.education },
            { label: 'Professional Summary', status: data.atsChecks.sections.summary }
          ];
          
          sectionChecks.forEach(check => {
            addText(`${check.status ? '✅' : '❌'} ${check.label}: ${check.status ? 'Present' : 'Missing'}`, 10);
          });
        }
        
        // Job Title Alignment
        if (data.atsChecks.jobTitleMatch) {
          yPosition += 5;
          addText('JOB TITLE ALIGNMENT', 12, true, [34, 197, 94]);
          addText(`${data.atsChecks.jobTitleMatch.exact ? '✅' : '⚠️'} Exact Match: ${data.atsChecks.jobTitleMatch.exact ? 'Yes' : 'No'}`, 10);
          if (data.atsChecks.jobTitleMatch.normalizedSimilarity) {
            const similarity = Math.round(data.atsChecks.jobTitleMatch.normalizedSimilarity * 100);
            addText(`📊 Similarity Score: ${similarity}%`, 10);
          }
        }
        
        addDivider();
      }
      
      // TAB 1 CONTINUED: SKILLS MATRIX (matching SkillsMatrix component)
      if (data.skills) {
        addColoredBox('🎯 SKILLS INTELLIGENCE MATRIX', '', [147, 51, 234]);
        
        // Hard Skills Analysis
        if (data.skills.hard) {
          addText('HARD SKILLS ANALYSIS', 12, true, [147, 51, 234]);
          if (data.skills.hard.found?.length > 0) {
            addText(`✅ Skills Found (${data.skills.hard.found.length}):`, 11, true, [34, 197, 94]);
            const foundSkills = data.skills.hard.found.join(' • ');
            addText(`${foundSkills}`, 10);
          }
          
          if (data.skills.hard.missing?.length > 0) {
            yPosition += 3;
            addText(`❌ Skills Missing (${data.skills.hard.missing.length}):`, 11, true, [239, 68, 68]);
            const missingSkills = data.skills.hard.missing.join(' • ');
            addText(`${missingSkills}`, 10);
          }
          
          // Impact weights if available
          if (data.skills.hard.impactWeights) {
            yPosition += 3;
            addText('📊 IMPACT WEIGHTS:', 11, true, [147, 51, 234]);
            Object.entries(data.skills.hard.impactWeights).forEach(([skill, weight]: [string, any]) => {
              const weightStr = weight > 0 ? `+${weight}` : `${weight}`;
              const color: [number, number, number] = weight > 0 ? [34, 197, 94] : [239, 68, 68];
              addText(`• ${skill}: ${weightStr}`, 10, false, color);
            });
          }
        }
        
        // Soft Skills Analysis
        if (data.skills.soft) {
          yPosition += 5;
          addText('SOFT SKILLS ANALYSIS', 12, true, [147, 51, 234]);
          if (data.skills.soft.found?.length > 0) {
            addText(`✅ Soft Skills Found (${data.skills.soft.found.length}):`, 11, true, [34, 197, 94]);
            const softSkills = data.skills.soft.found.join(' • ');
            addText(`${softSkills}`, 10);
          }
          
          if (data.skills.soft.missing?.length > 0) {
            yPosition += 3;
            addText(`📋 Recommended Soft Skills (${data.skills.soft.missing.length}):`, 11, true, [249, 115, 22]);
            const missingSoft = data.skills.soft.missing.join(' • ');
            addText(`${missingSoft}`, 10);
          }
        }
        
        // Transferable Skills
        if (data.skills.transferable?.length > 0) {
          yPosition += 5;
          addText('TRANSFERABLE SKILLS ANALYSIS', 12, true, [147, 51, 234]);
          data.skills.transferable.forEach((skill: any) => {
            const confidence = Math.round(skill.confidence * 100);
            addText(`🔄 ${skill.from} → ${skill.towards} (${confidence}% confidence)`, 10);
          });
        }
        
        addDivider();
      }
      
      // TAB 2: PSYCHOLOGY - Recruiter Psychology (matching RecruiterPsychologyCard component)
      if (data.recruiterPsychology) {
        addColoredBox('🧠 RECRUITER PSYCHOLOGY INSIGHTS', '', [249, 115, 22]);
        
        // 6-Second Impression
        if (typeof data.recruiterPsychology.sixSecondImpression === 'number') {
          addText('6-SECOND IMPRESSION ANALYSIS', 12, true, [249, 115, 22]);
          const impression = data.recruiterPsychology.sixSecondImpression;
          const impressionColor: [number, number, number] = impression >= 80 ? [34, 197, 94] : impression >= 60 ? [234, 179, 8] : [239, 68, 68];
          addText(`Score: ${impression}/100`, 14, true, impressionColor);
          
          if (impression >= 80) {
            addText('✅ Excellent first impression - clear, professional, scannable layout', 10);
          } else if (impression >= 60) {
            addText('⚠️ Good impression with room for improvement in visual hierarchy', 10);
          } else {
            addText('❌ Needs significant improvement in layout and formatting', 10);
          }
        }
        
        // Narrative Coherence
        if (typeof data.recruiterPsychology.narrativeCoherence === 'number') {
          yPosition += 5;
          addText('NARRATIVE COHERENCE', 12, true, [249, 115, 22]);
          const coherence = data.recruiterPsychology.narrativeCoherence;
          const coherenceColor: [number, number, number] = coherence >= 80 ? [34, 197, 94] : coherence >= 60 ? [234, 179, 8] : [239, 68, 68];
          addText(`Score: ${coherence}/100`, 14, true, coherenceColor);
          
          if (coherence >= 80) {
            addText('✅ Strong career narrative with logical progression', 10);
          } else if (coherence >= 60) {
            addText('⚠️ Generally coherent story with some gaps to address', 10);
          } else {
            addText('❌ Narrative needs strengthening to show clear career progression', 10);
          }
        }
        
        // Authority Language Analysis
        if (data.recruiterPsychology.authorityLanguage) {
          yPosition += 5;
          addText('AUTHORITY LANGUAGE ANALYSIS', 12, true, [249, 115, 22]);
          
          if (data.recruiterPsychology.authorityLanguage.strong?.length > 0) {
            addText(`✅ Strong Action Words (${data.recruiterPsychology.authorityLanguage.strong.length}):`, 11, true, [34, 197, 94]);
            const strongWords = data.recruiterPsychology.authorityLanguage.strong.join(' • ');
            addText(strongWords, 10);
          }
          
          if (data.recruiterPsychology.authorityLanguage.weak?.length > 0) {
            yPosition += 3;
            addText(`⚠️ Weak Language to Replace (${data.recruiterPsychology.authorityLanguage.weak.length}):`, 11, true, [239, 68, 68]);
            const weakWords = data.recruiterPsychology.authorityLanguage.weak.join(' • ');
            addText(weakWords, 10);
          }
        }
        
        // Red Flags Detection
        if (data.recruiterPsychology.redFlags?.length > 0) {
          yPosition += 5;
          addText('🚨 RED FLAGS DETECTED', 12, true, [239, 68, 68]);
          data.recruiterPsychology.redFlags.forEach((flag: string) => {
            const flagName = flag.replace(/_/g, ' ').toUpperCase();
            addText(`❌ ${flagName}`, 10, false, [239, 68, 68]);
          });
          
          addText('\n💡 Action Required: Address these issues to improve recruiter perception', 10, true, [249, 115, 22]);
        } else {
          yPosition += 5;
          addText('✅ NO MAJOR RED FLAGS DETECTED', 12, true, [34, 197, 94]);
          addText('Great work! Your resume shows strong recruiter appeal', 10);
        }
        
        addDivider();
      }
      
      // TAB 3: MARKET - Industry & Market Intelligence (matching MarketIndustryCard component)
      if (data.industry) {
        addColoredBox('📊 MARKET & INDUSTRY INTELLIGENCE', '', [59, 130, 246]);
        
        // Industry Detection
        if (data.industry.detected) {
          addText('INDUSTRY DETECTION', 12, true, [59, 130, 246]);
          addText(`🎯 Primary Industry: ${data.industry.detected.primary}`, 11, true);
          
          if (data.industry.detected.secondary?.length > 0) {
            addText(`🏷️ Secondary Industries: ${data.industry.detected.secondary.join(', ')}`, 10);
          }
          
          if (data.industry.detected.confidence) {
            const confidence = Math.round(data.industry.detected.confidence * 100);
            const confidenceColor: [number, number, number] = confidence >= 80 ? [34, 197, 94] : confidence >= 60 ? [234, 179, 8] : [239, 68, 68];
            addText(`📈 Detection Confidence: ${confidence}%`, 10, false, confidenceColor);
          }
        }
        
        // Market Position
        if (typeof data.industry.marketPercentile === 'number') {
          yPosition += 5;
          addText('MARKET POSITIONING', 12, true, [59, 130, 246]);
          const percentile = data.industry.marketPercentile;
          const positionColor: [number, number, number] = percentile >= 80 ? [34, 197, 94] : percentile >= 60 ? [234, 179, 8] : [239, 68, 68];
          addText(`🎯 Market Percentile: ${percentile}th percentile`, 12, true, positionColor);
          
          if (percentile >= 80) {
            addText('🏆 Excellent market position - top tier candidate', 10);
          } else if (percentile >= 60) {
            addText('💼 Strong market position with growth potential', 10);
          } else {
            addText('📈 Room for improvement to reach market leadership', 10);
          }
        }
        
        // Skills Trends
        yPosition += 5;
        addText('SKILLS MARKET ANALYSIS', 12, true, [59, 130, 246]);
        
        if (data.industry.trendingSkills?.length > 0) {
          addText('🔥 Trending Skills (High Demand):', 11, true, [34, 197, 94]);
          const trendingSkills = data.industry.trendingSkills.join(' • ');
          addText(trendingSkills, 10);
        }
        
        if (data.industry.decliningSkills?.length > 0) {
          yPosition += 3;
          addText('📉 Declining Skills (Lower Demand):', 11, true, [239, 68, 68]);
          const decliningSkills = data.industry.decliningSkills.join(' • ');
          addText(decliningSkills, 10);
        }
        
        // Career Paths
        if (data.industry.careerPaths?.length > 0) {
          yPosition += 5;
          addText('CAREER PROGRESSION PATHS', 12, true, [59, 130, 246]);
          data.industry.careerPaths.forEach((path: string[], index: number) => {
            addText(`🎯 Path ${index + 1}: ${path.join(' → ')}`, 10);
          });
        }
        
        // Skill Demand Heatmap
        if (data.market?.skillDemandHeatmap?.length > 0) {
          yPosition += 5;
          addText('SKILL DEMAND HEATMAP', 12, true, [59, 130, 246]);
          data.market.skillDemandHeatmap.forEach((item: any) => {
            const statusIcon = item.status === 'hot' ? '🔥' : item.status === 'stable' ? '📊' : '📉';
            const statusColor: [number, number, number] = 
              item.status === 'hot' ? [34, 197, 94] : 
              item.status === 'stable' ? [234, 179, 8] : [239, 68, 68];
            addText(`${statusIcon} ${item.skill}: ${item.status.toUpperCase()}`, 10, false, statusColor);
          });
        }
        
        addDivider();
      }
      
      // TAB 3 CONTINUED: PREDICTIVE INTELLIGENCE
      if (data.predictive) {
        addColoredBox('🔮 PREDICTIVE INTELLIGENCE', '', [168, 85, 247]);
        
        // Hire Probability Analysis
        if (data.predictive.hireProbability) {
          addText('HIRE PROBABILITY ANALYSIS', 12, true, [168, 85, 247]);
          const baseProb = data.predictive.hireProbability.point || 0;
          const probColor: [number, number, number] = baseProb >= 80 ? [34, 197, 94] : baseProb >= 60 ? [234, 179, 8] : [239, 68, 68];
          addText(`🎯 Base Probability: ${baseProb}%`, 12, true, probColor);
          
          if (data.predictive.hireProbability.range) {
            addText(`📊 Range: ${data.predictive.hireProbability.range.min}-${data.predictive.hireProbability.range.max}%`, 10);
          }
          
          if (data.predictive.hireProbability.xFactor) {
            addText(`✨ X-Factor Bonus: +${data.predictive.hireProbability.xFactor}%`, 10, false, [147, 51, 234]);
          }
        }
        
        // Future-Proofing Analysis
        if (typeof data.predictive.automationRisk === 'number') {
          yPosition += 5;
          addText('FUTURE-PROOFING ANALYSIS', 12, true, [168, 85, 247]);
          const automationRisk = Math.round(data.predictive.automationRisk * 100);
          const futureProof = Math.round((1 - data.predictive.automationRisk) * 100);
          
          const riskColor: [number, number, number] = automationRisk <= 30 ? [34, 197, 94] : automationRisk <= 60 ? [234, 179, 8] : [239, 68, 68];
          addText(`🤖 Automation Risk: ${automationRisk}%`, 11, false, riskColor);
          addText(`🛡️ Future-Proof Score: ${futureProof}%`, 11, false, [34, 197, 94]);
          
          if (automationRisk <= 30) {
            addText('✅ Low automation risk - strong job security', 10);
          } else if (automationRisk <= 60) {
            addText('⚠️ Moderate risk - consider upskilling in AI-resistant areas', 10);
          } else {
            addText('❌ High risk - urgent need for skill transformation', 10);
          }
        }
        
        // Salary Intelligence
        if (data.predictive.salary) {
          yPosition += 5;
          addText('SALARY INTELLIGENCE', 12, true, [168, 85, 247]);
          
          if (data.predictive.salary.market) {
            addText(`💰 Market Rate: $${data.predictive.salary.market.toLocaleString()}`, 11, true, [34, 197, 94]);
          }
          
          if (data.predictive.salary.range) {
            addText(`📈 Salary Range: $${data.predictive.salary.range.min.toLocaleString()} - $${data.predictive.salary.range.max.toLocaleString()}`, 10);
          }
        }
        
        addDivider();
      }
      
      // Company-Specific Optimization (if available)
      if (data.companyOptimization?.enabled) {
        addColoredBox('🏢 COMPANY-SPECIFIC OPTIMIZATION', '', [16, 185, 129]);
        
        // Alignment Scores
        addText('COMPANY ALIGNMENT ANALYSIS', 12, true, [16, 185, 129]);
        
        if (typeof data.companyOptimization.cultureAlignment === 'number') {
          const cultureScore = data.companyOptimization.cultureAlignment;
          const cultureColor: [number, number, number] = cultureScore >= 80 ? [34, 197, 94] : cultureScore >= 60 ? [234, 179, 8] : [239, 68, 68];
          addText(`🎭 Culture Alignment: ${cultureScore}%`, 11, false, cultureColor);
        }
        
        if (typeof data.companyOptimization.techStackMatch === 'number') {
          const techScore = data.companyOptimization.techStackMatch;
          const techColor: [number, number, number] = techScore >= 80 ? [34, 197, 94] : techScore >= 60 ? [234, 179, 8] : [239, 68, 68];
          addText(`💻 Tech Stack Match: ${techScore}%`, 11, false, techColor);
        }
        
        if (typeof data.companyOptimization.backgroundFit === 'number') {
          const backgroundScore = data.companyOptimization.backgroundFit;
          const backgroundColor: [number, number, number] = backgroundScore >= 80 ? [34, 197, 94] : backgroundScore >= 60 ? [234, 179, 8] : [239, 68, 68];
          addText(`🎯 Background Fit: ${backgroundScore}%`, 11, false, backgroundColor);
        }
        
        // Optimization Recommendations
        if (data.companyOptimization.recommendations?.length > 0) {
          yPosition += 5;
          addText('OPTIMIZATION RECOMMENDATIONS', 12, true, [16, 185, 129]);
          data.companyOptimization.recommendations.forEach((rec: string, index: number) => {
            addText(`${index + 1}. ${rec}`, 10);
          });
        }
        
        addDivider();
      }
      
      // TAB 4: IMPROVEMENTS - Smart Suggestions (generated from data)
      addColoredBox('💡 IMPROVEMENT SUGGESTIONS', '', [249, 115, 22]);
      
      addText('PRIORITY ACTION ITEMS', 12, true, [249, 115, 22]);
      
      // Generate smart improvement suggestions based on data
      const improvements = [];
      
      // ATS Foundation improvements
      if (data.atsChecks) {
        if (!data.atsChecks.contact?.email) improvements.push({ priority: 'HIGH', action: 'Add professional email address to header', impact: 'Critical for ATS parsing and recruiter contact' });
        if (!data.atsChecks.contact?.phone) improvements.push({ priority: 'HIGH', action: 'Include phone number in contact section', impact: 'Increases recruiter confidence and callback rates' });
        if (!data.atsChecks.sections?.skills) improvements.push({ priority: 'HIGH', action: 'Create dedicated Skills section', impact: 'Essential for ATS keyword matching' });
        if (data.atsChecks.wordCountStatus === 'under') improvements.push({ priority: 'MEDIUM', action: 'Expand content to 400-800 words', impact: 'Better showcases experience and achievements' });
      }
      
      // Skills improvements
      if (data.skills?.hard?.missing?.length > 0) {
        const criticalSkills = data.skills.hard.missing.slice(0, 3).join(', ');
        improvements.push({ priority: 'HIGH', action: `Add missing critical skills: ${criticalSkills}`, impact: 'Significantly improves keyword matching' });
      }
      
      // Psychology improvements
      if (data.recruiterPsychology) {
        if (data.recruiterPsychology.sixSecondImpression < 70) improvements.push({ priority: 'MEDIUM', action: 'Improve visual hierarchy and formatting', impact: 'Better first impression with recruiters' });
        if (data.recruiterPsychology.authorityLanguage?.weak?.length > 0) improvements.push({ priority: 'MEDIUM', action: 'Replace weak language with strong action words', impact: 'Demonstrates ownership and leadership' });
        if (data.recruiterPsychology.redFlags?.length > 0) improvements.push({ priority: 'HIGH', action: 'Address red flags (gaps, inconsistencies)', impact: 'Prevents automatic rejection' });
      }
      
      // Market improvements
      if (data.industry?.trendingSkills?.length > 0) {
        const trendingSkills = data.industry.trendingSkills.slice(0, 3).join(', ');
        improvements.push({ priority: 'MEDIUM', action: `Learn trending skills: ${trendingSkills}`, impact: 'Positions you as current with industry trends' });
      }
      
      // Display improvements
      if (improvements.length === 0) {
        addText('🎉 Excellent work! Your resume is well-optimized across all areas.', 11, true, [34, 197, 94]);
        addText('Continue to keep it updated with relevant skills and experiences.', 10);
      } else {
        improvements.slice(0, 10).forEach((improvement, index) => {
          const priorityColor: [number, number, number] = 
            improvement.priority === 'HIGH' ? [239, 68, 68] : 
            improvement.priority === 'MEDIUM' ? [234, 179, 8] : [59, 130, 246];
          
          addText(`${index + 1}. ${improvement.action}`, 11, true);
          addText(`   Priority: ${improvement.priority}`, 9, false, priorityColor);
          addText(`   Impact: ${improvement.impact}`, 9);
          yPosition += 2;
        });
      }
      
      addDivider();
      
      // Footer with branding
      addText('Generated by All-in-One Career ATS Scanner', 10, true, [37, 99, 235]);
      addText('Advanced AI-powered resume analysis with market intelligence', 9, false, [107, 114, 128]);
      addText(`Report Date: ${new Date().toLocaleDateString()}`, 8, false, [107, 114, 128]);
      addText('Visit: https://all-in-one-career.vercel.app', 8, false, [37, 99, 235]);
      
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

