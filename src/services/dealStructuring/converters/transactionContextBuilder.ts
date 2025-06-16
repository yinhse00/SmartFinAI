
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { OptimizationResult } from '../optimizationEngine';
import { generateTransactionDescription } from '../converterUtils/transactionDetailsBuilder';

export class TransactionContextBuilder {
  static buildTypeSpecificContext(
    results: AnalysisResults, 
    entityNames: any, 
    considerationAmount: number, 
    transactionType: string, 
    optimizationResult?: OptimizationResult
  ) {
    const currency = results.dealEconomics?.currency || 'HKD';
    
    if (transactionType === 'CAPITAL_RAISING') {
      return {
        type: results.transactionType || 'Capital Raising',
        amount: considerationAmount,
        currency,
        targetName: entityNames.issuingCompanyName || entityNames.primaryCompanyName,
        buyerName: '', // Not applicable for capital raising
        description: `${entityNames.issuingCompanyName || entityNames.primaryCompanyName} ${results.structure?.recommended || 'capital raising'} to raise ${currency} ${(considerationAmount / 1000000).toFixed(0)}M`,
        optimizationInsights: optimizationResult?.optimizationInsights || [],
        recommendedStructure: optimizationResult?.recommendedStructure?.structure || results.structure?.recommended,
        optimizationScore: optimizationResult?.recommendedStructure?.optimizationScore
      };
    } else {
      return {
        type: results.transactionType || 'Transaction Analysis',
        amount: considerationAmount,
        currency,
        targetName: entityNames.targetCompanyName || entityNames.secondaryCompanyName || 'Target Company',
        buyerName: entityNames.acquiringCompanyName || entityNames.primaryCompanyName || 'Acquiring Company',
        description: generateTransactionDescription(results, considerationAmount),
        optimizationInsights: optimizationResult?.optimizationInsights || [],
        recommendedStructure: optimizationResult?.recommendedStructure?.structure || results.structure?.recommended,
        optimizationScore: optimizationResult?.recommendedStructure?.optimizationScore
      };
    }
  }
}
