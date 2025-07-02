
import { aiAnalysisService, TransactionAnalysisRequest } from './aiAnalysisService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { createFallbackAnalysis } from './analysisFallbackData';
import { optimizationEngine, OptimizationParameters, OptimizationResult } from './optimizationEngine';
import { extractUserInputAmount } from './converterUtils/dataExtractors';
import { inputValidationService, InputValidationResult } from './inputValidationService';
import { inputAuthorityService, AuthoritativeData, InputAuthorityReport } from './inputAuthorityService';

export interface EnhancedAnalysisResult {
  results: AnalysisResults;
  optimization: OptimizationResult;
  inputValidation: InputValidationResult;
  inputAuthority: InputAuthorityReport;
  authoritative: AuthoritativeData;
  reconciliation: {
    reconciliationApplied: boolean;
    changes: string[];
    regulatoryIntelligence?: {
      provisions: number;
      faqs: number;
      vettingRequirements: number;
      processingTime: number;
      tablesSearched: string[];
    } | null;
  };
}

export interface AnalysisQualityReport {
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  reconciliationNeeded: boolean;
  optimizationConfidence: number;
  marketDataQuality: 'high' | 'medium' | 'low';
  recommendations: string[];
}

export interface ExtractedUserInputs {
  amount?: number;
  currency?: string;
  acquisitionPercentage?: number;
  targetCompanyName?: string;
  acquiringCompanyName?: string;
}

/**
 * Enhanced AI analysis service with optimization and market intelligence
 */
