import { TransactionAnalysisRequest } from './aiAnalysisService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { liveSearchService } from '../api/xai/liveSearchService';

export interface OptimizationParameters {
  priority: 'cost' | 'speed' | 'control' | 'flexibility' | 'regulatory_certainty';
  riskTolerance: 'low' | 'medium' | 'high';
  timeConstraints: 'urgent' | 'normal' | 'flexible';
  budgetConstraints: 'tight' | 'moderate' | 'flexible';
  strategicObjectives: string[];
  marketConditions?: 'favorable' | 'neutral' | 'challenging';
}

export interface StructureScenario {
  id: string;
  name: string;
  description: string;
  structure: string;
  optimizationScore: number;
  advantages: string[];
  disadvantages: string[];
  riskFactors: string[];
  estimatedCost: number;
  estimatedDuration: string;
  successProbability: number;
  marketBenchmark?: {
    similarDeals: number;
    averageCost: number;
    averageDuration: string;
    successRate: number;
  };
}

export interface OptimizationResult {
  recommendedStructure: StructureScenario;
  alternativeStructures: StructureScenario[];
  parameterAnalysis: {
    costSensitivity: number;
    timeSensitivity: number;
    riskSensitivity: number;
    regulatorySensitivity: number;
  };
  marketIntelligence: {
    precedentTransactions: Array<{
      description: string;
      structure: string;
      outcome: string;
      relevanceScore: number;
    }>;
    marketTrends: string[];
    regulatoryEnvironment: string;
  };
  optimizationInsights: string[];
}

/**
 * Advanced optimization engine for deal structuring
 */
