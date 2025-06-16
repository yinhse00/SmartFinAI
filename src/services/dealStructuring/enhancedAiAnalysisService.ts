import { TransactionAnalysisRequest, aiAnalysisService, AnalysisContext } from './aiAnalysisService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { fileProcessingService } from '../documents/fileProcessingService';
import { grokService } from '../grokService';
import { parseAnalysisResponse } from './analysisResponseParser';
import { transactionTypeClassifier, TransactionClassification } from './transactionTypeClassifier';
import { typeSpecificPromptBuilder } from './typeSpecificPromptBuilder';
import { typeSpecificEntityExtractor } from './typeSpecificEntityExtractor';

export interface InputValidationResult {
  isValid: boolean;
  issues: string[];
}

export interface OptimizationResult {
  marketIntelligence: {
    precedentTransactions: any[];
    marketConditions: string;
    regulatoryEnvironment: string;
  };
  optimizationInsights: string[];
  recommendedStructure: {
    structure: string;
    optimizationScore: number;
  };
}

export interface ReconciliationResult {
  reconciledResults: AnalysisResults;
  changesApplied: string[];
  reconciliationApplied: boolean;
  originalIssues: string[];
}

export interface AnalysisQualityMetrics {
  completenessScore: number;
  accuracyScore: number;
  relevanceScore: number;
  overallQuality: 'high' | 'medium' | 'poor';
}

export interface EnhancedAnalysisResult {
  results: AnalysisResults;
  context: AnalysisContext;
  classification: TransactionClassification; // Add classification to result
  inputValidation: InputValidationResult;
  optimization: OptimizationResult;
  reconciliation: ReconciliationResult;
  qualityMetrics: AnalysisQualityMetrics;
}

/**
 * Validate that the input data is consistent
 */
const validateInputConsistency = (
  request: TransactionAnalysisRequest,
  results: AnalysisResults
): InputValidationResult => {
  const issues: string[] = [];
  let isValid = true;

  if (!request.description || request.description.length < 50) {
    issues.push('Transaction description is too short.');
    isValid = false;
  }

  if (!results.structure) {
    issues.push('No transaction structure was identified.');
    isValid = false;
  }

  return {
    isValid,
    issues
  };
};

/**
 * Calculate quality metrics for the analysis
 */
const calculateQualityMetrics = (
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
};

/**
 * Get analysis quality report
 */
const getAnalysisQualityReport = (result: EnhancedAnalysisResult): {
  overallQuality: 'high' | 'medium' | 'poor';
  completenessScore: number;
  accuracyScore: number;
  relevanceScore: number;
  inputValidationIssues: string[];
  optimizationInsightsCount: number;
  reconciliationNeeded: boolean;
} => {
  return {
    overallQuality: result.qualityMetrics.overallQuality,
    completenessScore: result.qualityMetrics.completenessScore,
    accuracyScore: result.qualityMetrics.accuracyScore,
    relevanceScore: result.qualityMetrics.relevanceScore,
    inputValidationIssues: result.inputValidation.issues,
    optimizationInsightsCount: result.optimization.optimizationInsights.length,
    reconciliationNeeded: result.reconciliation.reconciliationApplied
  };
};

export interface EnhancedAnalysisResult {
  results: AnalysisResults;
  context: AnalysisContext;
  classification: TransactionClassification; // Add classification to result
  inputValidation: InputValidationResult;
  optimization: OptimizationResult;
  reconciliation: ReconciliationResult;
  qualityMetrics: AnalysisQualityMetrics;
}

/**
 * Enhanced AI analysis service with transaction type awareness
 */
