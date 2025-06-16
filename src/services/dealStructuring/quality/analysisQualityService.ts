
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { InputValidationResult } from '../validation/inputValidationService';
import { OptimizationResult } from '../optimizationEngine';
import { ReconciliationResult } from '../reconciliation/dataReconciliationService';

export interface AnalysisQualityMetrics {
  completenessScore: number;
  accuracyScore: number;
  relevanceScore: number;
  overallQuality: 'high' | 'medium' | 'poor';
}

export interface AnalysisQualityReport {
  overallQuality: 'high' | 'medium' | 'poor';
  completenessScore: number;
  accuracyScore: number;
  relevanceScore: number;
  inputValidationIssues: string[];
  optimizationInsightsCount: number;
  reconciliationNeeded: boolean;
}

/**
 * Service for calculating and reporting analysis quality metrics
 */
export const analysisQualityService = {
  /**
   * Calculate quality metrics for the analysis
   */
  calculateQualityMetrics: (
    results: AnalysisResults,
    inputValidation: InputValidationResult,
    optimization: OptimizationResult,
    reconciliation: ReconciliationResult
  ): AnalysisQualityMetrics => {
    let completenessScore = 0.8;
    let accuracyScore = 0.7;
    let relevanceScore = 0.9;

    if (!inputValidation.isValid) {
      accuracyScore -= 0.3;
    }

    if (optimization.optimizationInsights.length === 0) {
      completenessScore -= 0.2;
    }

    if (reconciliation.reconciliationApplied) {
      accuracyScore -= 0.1;
    }

    const overallScore = (completenessScore + accuracyScore + relevanceScore) / 3;
    let overallQuality: 'high' | 'medium' | 'poor' = 'medium';

    if (overallScore > 0.8) {
      overallQuality = 'high';
    } else if (overallScore < 0.6) {
      overallQuality = 'poor';
    }

    return {
      completenessScore,
      accuracyScore,
      relevanceScore,
      overallQuality
    };
  },

  /**
   * Generate analysis quality report
   */
  generateQualityReport: (
    qualityMetrics: AnalysisQualityMetrics,
    inputValidation: InputValidationResult,
    optimization: OptimizationResult,
    reconciliation: ReconciliationResult
  ): AnalysisQualityReport => {
    return {
      overallQuality: qualityMetrics.overallQuality,
      completenessScore: qualityMetrics.completenessScore,
      accuracyScore: qualityMetrics.accuracyScore,
      relevanceScore: qualityMetrics.relevanceScore,
      inputValidationIssues: inputValidation.issues,
      optimizationInsightsCount: optimization.optimizationInsights.length,
      reconciliationNeeded: reconciliation.reconciliationApplied
    };
  }
};
