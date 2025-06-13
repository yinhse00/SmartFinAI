
import { aiAnalysisService, TransactionAnalysisRequest } from './aiAnalysisService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { optimizationEngine, OptimizationParameters, OptimizationResult } from './optimizationEngine';

export interface EnhancedAnalysisResult {
  results: AnalysisResults;
  optimization: OptimizationResult;
  inputValidation: {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  };
  reconciliation: {
    reconciliationApplied: boolean;
    changes: string[];
  };
}

export interface AnalysisQualityReport {
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  reconciliationNeeded: boolean;
  optimizationConfidence: number;
  marketDataQuality: 'high' | 'medium' | 'low';
  recommendations: string[];
}

/**
 * Enhanced AI analysis service with optimization and market intelligence
 */
export const enhancedAiAnalysisService = {
  /**
   * Analyze transaction with optimization and validation
   */
  analyzeTransactionWithValidation: async (
    request: TransactionAnalysisRequest,
    optimizationParams?: OptimizationParameters
  ): Promise<EnhancedAnalysisResult> => {
    console.log('Starting enhanced transaction analysis with optimization...');
    
    try {
      // Step 1: Input validation
      const inputValidation = enhancedAiAnalysisService.validateInput(request);
      
      // Step 2: Get basic AI analysis
      const basicResults = await aiAnalysisService.analyzeTransaction(request);
      
      // Step 3: Apply optimization if parameters provided
      let optimization: OptimizationResult | null = null;
      if (optimizationParams) {
        optimization = await optimizationEngine.optimizeStructure(request, optimizationParams);
      } else {
        // Use default optimization parameters based on analysis
        const defaultParams = enhancedAiAnalysisService.generateDefaultOptimizationParams(request, basicResults);
        optimization = await optimizationEngine.optimizeStructure(request, defaultParams);
      }
      
      // Step 4: Reconcile AI results with optimization
      const { reconciledResults, reconciliation } = enhancedAiAnalysisService.reconcileResults(basicResults, optimization);
      
      return {
        results: reconciledResults,
        optimization,
        inputValidation,
        reconciliation
      };
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      
      // Fallback to basic analysis
      const basicResults = await aiAnalysisService.analyzeTransaction(request);
      return {
        results: basicResults,
        optimization: enhancedAiAnalysisService.createFallbackOptimization(),
        inputValidation: { isValid: false, warnings: ['Analysis completed with limitations'], suggestions: [] },
        reconciliation: { reconciliationApplied: false, changes: [] }
      };
    }
  },

  /**
   * Validate transaction input
   */
  validateInput: (request: TransactionAnalysisRequest) => {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let isValid = true;
    
    // Check description quality
    if (!request.description || request.description.length < 50) {
      warnings.push('Transaction description is very brief');
      suggestions.push('Provide more detailed transaction description for better analysis');
      isValid = false;
    }
    
    // Check for amount
    if (!request.amount) {
      warnings.push('Transaction amount not specified');
      suggestions.push('Specify transaction amount for more accurate cost and structure analysis');
    }
    
    // Check for documents
    if (!request.documents || request.documents.length === 0) {
      warnings.push('No documents provided');
      suggestions.push('Upload relevant documents (term sheets, agreements) for enhanced analysis');
    }
    
    // Check transaction type specificity
    if (request.transactionType === 'Transaction Analysis') {
      warnings.push('Generic transaction type specified');
      suggestions.push('Specify exact transaction type (e.g., "Merger", "Acquisition", "Rights Issue")');
    }
    
    return { isValid, warnings, suggestions };
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
   * Reconcile AI results with optimization recommendations
   */
  reconcileResults: (basicResults: AnalysisResults, optimization: OptimizationResult) => {
    const changes: string[] = [];
    let reconciledResults = { ...basicResults };
    
    // Update structure recommendation with optimized version
    if (optimization.recommendedStructure.structure !== basicResults.structure.recommended) {
      changes.push('Updated structure recommendation based on optimization analysis');
      reconciledResults.structure.recommended = optimization.recommendedStructure.structure;
      reconciledResults.structure.rationale = `${basicResults.structure.rationale}\n\nOptimization Analysis: ${optimization.recommendedStructure.description}`;
    }
    
    // Update cost estimates with optimization data
    if (Math.abs(optimization.recommendedStructure.estimatedCost - basicResults.costs.total) > 500000) {
      changes.push('Refined cost estimates based on optimization scenarios');
      reconciledResults.costs.total = optimization.recommendedStructure.estimatedCost;
      if (reconciledResults.costs.majorDrivers) {
        reconciledResults.costs.majorDrivers.push('Optimization-based cost modeling');
      }
    }
    
    // Update timeline with optimization data
    const optimizedDuration = optimization.recommendedStructure.estimatedDuration;
    if (optimizedDuration !== basicResults.timetable.totalDuration) {
      changes.push('Updated timeline based on optimization analysis');
      reconciledResults.timetable.totalDuration = optimizedDuration;
    }
    
    // Add optimization insights to recommendations
    if (reconciledResults.compliance.actionableRecommendations) {
      reconciledResults.compliance.actionableRecommendations.push(...optimization.optimizationInsights);
    }
    
    // Add market intelligence insights
    if (optimization.marketIntelligence.marketTrends.length > 0) {
      changes.push('Incorporated current market intelligence');
      if (reconciledResults.compliance.actionableRecommendations) {
        reconciledResults.compliance.actionableRecommendations.push(
          `Market Intelligence: ${optimization.marketIntelligence.marketTrends.slice(0, 2).join('; ')}`
        );
      }
    }
    
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