export const enhancedAiAnalysisService = {
  /**
   * Extract structured data from user input (legacy method - now uses inputValidationService)
   */
  extractUserInputs: (request: TransactionAnalysisRequest): ExtractedUserInputs => {
    const validationResult = inputValidationService.extractAndValidateInputs(request);
    return validationResult.extractedInputs;
  },

  /**
   * Analyze transaction with enhanced input validation and authority enforcement
   */
  analyzeTransactionWithValidation: async (
    request: TransactionAnalysisRequest,
    optimizationParams?: OptimizationParameters
  ): Promise<EnhancedAnalysisResult> => {
    console.log('=== ENHANCED ANALYSIS WITH INPUT AUTHORITY ===');
    
    try {
      // PHASE 1: Enhanced Input Validation FIRST
      const inputValidation = inputValidationService.extractAndValidateInputs(request);
      console.log('✅ Phase 1 - Input validation completed:', {
        isValid: inputValidation.isValid,
        confidence: inputValidation.confidence,
        extractedAmount: inputValidation.extractedInputs.amount
      });
      
      // PHASE 2: Create Authoritative Data Structure
      const authoritative = inputAuthorityService.createAuthoritative(inputValidation);
      console.log('✅ Phase 2 - Authoritative data created:', authoritative);
      
      // PHASE 3: AI Analysis with Enhanced User Input Context
      const basicResults = await aiAnalysisService.analyzeTransaction(
        request, 
        inputValidation.extractedInputs
      );
      console.log('✅ Phase 3 - AI analysis completed');
      
      // PHASE 4: Enforce Input Authority over AI Results
      const { protectedResults, report } = inputAuthorityService.enforceAuthority(
        basicResults, 
        authoritative
      );
      console.log('✅ Phase 4 - Input authority enforced, overrides:', report.overriddenFields.length);
      
      // PHASE 5: Apply Optimization
      let optimization: OptimizationResult;
      if (optimizationParams) {
        optimization = await optimizationEngine.optimizeStructure(request, optimizationParams);
      } else {
        const defaultParams = enhancedAiAnalysisService.generateDefaultOptimizationParams(request, protectedResults);
        optimization = await optimizationEngine.optimizeStructure(request, defaultParams);
      }
      
      // PHASE 6: Final Reconciliation with Authority Protection
      const { reconciledResults, reconciliation } = enhancedAiAnalysisService.reconcileResults(
        protectedResults, 
        optimization, 
        inputValidation.extractedInputs,
        authoritative
      );
      
      return {
        results: reconciledResults,
        optimization,
        inputValidation,
        inputAuthority: report,
        authoritative,
        reconciliation
      };
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      
      // Fallback with input protection
      const inputValidation = inputValidationService.extractAndValidateInputs(request);
      const authoritative = inputAuthorityService.createAuthoritative(inputValidation);
      
      try {
        const basicResults = await aiAnalysisService.analyzeTransaction(request, inputValidation.extractedInputs);
        const { protectedResults, report } = inputAuthorityService.enforceAuthority(basicResults, authoritative);
        
        return {
          results: protectedResults,
          optimization: enhancedAiAnalysisService.createFallbackOptimization(),
          inputValidation,
          inputAuthority: report,
          authoritative,
          reconciliation: { reconciliationApplied: true, changes: ['Applied user inputs to fallback data'] }
        };
      } catch (fallbackError) {
        console.error('Fallback analysis also failed:', fallbackError);
        const fallbackResults = createFallbackAnalysis(request.description, inputValidation.extractedInputs);
        const { protectedResults, report } = inputAuthorityService.enforceAuthority(fallbackResults, authoritative);
        
        return {
          results: protectedResults,
          optimization: enhancedAiAnalysisService.createFallbackOptimization(),
          inputValidation,
          inputAuthority: report,
          authoritative,
          reconciliation: { reconciliationApplied: false, changes: [] }
        };
      }
    }
  },

  /**
   * Apply user inputs to analysis results with comprehensive validation
   */
  applyUserInputsToResults: (results: AnalysisResults, userInputs: ExtractedUserInputs): AnalysisResults => {
    console.log('=== APPLYING USER INPUTS TO RESULTS ===');
    console.log('User inputs to apply:', userInputs);
    console.log('Current dealEconomics.purchasePrice:', results.dealEconomics?.purchasePrice);
    console.log('Current valuation.transactionValue.amount:', results.valuation?.transactionValue?.amount);
    
    const updatedResults = { ...results };
    
    // Apply user amount if extracted
    if (userInputs.amount) {
      console.log('📊 Applying user amount:', userInputs.amount);
      
      // Update dealEconomics
      updatedResults.dealEconomics = {
        ...updatedResults.dealEconomics,
        purchasePrice: userInputs.amount,
        currency: userInputs.currency || updatedResults.dealEconomics?.currency || 'HKD'
      };
      
      // Update valuation data to match dealEconomics
      updatedResults.valuation = {
        ...updatedResults.valuation,
        transactionValue: {
          ...updatedResults.valuation.transactionValue,
          amount: userInputs.amount,
          currency: userInputs.currency || updatedResults.valuation.transactionValue.currency
        },
        valuationRange: {
          low: userInputs.amount * 0.9,
          high: userInputs.amount * 1.1,
          midpoint: userInputs.amount
        }
      };
      
      console.log('✅ Updated dealEconomics.purchasePrice:', updatedResults.dealEconomics.purchasePrice);
      console.log('✅ Updated valuation.transactionValue.amount:', updatedResults.valuation.transactionValue.amount);
    }
    
    // Apply acquisition percentage if extracted
    if (userInputs.acquisitionPercentage) {
      updatedResults.dealEconomics = {
        ...updatedResults.dealEconomics,
        targetPercentage: userInputs.acquisitionPercentage
      };
      console.log('✅ Applied acquisition percentage:', userInputs.acquisitionPercentage);
    }
    
    return updatedResults;
  },

  /**
   * Legacy input validation (now delegated to inputValidationService)
   */
  validateInput: (request: TransactionAnalysisRequest) => {
    const result = inputValidationService.extractAndValidateInputs(request);
    return {
      isValid: result.isValid,
      warnings: result.warnings,
      suggestions: result.suggestions
    };
  },

  /**
   * Generate default optimization parameters based on analysis
   */
  generateDefaultOptimizationParams: (request: TransactionAnalysisRequest, results: AnalysisResults): OptimizationParameters => {
    // Analyze transaction characteristics to determine default priorities
    const description = request.description.toLowerCase();
    const amount = request.amount || 0;
    
    let priority: OptimizationParameters['priority'] = 'control';
    let riskTolerance: OptimizationParameters['riskTolerance'] = 'medium';
    let timeConstraints: OptimizationParameters['timeConstraints'] = 'normal';
    
    // Determine priority based on transaction type and description
    if (description.includes('urgent') || description.includes('time-sensitive')) {
      priority = 'speed';
      timeConstraints = 'urgent';
    } else if (description.includes('cost') || description.includes('budget') || amount < 50000000) {
      priority = 'cost';
    } else if (description.includes('regulatory') || description.includes('compliance')) {
      priority = 'regulatory_certainty';
      riskTolerance = 'low';
    }
    
    // Extract strategic objectives from description
    const strategicObjectives: string[] = [];
    if (description.includes('control')) strategicObjectives.push('control');
    if (description.includes('synergy')) strategicObjectives.push('synergies');
    if (description.includes('market')) strategicObjectives.push('market expansion');
    if (description.includes('cost saving')) strategicObjectives.push('cost savings');
    
    return {
      priority,
      riskTolerance,
      timeConstraints,
      budgetConstraints: amount > 100000000 ? 'flexible' : 'moderate',
      strategicObjectives: strategicObjectives.length > 0 ? strategicObjectives : ['value creation'],
      marketConditions: 'neutral'
    };
  },

  /**
   * Reconcile AI results with optimization and enforce input authority
   */
  reconcileResults: (
    basicResults: AnalysisResults, 
    optimization: OptimizationResult, 
    userInputs?: ExtractedUserInputs,
    authoritative?: AuthoritativeData
  ) => {
    console.log('=== ENHANCED RECONCILIATION WITH AUTHORITY ===');
    
    const changes: string[] = [];
    let reconciledResults = { ...basicResults };
    
    // PHASE 1: Apply authoritative user inputs if provided
    if (authoritative) {
      const { protectedResults, report } = inputAuthorityService.enforceAuthority(reconciledResults, authoritative);
      reconciledResults = protectedResults;
      changes.push(...report.overriddenFields.map(field => `Protected user input: ${field}`));
    } else if (userInputs) {
      // Fallback to legacy user input application
      reconciledResults = enhancedAiAnalysisService.applyUserInputsToResults(reconciledResults, userInputs);
      if (userInputs.amount) {
        changes.push(`Applied user-specified amount: ${userInputs.amount.toLocaleString()}`);
      }
      if (userInputs.acquisitionPercentage) {
        changes.push(`Applied user-specified acquisition percentage: ${userInputs.acquisitionPercentage}%`);
      }
    }
    
    // PHASE 2: Apply optimization recommendations (without overriding user inputs)
    if (optimization.recommendedStructure.structure !== basicResults.structure.recommended) {
      changes.push('Updated structure recommendation based on optimization analysis');
      reconciledResults.structure.recommended = optimization.recommendedStructure.structure;
      reconciledResults.structure.rationale = `${basicResults.structure.rationale}\n\nOptimization Analysis: ${optimization.recommendedStructure.description}`;
    }
    
    // PHASE 3: Update costs and timeline from optimization
    if (Math.abs(optimization.recommendedStructure.estimatedCost - basicResults.costs.total) > 500000) {
      changes.push('Refined cost estimates based on optimization scenarios');
      reconciledResults.costs.total = optimization.recommendedStructure.estimatedCost;
      if (reconciledResults.costs.majorDrivers) {
        reconciledResults.costs.majorDrivers.push('Optimization-based cost modeling');
      }
    }
    
    const optimizedDuration = optimization.recommendedStructure.estimatedDuration;
    if (optimizedDuration !== basicResults.timetable.totalDuration) {
      changes.push('Updated timeline based on optimization analysis');
      reconciledResults.timetable.totalDuration = optimizedDuration;
    }
    
    // PHASE 4: Add optimization insights
    if (reconciledResults.compliance.recommendations) {
      reconciledResults.compliance.recommendations.push(...optimization.optimizationInsights);
    }
    
    if (optimization.marketIntelligence.marketTrends.length > 0) {
      changes.push('Incorporated current market intelligence');
      if (reconciledResults.compliance.recommendations) {
        reconciledResults.compliance.recommendations.push(
          `Market Intelligence: ${optimization.marketIntelligence.marketTrends.slice(0, 2).join('; ')}`
        );
      }
    }
    
    // PHASE 5: Final authority validation
    if (authoritative && !inputAuthorityService.validateAuthority(reconciledResults, authoritative)) {
      console.log('⚠️ Final authority validation failed, re-enforcing...');
      const { protectedResults } = inputAuthorityService.enforceAuthority(reconciledResults, authoritative);
      reconciledResults = protectedResults;
      changes.push('Re-enforced user input authority after reconciliation');
    }
    
    console.log('✅ Enhanced reconciliation completed, changes:', changes.length);
    
    return {
      reconciledResults,
      reconciliation: {
        reconciliationApplied: changes.length > 0,
        changes
      }
    };
  },

  /**
   * Create fallback optimization for error cases
   */
  createFallbackOptimization: (): OptimizationResult => {
    return {
      recommendedStructure: {
        id: 'fallback',
        name: 'Standard Structure',
        description: 'Standard transaction structure based on regulatory requirements',
        structure: 'Standard approach following Hong Kong listing rules',
        optimizationScore: 0.7,
        advantages: ['Regulatory compliance', 'Proven approach'],
        disadvantages: ['May not be optimized for specific requirements'],
        riskFactors: ['Standard execution risks'],
        estimatedCost: 2000000,
        estimatedDuration: '4-6 months',
        successProbability: 0.8
      },
      alternativeStructures: [],
      parameterAnalysis: {
        costSensitivity: 0.3,
        timeSensitivity: 0.3,
        riskSensitivity: 0.2,
        regulatorySensitivity: 0.3
      },
      marketIntelligence: {
        precedentTransactions: [],
        marketTrends: ['Market intelligence temporarily unavailable'],
        regulatoryEnvironment: 'Standard regulatory environment'
      },
      optimizationInsights: ['Analysis completed with standard parameters']
    };
  },

  /**
   * Generate quality report for analysis
   */
  getAnalysisQualityReport: (enhancedResult: EnhancedAnalysisResult): AnalysisQualityReport => {
    let overallQuality: AnalysisQualityReport['overallQuality'] = 'good';
    let optimizationConfidence = enhancedResult.optimization.recommendedStructure.optimizationScore;
    let marketDataQuality: AnalysisQualityReport['marketDataQuality'] = 'medium';
    
    // Assess market data quality
    const precedentCount = enhancedResult.optimization.marketIntelligence.precedentTransactions.length;
    if (precedentCount >= 3) {
      marketDataQuality = 'high';
    } else if (precedentCount === 0) {
      marketDataQuality = 'low';
      optimizationConfidence *= 0.8;
    }
    
    // Assess overall quality
    if (!enhancedResult.inputValidation.isValid) {
      overallQuality = 'fair';
    }
    
    if (enhancedResult.reconciliation.reconciliationApplied && enhancedResult.reconciliation.changes.length > 3) {
      overallQuality = 'fair';
    }
    
    if (optimizationConfidence > 0.8 && marketDataQuality === 'high' && enhancedResult.inputValidation.isValid) {
      overallQuality = 'excellent';
    }
    
    const recommendations: string[] = [];
    if (marketDataQuality === 'low') {
      recommendations.push('Consider providing more specific transaction details for better market benchmarking');
    }
    if (!enhancedResult.inputValidation.isValid) {
      recommendations.push(...enhancedResult.inputValidation.suggestions);
    }
    
    return {
      overallQuality,
      reconciliationNeeded: enhancedResult.reconciliation.reconciliationApplied,
      optimizationConfidence,
      marketDataQuality,
      recommendations
    };
  }
};
