
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { TransactionFlow } from '@/types/transactionFlow';
import { transactionDataValidator } from './transactionDataValidator';
import { OptimizationResult } from './optimizationEngine';

export interface EnhancedTransactionFlowData {
  analysisResults: AnalysisResults;
  optimizationResult?: OptimizationResult;
}

export class TransactionFlowConverter {
  convertToTransactionFlow(
    results: AnalysisResults, 
    optimizationResult?: OptimizationResult
  ): TransactionFlow | undefined {
    // Validate data first
    const validation = transactionDataValidator.validateConsistency(results);
    
    if (!validation.isValid) {
      console.warn('Transaction data validation failed:', validation.errors);
    }

    if (validation.warnings.length > 0) {
      console.warn('Transaction data warnings:', validation.warnings);
    }

    // Extract data with optimization priority
    const considerationAmount = this.extractOptimizedConsiderationAmount(results, optimizationResult);
    const { acquisitionPercentage, remainingPercentage } = this.extractOptimizedOwnershipPercentages(results, optimizationResult);
    const { targetCompanyName, acquiringCompanyName } = this.extractOptimizedEntityNames(results, optimizationResult);
    const recommendedStructure = optimizationResult?.recommendedStructure?.structure || results.structure?.recommended || 'Standard Transaction Structure';

    // Build transaction flow with optimized data
    const before = this.buildBeforeStructure(results, acquiringCompanyName, targetCompanyName);
    const after = this.buildAfterStructure(
      results, 
      acquiringCompanyName, 
      targetCompanyName, 
      acquisitionPercentage, 
      remainingPercentage, 
      considerationAmount,
      optimizationResult
    );

    const transactionSteps = this.generateOptimizedTransactionSteps(
      acquiringCompanyName, 
      acquisitionPercentage, 
      considerationAmount,
      recommendedStructure,
      optimizationResult
    );

    return {
      before,
      after,
      transactionSteps,
      transactionContext: {
        type: results.transactionType || 'Transaction Analysis',
        amount: considerationAmount,
        currency: 'HKD',
        targetName: targetCompanyName,
        buyerName: acquiringCompanyName,
        description: this.generateOptimizedDescription(acquisitionPercentage, considerationAmount, recommendedStructure),
        optimizationInsights: optimizationResult?.optimizationInsights || [],
        recommendedStructure: recommendedStructure,
        optimizationScore: optimizationResult?.recommendedStructure?.optimizationScore
      }
    };
  }

  private extractOptimizedConsiderationAmount(
    results: AnalysisResults, 
    optimizationResult?: OptimizationResult
  ): number {
    // Priority 1: Optimization result
    if (optimizationResult?.recommendedStructure?.estimatedCost) {
      return optimizationResult.recommendedStructure.estimatedCost;
    }

    // Priority 2: Original analysis extraction
    return transactionDataValidator.extractConsiderationAmount(results) || 50000000; // 50M default only if no data
  }

  private extractOptimizedOwnershipPercentages(
    results: AnalysisResults,
    optimizationResult?: OptimizationResult
  ): { acquisitionPercentage: number; remainingPercentage: number } {
    // Priority 1: Extract from optimization structure description
    if (optimizationResult?.recommendedStructure?.structure) {
      const structureText = optimizationResult.recommendedStructure.structure;
      const percentageMatch = structureText.match(/(\d+)%/);
      if (percentageMatch) {
        const acquisitionPercentage = parseInt(percentageMatch[1]);
        return {
          acquisitionPercentage,
          remainingPercentage: 100 - acquisitionPercentage
        };
      }
    }

    // Priority 2: Original analysis data
    return transactionDataValidator.extractOwnershipPercentages(results);
  }

  private extractOptimizedEntityNames(
    results: AnalysisResults,
    optimizationResult?: OptimizationResult
  ): { targetCompanyName: string; acquiringCompanyName: string } {
    // Priority 1: Extract from optimization context
    if (optimizationResult?.marketIntelligence?.precedentTransactions?.length > 0) {
      const precedent = optimizationResult.marketIntelligence.precedentTransactions[0];
      // Try to extract company names from precedent descriptions
      const names = this.extractCompanyNamesFromText(precedent.description);
      if (names.targetCompanyName && names.acquiringCompanyName) {
        return names;
      }
    }

    // Priority 2: Original analysis data
    const originalNames = transactionDataValidator.extractEntityNames(results);
    
    // Only use defaults if absolutely no data available
    if (originalNames.targetCompanyName === 'Target Company' && originalNames.acquiringCompanyName === 'Acquiring Company') {
      // Try to extract from analysis description or structure rationale
      const analysisText = results.structure?.rationale || results.shareholding?.impact || '';
      const extractedNames = this.extractCompanyNamesFromText(analysisText);
      if (extractedNames.targetCompanyName !== 'Target Company') {
        return extractedNames;
      }
    }

    return originalNames;
  }

  private extractCompanyNamesFromText(text: string): { targetCompanyName: string; acquiringCompanyName: string } {
    // Simple extraction logic - could be enhanced with more sophisticated NLP
    const companyPattern = /([A-Z][a-zA-Z\s&]+(?:Limited|Ltd|Corporation|Corp|Company|Co|Group|Holdings))/g;
    const matches = text.match(companyPattern);
    
    if (matches && matches.length >= 2) {
      return {
        acquiringCompanyName: matches[0].trim(),
        targetCompanyName: matches[1].trim()
      };
    }
    
    return {
      targetCompanyName: 'Target Company',
      acquiringCompanyName: 'Acquiring Company'
    };
  }