export const enhancedAiAnalysisService = {
  /**
   * Analyze transaction with type classification and validation
   */
  analyzeTransactionWithValidation: async (request: TransactionAnalysisRequest): Promise<EnhancedAnalysisResult> => {
    try {
      console.log('Starting enhanced transaction analysis with type classification...');
      
      // Step 1: Process documents if provided
      let documentContent = '';
      if (request.documents?.length > 0) {
        console.log(`Processing ${request.documents.length} uploaded documents...`);
        const extractionPromises = request.documents.map(file => 
          fileProcessingService.processFile(file)
        );
        
        const extractions = await Promise.all(extractionPromises);
        documentContent = extractions
          .map(result => `${result.source}:\n${result.content}`)
          .join('\n\n');
      }
      
      // Step 2: Classify transaction type
      console.log('Classifying transaction type...');
      const classification = await transactionTypeClassifier.classifyTransaction(
        request.description,
        documentContent
      );
      console.log('Transaction classified as:', classification.type);
      
      // Step 3: Generate type-specific analysis prompt
      const analysisPrompt = typeSpecificPromptBuilder.buildPromptForType(
        classification.type,
        request.description,
        documentContent
      );
      
      // Step 4: Get AI analysis with type-specific prompt
      console.log('Generating AI analysis with type-specific prompt...');
      const response = await grokService.generateResponse({
        prompt: analysisPrompt,
        metadata: {
          type: 'deal_structuring',
          transactionType: classification.type,
          hasDocuments: request.documents?.length > 0
        }
      });
      
      // Step 5: Parse response
      let analysisResults = parseAnalysisResponse(response.text);
      
      // Step 6: Add transaction type to results
      analysisResults.transactionType = `${classification.type} - ${classification.subType || 'Standard'}`;
      
      // Step 7: Validate input consistency
      const inputValidation = enhancedAiAnalysisService.validateInputConsistency(request, analysisResults);
      
      // Step 8: Run optimization with type awareness
      const optimization = await enhancedAiAnalysisService.optimizeWithMarketIntelligence(
        analysisResults,
        classification
      );
      
      // Step 9: Reconcile data inconsistencies with type-specific logic
      const reconciliation = enhancedAiAnalysisService.reconcileDataInconsistencies(
        request,
        analysisResults,
        classification
      );
      
      // Step 10: Apply reconciliation changes
      if (reconciliation.reconciliationApplied) {
        analysisResults = reconciliation.reconciledResults;
      }
      
      // Step 11: Calculate quality metrics
      const qualityMetrics = enhancedAiAnalysisService.calculateQualityMetrics(
        analysisResults,
        inputValidation,
        optimization,
        reconciliation
      );
      
      // Step 12: Store analysis context
      const context = aiAnalysisService.storeAnalysisContext(request, analysisResults);
      
      console.log('Enhanced analysis completed with type:', classification.type);
      
      return {
        results: analysisResults,
        context,
        classification, // Include classification in result
        inputValidation,
        optimization,
        reconciliation,
        qualityMetrics
      };
      
    } catch (error) {
      console.error('Error in enhanced transaction analysis:', error);
      throw new Error('Failed to analyze transaction with enhanced validation. Please try again.');
    }
  },

  /**
   * Validate that the input data is consistent
   */
  validateInputConsistency: (
    request: TransactionAnalysisRequest,
    results: AnalysisResults
  ): InputValidationResult => {
    return validateInputConsistency(request, results);
  },

  /**
   * Calculate quality metrics for the analysis
   */
  calculateQualityMetrics: (
    results: AnalysisResults,
    inputValidation: InputValidationResult,
    optimization: OptimizationResult,
    reconciliation: ReconciliationResult
  ): AnalysisQualityMetrics => {
    return calculateQualityMetrics(results, inputValidation, optimization, reconciliation);
  },

  /**
   * Get analysis quality report
   */
  getAnalysisQualityReport: (result: EnhancedAnalysisResult): {
    overallQuality: 'high' | 'medium' | 'poor';
    completenessScore: number;
    accuracyScore: number;
    relevanceScore: number;
    inputValidationIssues: string[];
    optimizationInsightsCount: number;
    reconciliationNeeded: boolean;
  } => {
    return getAnalysisQualityReport(result);
  },

  /**
   * Optimize with market intelligence and transaction type awareness
   */
  optimizeWithMarketIntelligence: async (
    results: AnalysisResults,
    classification: TransactionClassification
  ): Promise<OptimizationResult> => {
    // Type-specific optimization logic
    const baseOptimization = {
      marketIntelligence: {
        precedentTransactions: [],
        marketConditions: 'Current market conditions require careful consideration',
        regulatoryEnvironment: 'Standard regulatory requirements apply'
      },
      optimizationInsights: [],
      recommendedStructure: {
        structure: results.structure?.recommended || 'Standard structure',
        optimizationScore: 0.7
      }
    };

    if (classification.type === 'CAPITAL_RAISING') {
      baseOptimization.optimizationInsights.push(
        'Consider rights issue structure for existing shareholder participation',
        'Evaluate discount rate to current market price',
        'Assess market timing for capital raising completion'
      );
    } else if (classification.type === 'M&A') {
      baseOptimization.optimizationInsights.push(
        'Consider synergy realization timeline',
        'Evaluate regulatory approval requirements',
        'Assess integration complexity and costs'
      );
    } else if (classification.type === 'HYBRID') {
      baseOptimization.optimizationInsights.push(
        'Coordinate capital raising and acquisition timing',
        'Consider conditional relationships between transaction components',
        'Evaluate financing capacity for acquisition'
      );
    }

    return baseOptimization;
  },

  /**
   * Reconcile data with transaction type-specific logic
   */
  reconcileDataInconsistencies: (
    request: TransactionAnalysisRequest,
    results: AnalysisResults,
    classification: TransactionClassification
  ): ReconciliationResult => {
    let reconciledResults = { ...results };
    let changesApplied: string[] = [];
    let reconciliationApplied = false;

    // Type-specific reconciliation
    if (classification.type === 'CAPITAL_RAISING') {
      // Ensure single-company structure
      if (reconciledResults.corporateStructure?.entities) {
        const issuingEntity = reconciledResults.corporateStructure.entities.find(e => 
          e.type === 'issuer' || e.name === classification.issuingCompany
        );
        
        if (!issuingEntity && classification.issuingCompany) {
          reconciledResults.corporateStructure.entities.push({
            id: 'issuer-1',
            name: classification.issuingCompany,
            type: 'issuer',
            description: 'Company conducting capital raising'
          });
          changesApplied.push('Added issuing company entity');
          reconciliationApplied = true;
        }
      }
    } else if (classification.type === 'M&A') {
      // Ensure acquirer-target structure
      if (reconciledResults.corporateStructure?.entities) {
        const hasAcquirer = reconciledResults.corporateStructure.entities.some(e => 
          e.type === 'issuer' || e.type === 'parent'
        );
        const hasTarget = reconciledResults.corporateStructure.entities.some(e => e.type === 'target');
        
        if (!hasAcquirer && classification.acquiringCompany) {
          reconciledResults.corporateStructure.entities.push({
            id: 'acquirer-1',
            name: classification.acquiringCompany,
            type: 'issuer',
            description: 'Acquiring company'
          });
          changesApplied.push('Added acquiring company entity');
          reconciliationApplied = true;
        }
        
        if (!hasTarget && classification.targetCompany) {
          reconciledResults.corporateStructure.entities.push({
            id: 'target-1',
            name: classification.targetCompany,
            type: 'target',
            description: 'Target company being acquired'
          });
          changesApplied.push('Added target company entity');
          reconciliationApplied = true;
        }
      }
    }

    return {
      reconciledResults,
      changesApplied,
      reconciliationApplied,
      originalIssues: reconciliationApplied ? ['Missing type-specific entities'] : []
    };
  }
};
