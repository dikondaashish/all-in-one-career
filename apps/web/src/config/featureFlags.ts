/**
 * Feature Flags Configuration
 * Controls which advanced features are enabled in production
 */

// Environment-based feature flags
const FEATURE_FLAGS = {
  // ATS Scanner V2 Enhanced Features
  ADVANCED_LAYER_V2: process.env.NEXT_PUBLIC_FEATURE_ADVANCED_LAYER_V2 === 'true' || true, // Default enabled for development
  
  // Individual V2 feature flags for granular control
  ATS_FOUNDATIONAL_CHECKS: true,  // Core ATS compatibility checks
  RECRUITER_PSYCHOLOGY: true,     // Psychology insights and 6-second impression
  VISUAL_SKILL_INTELLIGENCE: true, // Skill radar charts and advanced visualizations
  MARKET_INTELLIGENCE: true,      // Industry trends and market positioning
  COMPANY_OPTIMIZATION: true,     // Company-specific optimization recommendations
  PREDICTIVE_ENHANCEMENTS: true,  // Hire probability bands, X-factor, automation risk
  
  // UI/UX Enhancements
  ADVANCED_VISUALIZATIONS: true,  // Radar charts, timeline, benchmarking
  ENHANCED_DASHBOARD: true,       // Revolutionary results dashboard
  ANIMATED_COMPONENTS: true,      // Smooth animations and transitions
  
  // Experimental Features (can be toggled off quickly)
  EXPERIMENTAL_AI_INSIGHTS: true, // Latest AI-powered insights
  BETA_OPTIMIZATION_TIPS: true,   // Beta optimization recommendations
} as const;

// Export individual flags for easy importing
export const featureAdvancedLayerV2 = FEATURE_FLAGS.ADVANCED_LAYER_V2;
export const featureAtsFoundationalChecks = FEATURE_FLAGS.ATS_FOUNDATIONAL_CHECKS;
export const featureRecruiterPsychology = FEATURE_FLAGS.RECRUITER_PSYCHOLOGY;
export const featureVisualSkillIntelligence = FEATURE_FLAGS.VISUAL_SKILL_INTELLIGENCE;
export const featureMarketIntelligence = FEATURE_FLAGS.MARKET_INTELLIGENCE;
export const featureCompanyOptimization = FEATURE_FLAGS.COMPANY_OPTIMIZATION;
export const featurePredictiveEnhancements = FEATURE_FLAGS.PREDICTIVE_ENHANCEMENTS;
export const featureAdvancedVisualizations = FEATURE_FLAGS.ADVANCED_VISUALIZATIONS;
export const featureEnhancedDashboard = FEATURE_FLAGS.ENHANCED_DASHBOARD;
export const featureAnimatedComponents = FEATURE_FLAGS.ANIMATED_COMPONENTS;
export const featureExperimentalAiInsights = FEATURE_FLAGS.EXPERIMENTAL_AI_INSIGHTS;
export const featureBetaOptimizationTips = FEATURE_FLAGS.BETA_OPTIMIZATION_TIPS;

// Export all flags as object
export default FEATURE_FLAGS;

// Helper function to check if V2 features should be shown
export const shouldShowV2Features = (): boolean => {
  return featureAdvancedLayerV2;
};

// Helper function to check if specific feature is enabled
export const isFeatureEnabled = (featureName: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[featureName];
};

// Log feature flag status in development
if (process.env.NODE_ENV === 'development') {
  console.log('🚩 Feature Flags Status:', {
    'ATS V2 Enhanced': featureAdvancedLayerV2,
    'Foundational Checks': featureAtsFoundationalChecks,
    'Recruiter Psychology': featureRecruiterPsychology,
    'Market Intelligence': featureMarketIntelligence,
    'Company Optimization': featureCompanyOptimization,
    'Predictive Enhancements': featurePredictiveEnhancements,
    'Advanced Visualizations': featureAdvancedVisualizations
  });
}
