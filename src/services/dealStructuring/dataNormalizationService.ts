
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ExtractedUserInputs } from './enhancedAiAnalysisService';

export interface NormalizedResults extends AnalysisResults {
  _normalized: boolean;
  _corrections: string[];
}

export class DataNormalizationService {
  private static instance: DataNormalizationService;
  
  static getInstance(): DataNormalizationService {
    if (!DataNormalizationService.instance) {
      DataNormalizationService.instance = new DataNormalizationService();
    }
    return DataNormalizationService.instance;
  }

  /**
   * Centralized normalization of all analysis results
   * This is the single source of truth for data corrections
   */
  normalizeAnalysisResults(
    results: AnalysisResults, 
    userInputs?: ExtractedUserInputs
  ): NormalizedResults {
    console.log('=== DATA NORMALIZATION SERVICE ===');
    console.log('User inputs:', userInputs);
    console.log('Raw results dealEconomics:', results.dealEconomics);
    
    const corrections: string[] = [];
    const normalizedResults = JSON.parse(JSON.stringify(results)) as NormalizedResults;
    
    if (!userInputs) {
      console.log('No user inputs provided, returning results as-is');
      normalizedResults._normalized = true;
      normalizedResults._corrections = corrections;
      return normalizedResults;
    }

    // CRITICAL: Normalize consideration amount across ALL fields
    if (userInputs.amount && userInputs.amount > 0) {
      const targetAmount = userInputs.amount;
      
      // 1. Normalize dealEconomics.purchasePrice
      if (normalizedResults.dealEconomics?.purchasePrice !== targetAmount) {
        const oldValue = normalizedResults.dealEconomics?.purchasePrice;
        if (normalizedResults.dealEconomics) {
          normalizedResults.dealEconomics.purchasePrice = targetAmount;
          corrections.push(`dealEconomics.purchasePrice: ${oldValue} → ${targetAmount}`);
        }
      }
      
      // 2. Normalize valuation.transactionValue.amount
      if (normalizedResults.valuation?.transactionValue?.amount !== targetAmount) {
        const oldValue = normalizedResults.valuation.transactionValue.amount;
        normalizedResults.valuation.transactionValue.amount = targetAmount;
        corrections.push(`valuation.transactionValue.amount: ${oldValue} → ${targetAmount}`);
        
        // Update valuation range to match
        normalizedResults.valuation.valuationRange = {
          low: targetAmount * 0.9,
          high: targetAmount * 1.1,
          midpoint: targetAmount
        };
      }
      
      // 3. CRITICAL: Normalize transactionFlow.transactionContext.amount
      if (normalizedResults.transactionFlow?.transactionContext?.amount !== targetAmount) {
        const oldValue = normalizedResults.transactionFlow?.transactionContext?.amount;
        if (normalizedResults.transactionFlow?.transactionContext) {
          normalizedResults.transactionFlow.transactionContext.amount = targetAmount;
          corrections.push(`transactionFlow.transactionContext.amount: ${oldValue} → ${targetAmount}`);
        }
      }
    }

    // Normalize currency consistency
    if (userInputs.currency) {
      const targetCurrency = userInputs.currency;
      
      if (normalizedResults.dealEconomics?.currency !== targetCurrency) {
        const oldValue = normalizedResults.dealEconomics.currency;
        if (normalizedResults.dealEconomics) {
          normalizedResults.dealEconomics.currency = targetCurrency;
          corrections.push(`dealEconomics.currency: ${oldValue} → ${targetCurrency}`);
        }
      }
      
      if (normalizedResults.valuation?.transactionValue?.currency !== targetCurrency) {
        const oldValue = normalizedResults.valuation.transactionValue.currency;
        normalizedResults.valuation.transactionValue.currency = targetCurrency;
        corrections.push(`valuation.transactionValue.currency: ${oldValue} → ${targetCurrency}`);
      }
      
      if (normalizedResults.transactionFlow?.transactionContext?.currency !== targetCurrency) {
        const oldValue = normalizedResults.transactionFlow?.transactionContext?.currency;
        if (normalizedResults.transactionFlow?.transactionContext) {
          normalizedResults.transactionFlow.transactionContext.currency = targetCurrency;
          corrections.push(`transactionFlow.transactionContext.currency: ${oldValue} → ${targetCurrency}`);
        }
      }
    }

    // Normalize acquisition percentage
    if (userInputs.acquisitionPercentage && userInputs.acquisitionPercentage > 0) {
      const targetPercentage = userInputs.acquisitionPercentage;
      
      if (normalizedResults.dealEconomics?.targetPercentage !== targetPercentage) {
        const oldValue = normalizedResults.dealEconomics?.targetPercentage;
        if (normalizedResults.dealEconomics) {
          normalizedResults.dealEconomics.targetPercentage = targetPercentage;
          corrections.push(`dealEconomics.targetPercentage: ${oldValue} → ${targetPercentage}`);
        }
      }
    }

    // Log all corrections made
    if (corrections.length > 0) {
      console.log('🔧 NORMALIZATION CORRECTIONS APPLIED:');
      corrections.forEach((correction, index) => {
        console.log(`${index + 1}. ${correction}`);
      });
    } else {
      console.log('✅ No corrections needed - data is already consistent');
    }

    normalizedResults._normalized = true;
    normalizedResults._corrections = corrections;
    
    console.log('=== NORMALIZATION COMPLETE ===');
    console.log('Final dealEconomics.purchasePrice:', normalizedResults.dealEconomics?.purchasePrice);
    console.log('Final transactionFlow.transactionContext.amount:', normalizedResults.transactionFlow?.transactionContext?.amount);
    
    return normalizedResults;
  }
}

export const dataNormalizationService = DataNormalizationService.getInstance();
