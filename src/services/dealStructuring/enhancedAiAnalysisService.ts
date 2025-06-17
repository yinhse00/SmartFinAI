
import { aiAnalysisService, TransactionAnalysisRequest } from './aiAnalysisService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { createFallbackAnalysis } from './analysisFallbackData';
import { optimizationEngine, OptimizationParameters, OptimizationResult } from './optimizationEngine';
import { extractUserInputAmount } from './converterUtils/dataExtractors';

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

export interface ExtractedUserInputs {
  amount?: number;
  currency?: string;
  acquisitionPercentage?: number;
}

/**
 * Enhanced AI analysis service with optimization and market intelligence
 */
export const enhancedAiAnalysisService = {
  /**
   * Extract structured data from user input
   */
  extractUserInputs: (request: TransactionAnalysisRequest): ExtractedUserInputs => {
    const extracted: ExtractedUserInputs = {};
    
    // Extract amount from description
    const extractedAmount = extractUserInputAmount(request.description);
    if (extractedAmount) {
      extracted.amount = extractedAmount;
      console.log('Extracted amount from user input:', extractedAmount);
    }
    
    // Extract currency
    const description = request.description.toLowerCase();
    if (description.includes('hk$') || description.includes('hkd') || description.includes('hong kong dollar')) {
      extracted.currency = 'HKD';
    } else if (description.includes('usd') || description.includes('us$')) {
      extracted.currency = 'USD';
    }
    
    // Extract acquisition percentage
    const percentageMatch = request.description.match(/(?:acquire|purchase|buy|obtaining?)\s+(?:a\s+)?(\d+(?:\.\d+)?)%/i);
    if (percentageMatch) {
      extracted.acquisitionPercentage = parseFloat(percentageMatch[1]);
    }
    
    return extracted;
  },

  /**
   * Analyze transaction with optimization and validation
   */
  analyzeTransactionWithValidation: async (
    request: TransactionAnalysisRequest,
    optimizationParams?: OptimizationParameters
  ): Promise<EnhancedAnalysisResult> => {
    console.log('Starting enhanced transaction analysis with optimization...');
    
    try {
      // Step 1: Extract user inputs before AI analysis
      const userInputs = enhancedAiAnalysisService.extractUserInputs(request);
      console.log('Extracted user inputs:', userInputs);
      console.log('=== VALIDATION: Passing userInputs to AI analysis ===');
      
      // Step 2: Input validation
      const inputValidation = enhancedAiAnalysisService.validateInput(request);
      
      // Step 3: Get basic AI analysis WITH userInputs passed - THIS IS THE FIX
      const basicResults = await aiAnalysisService.analyzeTransaction(request, userInputs);
      console.log('AI analysis completed with userInputs passed');
      
      // Step 4: Apply optimization if parameters provided
      let optimization: OptimizationResult | null = null;
      if (optimizationParams) {
        optimization = await optimizationEngine.optimizeStructure(request, optimizationParams);
      } else {
        // Use default optimization parameters based on analysis
        const defaultParams = enhancedAiAnalysisService.generateDefaultOptimizationParams(request, basicResults);
        optimization = await optimizationEngine.optimizeStructure(request, defaultParams);
      }
      
      // Step 5: Reconcile AI results with optimization and user inputs - PASS userInputs to reconciliation
      const { reconciledResults, reconciliation } = enhancedAiAnalysisService.reconcileResults(basicResults, optimization, userInputs);
      
      return {
        results: reconciledResults,
        optimization,
        inputValidation,
        reconciliation
      };
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      
      // Extract user inputs for fallback
      const userInputs = enhancedAiAnalysisService.extractUserInputs(request);
      console.log('=== FALLBACK: Passing userInputs to fallback AI analysis ===');
      
      // Fallback to basic analysis with user inputs preserved - THIS IS THE SECOND FIX
      try {
        const basicResults = await aiAnalysisService.analyzeTransaction(request, userInputs);
        console.log('Fallback AI analysis completed with userInputs passed');
        return {
          results: enhancedAiAnalysisService.applyUserInputsToResults(basicResults, userInputs),
          optimization: enhancedAiAnalysisService.createFallbackOptimization(),
          inputValidation: { isValid: false, warnings: ['Analysis completed with limitations'], suggestions: [] },
          reconciliation: { reconciliationApplied: true, changes: ['Applied user inputs to fallback data'] }
        };
      } catch (fallbackError) {
        console.error('Fallback analysis also failed:', fallbackError);
        return {
          results: createFallbackAnalysis(request.description, userInputs),
          optimization: enhancedAiAnalysisService.createFallbackOptimization(),
          inputValidation: { isValid: false, warnings: ['Analysis completed with limitations'], suggestions: [] },
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
   * Reconcile AI results with optimization recommendations and user inputs
   */
  reconcileResults: (basicResults: AnalysisResults, optimization: OptimizationResult, userInputs?: ExtractedUserInputs) => {
    console.log('=== RECONCILING RESULTS WITH USER INPUT PROTECTION ===');
    console.log('User inputs for reconciliation:', userInputs);
    
    const changes: string[] = [];
    let reconciledResults = { ...basicResults };
    
    // CRITICAL FIX: Apply user inputs first and protect them throughout reconciliation
    if (userInputs) {
      console.log('🛡️ Protecting user inputs during reconciliation');
      reconciledResults = enhancedAiAnalysisService.applyUserInputsToResults(reconciledResults, userInputs);
      
      if (userInputs.amount) {
        changes.push(`Applied user-specified amount: ${userInputs.amount.toLocaleString()}`);
      }
      if (userInputs.acquisitionPercentage) {
        changes.push(`Applied user-specified acquisition percentage: ${userInputs.acquisitionPercentage}%`);
      }
    }
    
    // Update structure recommendation with optimized version (only if not overriding user preferences)
    if (optimization.recommendedStructure.structure !== basicResults.structure.recommended) {
      changes.push('Updated structure recommendation based on optimization analysis');
      reconciledResults.structure.recommended = optimization.recommendedStructure.structure;
      reconciledResults.structure.rationale = `${basicResults.structure.rationale}\n\nOptimization Analysis: ${optimization.recommendedStructure.description}`;
    }
    
    // Update cost estimates with optimization data (but don't override user amounts)
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
    if (reconciledResults.compliance.recommendations) {
      reconciledResults.compliance.recommendations.push(...optimization.optimizationInsights);
    }
    
    // Add market intelligence insights
    if (optimization.marketIntelligence.marketTrends.length > 0) {
      changes.push('Incorporated current market intelligence');
      if (reconciledResults.compliance.recommendations) {
        reconciledResults.compliance.recommendations.push(
          `Market Intelligence: ${optimization.marketIntelligence.marketTrends.slice(0, 2).join('; ')}`
        );
      }
    }
    
    // CRITICAL FIX: Final validation with USER INPUT AUTHORITY
    if (userInputs?.amount && reconciledResults.dealEconomics && reconciledResults.valuation) {
      console.log('🔒 FINAL USER INPUT PROTECTION: Ensuring user amount is authoritative');
      
      // Override any potentially corrupted dealEconomics with user input
      if (reconciledResults.dealEconomics.purchasePrice !== userInputs.amount) {
        console.log('🚨 Correcting corrupted dealEconomics.purchasePrice:', reconciledResults.dealEconomics.purchasePrice, '→', userInputs.amount);
        reconciledResults.dealEconomics.purchasePrice = userInputs.amount;
        changes.push('Protected user input amount from AI corruption');
      }
      
      // Ensure valuation matches user input (not potentially corrupted dealEconomics)
      if (reconciledResults.valuation.transactionValue.amount !== userInputs.amount) {
        console.log('🔧 Syncing valuation with user input:', reconciledResults.valuation.transactionValue.amount, '→', userInputs.amount);
        reconciledResults.valuation.transactionValue.amount = userInputs.amount;
        reconciledResults.valuation.transactionValue.currency = userInputs.currency || reconciledResults.valuation.transactionValue.currency;
        reconciledResults.valuation.valuationRange = {
          low: userInputs.amount * 0.9,
          high: userInputs.amount * 1.1,
          midpoint: userInputs.amount
        };
        changes.push('Synchronized valuation with protected user input');
      }
    } else if (reconciledResults.dealEconomics?.purchasePrice && reconciledResults.valuation?.transactionValue?.amount) {
      // Only sync if both exist and no user input to protect
      if (reconciledResults.dealEconomics.purchasePrice !== reconciledResults.valuation.transactionValue.amount) {
        console.log('🔧 Standard reconciliation: syncing dealEconomics and valuation amounts');
        reconciledResults.valuation.transactionValue.amount = reconciledResults.dealEconomics.purchasePrice;
        reconciledResults.valuation.valuationRange = {
          low: reconciledResults.dealEconomics.purchasePrice * 0.9,
          high: reconciledResults.dealEconomics.purchasePrice * 1.1,
          midpoint: reconciledResults.dealEconomics.purchasePrice
        };
        changes.push('Synchronized transaction amounts across all sections');
      }
    }
    
    console.log('✅ Reconciliation completed with user input protection, changes:', changes);
    
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