  private generateOptimizedDescription(
    acquisitionPercentage: number,
    considerationAmount: number,
    recommendedStructure: string
  ): string {
    const amountText = `HKD ${(considerationAmount / 1000000).toFixed(0)}M`;
    return `${acquisitionPercentage}% acquisition for ${amountText} via ${recommendedStructure}`;
  }

  private buildBeforeStructure(
    results: AnalysisResults, 
    acquiringCompanyName: string, 
    targetCompanyName: string
  ) {
    // Use actual shareholding data or intelligent defaults
    const controllingPercentage = results.shareholding?.before?.[0]?.percentage || 65;
    const publicPercentage = 100 - controllingPercentage;

    return {
      entities: [
        { 
          id: 'before-controlling-shareholder', 
          name: results.shareholding?.before?.[0]?.name || 'Controlling Shareholder', 
          type: 'stockholder' as const
        },
        { 
          id: 'before-public-shareholders', 
          name: 'Public Shareholders', 
          type: 'stockholder' as const
        },
        { 
          id: 'before-acquiring-company', 
          name: acquiringCompanyName, 
          type: 'buyer' as const,
          description: 'Listed Entity'
        },
        { 
          id: 'before-target-shareholders', 
          name: 'Existing Target Shareholders', 
          type: 'stockholder' as const
        },
        { 
          id: 'before-target-company', 
          name: targetCompanyName, 
          type: 'target' as const 
        }
      ],
      relationships: [
        {
          source: 'before-controlling-shareholder',
          target: 'before-acquiring-company',
          type: 'ownership' as const,
          percentage: controllingPercentage
        },
        {
          source: 'before-public-shareholders',
          target: 'before-acquiring-company',
          type: 'ownership' as const,
          percentage: publicPercentage
        },
        {
          source: 'before-target-shareholders',
          target: 'before-target-company',
          type: 'ownership' as const,
          percentage: 100
        }
      ]
    };
  }

  private buildAfterStructure(
    results: AnalysisResults,
    acquiringCompanyName: string,
    targetCompanyName: string,
    acquisitionPercentage: number,
    remainingPercentage: number,
    considerationAmount: number,
    optimizationResult?: OptimizationResult
  ) {
    // Use actual shareholding data for controlling structure
    const controllingPercentage = results.shareholding?.before?.[0]?.percentage || 65;
    const publicPercentage = 100 - controllingPercentage;

    const entities = [
      { 
        id: 'after-target-company', 
        name: targetCompanyName, 
        type: 'target' as const 
      },
      { 
        id: 'after-acquiring-company', 
        name: acquiringCompanyName, 
        type: 'buyer' as const
      },
      { 
        id: 'after-remaining-shareholders', 
        name: 'Remaining Target Shareholders', 
        type: 'stockholder' as const
      },
      { 
        id: 'after-controlling-shareholder', 
        name: results.shareholding?.before?.[0]?.name || 'Controlling Shareholder', 
        type: 'stockholder' as const
      },
      { 
        id: 'after-public-shareholders', 
        name: 'Public Shareholders', 
        type: 'stockholder' as const
      },
      { 
        id: 'consideration-payment', 
        name: `HKD ${(considerationAmount / 1000000).toFixed(0)}M Consideration`, 
        type: 'consideration' as const,
        value: considerationAmount,
        currency: 'HKD'
      }
    ];

    // Add optimization insights as entities if available
    if (optimizationResult?.optimizationInsights?.length > 0) {
      entities.push({
        id: 'optimization-insights',
        name: `Optimization: ${optimizationResult.optimizationInsights[0].substring(0, 50)}...`,
        type: 'consideration' as const
      });
    }

    return {
      entities,
      relationships: [
        {
          source: 'after-acquiring-company',
          target: 'after-target-company',
          type: 'ownership' as const,
          percentage: acquisitionPercentage
        },
        {
          source: 'after-remaining-shareholders',
          target: 'after-target-company',
          type: 'ownership' as const,
          percentage: remainingPercentage
        },
        {
          source: 'after-controlling-shareholder',
          target: 'after-acquiring-company',
          type: 'ownership' as const,
          percentage: controllingPercentage
        },
        {
          source: 'after-public-shareholders',
          target: 'after-acquiring-company',
          type: 'ownership' as const,
          percentage: publicPercentage
        },
        {
          source: 'after-acquiring-company',
          target: 'consideration-payment',
          type: 'consideration' as const,
          value: considerationAmount
        }
      ]
    };
  }

  private generateOptimizedTransactionSteps(
    acquiringCompanyName: string,
    acquisitionPercentage: number,
    considerationAmount: number,
    recommendedStructure: string,
    optimizationResult?: OptimizationResult
  ) {
    const steps = [
      {
        id: 'step-1',
        title: 'Due Diligence & Negotiation',
        description: `${acquiringCompanyName} conducts due diligence and negotiates acquisition terms`,
        entities: ['before-acquiring-company', 'before-target-company']
      }
    ];

    // Add optimization-specific step if available
    if (optimizationResult?.recommendedStructure) {
      steps.push({
        id: 'step-2',
        title: optimizationResult.recommendedStructure.name,
        description: optimizationResult.recommendedStructure.description,
        entities: ['before-acquiring-company', 'before-target-company']
      });
    } else {
      steps.push({
        id: 'step-2',
        title: 'Transaction Execution',
        description: `Implementation of ${recommendedStructure}`,
        entities: ['before-acquiring-company', 'before-target-company']
      });
    }

    steps.push({
      id: 'step-3',
      title: 'Completion & Payment',
      description: `Transfer of ${acquisitionPercentage}% ownership and payment of HKD ${(considerationAmount / 1000000).toFixed(0)}M consideration`,
      entities: ['after-acquiring-company', 'after-target-company', 'consideration-payment']
    });

    return steps;
  }
}

export const transactionFlowConverter = new TransactionFlowConverter();