export const optimizationEngine = {
  /**
   * Generate optimized deal structures based on parameters and market intelligence
   */
  optimizeStructure: async (
    request: TransactionAnalysisRequest,
    parameters: OptimizationParameters
  ): Promise<OptimizationResult> => {
    console.log('Starting comprehensive deal structure optimization...');
    
    // Phase 1: Gather market intelligence
    const marketIntelligence = await optimizationEngine.gatherMarketIntelligence(request);
    
    // Phase 2: Generate multiple structure scenarios
    const scenarios = await optimizationEngine.generateStructureScenarios(request, parameters, marketIntelligence);
    
    // Phase 3: Score and rank scenarios
    const rankedScenarios = optimizationEngine.scoreScenarios(scenarios, parameters);
    
    // Phase 4: Perform sensitivity analysis
    const parameterAnalysis = optimizationEngine.analyzeSensitivity(rankedScenarios, parameters);
    
    // Phase 5: Generate optimization insights
    const insights = optimizationEngine.generateOptimizationInsights(rankedScenarios, marketIntelligence, parameters);
    
    return {
      recommendedStructure: rankedScenarios[0],
      alternativeStructures: rankedScenarios.slice(1, 4),
      parameterAnalysis,
      marketIntelligence,
      optimizationInsights: insights
    };
  },

  /**
   * Gather real market data and precedent transactions
   */
  gatherMarketIntelligence: async (request: TransactionAnalysisRequest) => {
    try {
      // Search for precedent transactions
      const precedentSearch = await liveSearchService.searchMarketConditions(
        `${request.transactionType} ${request.description} Hong Kong precedent transactions recent deals`
      );
      
      // Search for current market conditions
      const marketSearch = await liveSearchService.searchMarketConditions(
        `Hong Kong ${request.transactionType} market conditions 2024 current trends`
      );
      
      // Search for regulatory environment
      const regulatorySearch = await liveSearchService.searchRegulatory(
        `${request.transactionType} regulatory environment recent changes HKEX SFC`
      );
      
      const precedentTransactions = precedentSearch.results.slice(0, 5).map(result => ({
        description: result.title,
        structure: optimizationEngine.extractStructureFromContent(result.content),
        outcome: optimizationEngine.extractOutcomeFromContent(result.content),
        relevanceScore: result.score || 0.7
      }));
      
      const marketTrends = marketSearch.results.slice(0, 3).map(result => result.title);
      const regulatoryEnvironment = regulatorySearch.results.slice(0, 2).map(result => result.content).join(' ');
      
      return {
        precedentTransactions,
        marketTrends,
        regulatoryEnvironment: regulatoryEnvironment.substring(0, 500)
      };
    } catch (error) {
      console.error('Error gathering market intelligence:', error);
      return {
        precedentTransactions: [],
        marketTrends: ['Current market intelligence unavailable'],
        regulatoryEnvironment: 'Standard regulatory environment applies'
      };
    }
  },

  /**
   * Generate multiple structure scenarios based on parameters
   */
  generateStructureScenarios: async (
    request: TransactionAnalysisRequest,
    parameters: OptimizationParameters,
    marketIntelligence: any
  ): Promise<StructureScenario[]> => {
    const scenarios: StructureScenario[] = [];
    
    // Scenario 1: Cost-Optimized Structure
    scenarios.push({
      id: 'cost-optimized',
      name: 'Cost-Optimized Structure',
      description: 'Minimizes transaction costs while maintaining regulatory compliance',
      structure: optimizationEngine.generateCostOptimizedStructure(request, parameters),
      optimizationScore: 0,
      advantages: ['Lowest transaction costs', 'Simplified structure', 'Faster execution'],
      disadvantages: ['Limited flexibility', 'Potential tax inefficiencies'],
      riskFactors: ['Regulatory scrutiny', 'Market timing risk'],
      estimatedCost: optimizationEngine.calculateCostEstimate(request, 'cost-optimized'),
      estimatedDuration: '3-4 months',
      successProbability: 0.85
    });
    
    // Scenario 2: Speed-Optimized Structure
    scenarios.push({
      id: 'speed-optimized',
      name: 'Speed-Optimized Structure',
      description: 'Fastest possible execution with acceptable cost and risk',
      structure: optimizationEngine.generateSpeedOptimizedStructure(request, parameters),
      optimizationScore: 0,
      advantages: ['Fastest execution', 'Market timing advantage', 'Reduced market risk'],
      disadvantages: ['Higher costs', 'Potential regulatory delays'],
      riskFactors: ['Rushed due diligence', 'Stakeholder coordination'],
      estimatedCost: optimizationEngine.calculateCostEstimate(request, 'speed-optimized'),
      estimatedDuration: '2-3 months',
      successProbability: 0.75
    });
    
    // Scenario 3: Risk-Optimized Structure
    scenarios.push({
      id: 'risk-optimized',
      name: 'Risk-Minimized Structure',
      description: 'Minimizes execution and regulatory risks',
      structure: optimizationEngine.generateRiskOptimizedStructure(request, parameters),
      optimizationScore: 0,
      advantages: ['Lowest risk profile', 'High regulatory certainty', 'Stakeholder confidence'],
      disadvantages: ['Higher costs', 'Longer timeline'],
      riskFactors: ['Market changes during extended timeline'],
      estimatedCost: optimizationEngine.calculateCostEstimate(request, 'risk-optimized'),
      estimatedDuration: '4-6 months',
      successProbability: 0.95
    });
    
    // Scenario 4: Market-Aligned Structure
    scenarios.push({
      id: 'market-aligned',
      name: 'Market-Aligned Structure',
      description: 'Optimized based on current market conditions and precedents',
      structure: optimizationEngine.generateMarketAlignedStructure(request, parameters, marketIntelligence),
      optimizationScore: 0,
      advantages: ['Market-tested approach', 'Investor familiarity', 'Precedent support'],
      disadvantages: ['May not be optimal for specific case'],
      riskFactors: ['Market condition changes'],
      estimatedCost: optimizationEngine.calculateCostEstimate(request, 'market-aligned'),
      estimatedDuration: '3-5 months',
      successProbability: 0.80,
      marketBenchmark: {
        similarDeals: marketIntelligence.precedentTransactions.length,
        averageCost: 2500000,
        averageDuration: '4 months',
        successRate: 0.82
      }
    });
    
    return scenarios;
  },

  /**
   * Score and rank scenarios based on optimization parameters
   */
  scoreScenarios: (scenarios: StructureScenario[], parameters: OptimizationParameters): StructureScenario[] => {
    const weights = optimizationEngine.getParameterWeights(parameters);
    
    return scenarios.map(scenario => {
      let score = 0;
      
      // Cost scoring (inverse - lower cost = higher score)
      const costScore = Math.max(0, 1 - (scenario.estimatedCost / 5000000));
      score += costScore * weights.cost;
      
      // Speed scoring (shorter duration = higher score)
      const durationMonths = optimizationEngine.parseDuration(scenario.estimatedDuration);
      const speedScore = Math.max(0, 1 - (durationMonths / 12));
      score += speedScore * weights.speed;
      
      // Risk scoring (higher success probability = higher score)
      score += scenario.successProbability * weights.risk;
      
      // Strategic alignment scoring
      const strategicScore = optimizationEngine.calculateStrategicAlignment(scenario, parameters);
      score += strategicScore * weights.strategic;
      
      return {
        ...scenario,
        optimizationScore: Math.round(score * 100) / 100
      };
    }).sort((a, b) => b.optimizationScore - a.optimizationScore);
  },

  /**
   * Analyze parameter sensitivity
   */
  analyzeSensitivity: (scenarios: StructureScenario[], parameters: OptimizationParameters) => {
    return {
      costSensitivity: optimizationEngine.calculateCostSensitivity(scenarios),
      timeSensitivity: optimizationEngine.calculateTimeSensitivity(scenarios),
      riskSensitivity: optimizationEngine.calculateRiskSensitivity(scenarios),
      regulatorySensitivity: optimizationEngine.calculateRegulatorySensitivity(scenarios)
    };
  },

  /**
   * Generate optimization insights
   */
  generateOptimizationInsights: (
    scenarios: StructureScenario[],
    marketIntelligence: any,
    parameters: OptimizationParameters
  ): string[] => {
    const insights: string[] = [];
    
    const recommended = scenarios[0];
    const alternative = scenarios[1];
    
    // Cost-benefit insight
    const costDifference = Math.abs(recommended.estimatedCost - alternative.estimatedCost);
    if (costDifference > 500000) {
      insights.push(`Choosing ${recommended.name} over ${alternative.name} could save approximately HKD ${costDifference.toLocaleString()}`);
    }
    
    // Time optimization insight
    const timeDifference = optimizationEngine.parseDuration(alternative.estimatedDuration) - optimizationEngine.parseDuration(recommended.estimatedDuration);
    if (timeDifference > 1) {
      insights.push(`The recommended structure can complete ${timeDifference} months faster than alternatives`);
    }
    
    // Market conditions insight
    if (marketIntelligence.precedentTransactions.length > 0) {
      insights.push(`Analysis of ${marketIntelligence.precedentTransactions.length} precedent transactions supports this structural approach`);
    }
    
    // Risk-reward insight
    if (recommended.successProbability > 0.9) {
      insights.push(`The recommended structure has a ${(recommended.successProbability * 100).toFixed(0)}% success probability based on current market conditions`);
    }
    
    // Parameter-specific insight
    if (parameters.priority === 'cost') {
      insights.push('Cost optimization was prioritized, resulting in simplified structure with streamlined execution');
    } else if (parameters.priority === 'speed') {
      insights.push('Speed optimization may require additional resources but significantly reduces market timing risk');
    }
    
    return insights;
  },

  // Helper methods
  extractStructureFromContent: (content: string): string => {
    // Simple extraction logic - in practice, this would use more sophisticated NLP
    if (content.toLowerCase().includes('merger')) return 'Statutory Merger';
    if (content.toLowerCase().includes('acquisition')) return 'Share Acquisition';
    if (content.toLowerCase().includes('offer')) return 'Takeover Offer';
    return 'Standard Corporate Transaction';
  },

  extractOutcomeFromContent: (content: string): string => {
    if (content.toLowerCase().includes('completed') || content.toLowerCase().includes('successful')) return 'Successful';
    if (content.toLowerCase().includes('withdrawn') || content.toLowerCase().includes('failed')) return 'Unsuccessful';
    return 'Ongoing';
  },

  generateCostOptimizedStructure: (request: TransactionAnalysisRequest, parameters: OptimizationParameters): string => {
    return `Direct ${request.transactionType} with simplified documentation and streamlined regulatory filing process`;
  },

  generateSpeedOptimizedStructure: (request: TransactionAnalysisRequest, parameters: OptimizationParameters): string => {
    return `Accelerated ${request.transactionType} using parallel processing of regulatory approvals and pre-cleared documentation templates`;
  },

  generateRiskOptimizedStructure: (request: TransactionAnalysisRequest, parameters: OptimizationParameters): string => {
    return `Conservative ${request.transactionType} with comprehensive due diligence, multiple regulatory pre-clearances, and extensive stakeholder consultation`;
  },

  generateMarketAlignedStructure: (request: TransactionAnalysisRequest, parameters: OptimizationParameters, marketIntelligence: any): string => {
    const commonStructure = marketIntelligence.precedentTransactions.length > 0 ? 
      marketIntelligence.precedentTransactions[0].structure : 
      'Market-standard approach';
    return `${request.transactionType} following current market best practices: ${commonStructure}`;
  },

  calculateCostEstimate: (request: TransactionAnalysisRequest, scenarioType: string): number => {
    const baseAmount = request.amount || 10000000;
    const multipliers = {
      'cost-optimized': 0.02,
      'speed-optimized': 0.035,
      'risk-optimized': 0.04,
      'market-aligned': 0.03
    };
    return baseAmount * (multipliers[scenarioType] || 0.03);
  },

  getParameterWeights: (parameters: OptimizationParameters) => {
    const weights = { cost: 0.25, speed: 0.25, risk: 0.25, strategic: 0.25 };
    
    switch (parameters.priority) {
      case 'cost':
        weights.cost = 0.4;
        break;
      case 'speed':
        weights.speed = 0.4;
        break;
      case 'control':
      case 'flexibility':
        weights.strategic = 0.4;
        break;
      case 'regulatory_certainty':
        weights.risk = 0.4;
        break;
    }
    
    return weights;
  },

  parseDuration: (duration: string): number => {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 6;
  },

  calculateStrategicAlignment: (scenario: StructureScenario, parameters: OptimizationParameters): number => {
    // Simple strategic alignment calculation
    let alignment = 0.5;
    
    if (parameters.strategicObjectives.some(obj => scenario.advantages.some(adv => adv.toLowerCase().includes(obj.toLowerCase())))) {
      alignment += 0.3;
    }
    
    if (parameters.riskTolerance === 'low' && scenario.successProbability > 0.9) {
      alignment += 0.2;
    }
    
    return Math.min(1, alignment);
  },

  calculateCostSensitivity: (scenarios: StructureScenario[]): number => {
    const costs = scenarios.map(s => s.estimatedCost);
    const maxCost = Math.max(...costs);
    const minCost = Math.min(...costs);
    return (maxCost - minCost) / maxCost;
  },

  calculateTimeSensitivity: (scenarios: StructureScenario[]): number => {
    const durations = scenarios.map(s => optimizationEngine.parseDuration(s.estimatedDuration));
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    return (maxDuration - minDuration) / maxDuration;
  },

  calculateRiskSensitivity: (scenarios: StructureScenario[]): number => {
    const probabilities = scenarios.map(s => s.successProbability);
    const maxProb = Math.max(...probabilities);
    const minProb = Math.min(...probabilities);
    return maxProb - minProb;
  },

  calculateRegulatorySensitivity: (scenarios: StructureScenario[]): number => {
    // Simplified regulatory sensitivity based on scenario types
    return 0.3; // Default moderate sensitivity
  }
};
