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
  optimizationParameters: OptimizationParameters;
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
    console.log('Starting enhanced transaction analysis with dynamic optimization...');
    
    try {
      // Step 1: Input validation
      const inputValidation = enhancedAiAnalysisService.validateInput(request);
      
      // Step 2: Get basic AI analysis
      const basicResults = await aiAnalysisService.analyzeTransaction(request);
      
      // Step 3: Generate optimization parameters from user input or defaults
      const finalOptimizationParams = optimizationParams || 
        enhancedAiAnalysisService.generateDefaultOptimizationParams(request, basicResults);
      
      // Step 4: Apply optimization with dynamic parameters
      const optimization = await optimizationEngine.optimizeStructure(request, finalOptimizationParams);
      
      // Step 5: Reconcile AI results with optimization
      const { reconciledResults, reconciliation } = enhancedAiAnalysisService.reconcileResults(basicResults, optimization);
      
      return {
        results: reconciledResults,
        optimization,
        inputValidation,
        reconciliation,
        optimizationParameters: finalOptimizationParams
      };
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      
      // Fallback to basic analysis
      const basicResults = await aiAnalysisService.analyzeTransaction(request);
      const fallbackParams = enhancedAiAnalysisService.generateDefaultOptimizationParams(request, basicResults);
      
      return {
        results: basicResults,
        optimization: enhancedAiAnalysisService.createFallbackOptimization(),
        inputValidation: { isValid: false, warnings: ['Analysis completed with limitations'], suggestions: [] },
        reconciliation: { reconciliationApplied: false, changes: [] },
        optimizationParameters: fallbackParams
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
   * Enhanced default optimization parameters based on analysis
   */
  generateDefaultOptimizationParams: (request: TransactionAnalysisRequest, results: AnalysisResults): OptimizationParameters => {
    const description = request.description.toLowerCase();
    const amount = request.amount || 0;
    
    let priority: OptimizationParameters['priority'] = 'control';
    let riskTolerance: OptimizationParameters['riskTolerance'] = 'medium';
    let timeConstraints: OptimizationParameters['timeConstraints'] = 'normal';
    let budgetConstraints: OptimizationParameters['budgetConstraints'] = 'moderate';
    let marketConditions: OptimizationParameters['marketConditions'] = 'neutral';
    
    // Enhanced priority detection
    if (description.includes('urgent') || description.includes('time-sensitive') || description.includes('asap')) {
      priority = 'speed';
      timeConstraints = 'urgent';
    } else if (description.includes('cost') || description.includes('budget') || description.includes('cheap') || amount < 50000000) {
      priority = 'cost';
      budgetConstraints = amount < 20000000 ? 'tight' : 'moderate';
    } else if (description.includes('regulatory') || description.includes('compliance') || description.includes('safe') || description.includes('conservative')) {
      priority = 'regulatory_certainty';
      riskTolerance = 'low';
    } else if (description.includes('flexible') || description.includes('option')) {
      priority = 'flexibility';
    }
    
    // Risk tolerance detection
    if (description.includes('conservative') || description.includes('safe') || description.includes('low risk')) {
      riskTolerance = 'low';
    } else if (description.includes('aggressive') || description.includes('high risk') || description.includes('bold')) {
      riskTolerance = 'high';
    }
    
    // Market conditions detection
    if (description.includes('favorable') || description.includes('bull market') || description.includes('good timing')) {
      marketConditions = 'favorable';
    } else if (description.includes('challenging') || description.includes('bear market') || description.includes('difficult')) {
      marketConditions = 'challenging';
    }
    
    // Enhanced strategic objectives extraction
    const strategicObjectives: string[] = [];
    if (description.includes('control') || description.includes('majority')) strategicObjectives.push('control retention');
    if (description.includes('synergy') || description.includes('synergies')) strategicObjectives.push('synergy realization');
    if (description.includes('market') || description.includes('expansion')) strategicObjectives.push('market expansion');
    if (description.includes('cost saving') || description.includes('efficiency')) strategicObjectives.push('cost minimization');
    if (description.includes('speed') || description.includes('quick')) strategicObjectives.push('speed optimization');
    if (description.includes('regulatory') || description.includes('compliance')) strategicObjectives.push('regulatory certainty');
    if (description.includes('flexible') || description.includes('option')) strategicObjectives.push('flexibility maximization');
    if (description.includes('timing') || description.includes('market window')) strategicObjectives.push('market timing');
    
    // Default objectives if none detected
    if (strategicObjectives.length === 0) {
      strategicObjectives.push('value creation', 'stakeholder satisfaction');
    }
    
    return {
      priority,
      riskTolerance,
      timeConstraints,
      budgetConstraints,
      strategicObjectives,
      marketConditions
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
   * Enhanced quality report with optimization parameter context
   */
  getAnalysisQualityReport: (enhancedResult: EnhancedAnalysisResult): AnalysisQualityReport => {
    let overallQuality: AnalysisQualityReport['overallQuality'] = 'good';
    let optimizationConfidence = enhancedResult.optimization.recommendedStructure.optimizationScore;
    let marketDataQuality: AnalysisQualityReport['marketDataQuality'] = 'medium';
    
    // Enhanced market data quality assessment
    const precedentCount = enhancedResult.optimization.marketIntelligence.precedentTransactions.length;
    if (precedentCount >= 3) {
      marketDataQuality = 'high';
      optimizationConfidence *= 1.05; // Boost confidence with good market data
    } else if (precedentCount === 0) {
      marketDataQuality = 'low';
      optimizationConfidence *= 0.9; // Reduce confidence without market data
    }
    
    // Assessment based on optimization score
    if (optimizationConfidence >= 0.95) {
      overallQuality = 'excellent';
    } else if (optimizationConfidence >= 0.85) {
      overallQuality = 'good';
    } else if (optimizationConfidence >= 0.75) {
      overallQuality = 'fair';
    } else {
      overallQuality = 'poor';
    }
    
    // Input validation impact
    if (!enhancedResult.inputValidation.isValid && overallQuality === 'excellent') {
      overallQuality = 'good';
    }
    
    // Reconciliation impact
    if (enhancedResult.reconciliation.reconciliationApplied && enhancedResult.reconciliation.changes.length > 3) {
      if (overallQuality === 'excellent') overallQuality = 'good';
      if (overallQuality === 'good') overallQuality = 'fair';
    }
    
    const recommendations: string[] = [];
    
    // Optimization-specific recommendations
    if (optimizationConfidence < 0.85) {
      recommendations.push('Consider refining optimization preferences for better structural alignment');
    }
    
    if (marketDataQuality === 'low') {
      recommendations.push('More specific transaction details would enable better market benchmarking');
    }
    
    if (!enhancedResult.inputValidation.isValid) {
      recommendations.push(...enhancedResult.inputValidation.suggestions);
    }
    
    // Parameter-specific recommendations
    const params = enhancedResult.optimizationParameters;
    if (params.strategicObjectives.length < 2) {
      recommendations.push('Consider specifying additional strategic objectives for more comprehensive optimization');
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
