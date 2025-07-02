
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ExtractedUserInputs } from './enhancedAiAnalysisService';

export interface ConsistentDataModel {
  considerationAmount: number;
  targetValuation: number;
  currency: string;
  acquisitionPercentage: number;
  targetCompanyName: string;
  acquiringCompanyName: string;
  source: 'user_input' | 'ai_fallback' | 'default';
}

export class DataConsistencyService {
  private static instance: DataConsistencyService;
  
  static getInstance(): DataConsistencyService {
    if (!DataConsistencyService.instance) {
      DataConsistencyService.instance = new DataConsistencyService();
    }
    return DataConsistencyService.instance;
  }

  /**
   * CRITICAL: Extract consistent data with absolute user input authority
   * This method ensures user inputs can NEVER be overridden by AI responses
   */
  extractConsistentData(
    analysisResults: AnalysisResults, 
    userInputs?: ExtractedUserInputs
  ): ConsistentDataModel {
    console.log('=== DATA CONSISTENCY SERVICE - EXTRACTING AUTHORITATIVE DATA ===');
    console.log('User inputs received:', userInputs);
    console.log('Analysis results dealEconomics:', analysisResults.dealEconomics);
    
    // STEP 1: Extract consideration amount with ABSOLUTE user input priority
    let considerationAmount: number;
    let targetValuation: number;
    let source: 'user_input' | 'ai_fallback' | 'default';
    
    // CRITICAL: Handle target valuation vs consideration properly
    if (userInputs?.targetValuation && userInputs?.acquisitionPercentage) {
      // Calculate consideration from target valuation: Consideration = Target Valuation × Percentage
      targetValuation = userInputs.targetValuation;
      const acquisitionPercentage = userInputs.acquisitionPercentage;
      considerationAmount = targetValuation * (acquisitionPercentage / 100);
      source = 'user_input';
      console.log('✅ CALCULATED consideration from user target valuation:', {
        targetValuation,
        acquisitionPercentage,
        calculatedConsideration: considerationAmount
      });
    } else if (userInputs?.amount && userInputs.amount > 0) {
      considerationAmount = userInputs.amount;
      source = 'user_input';
      console.log('✅ PROTECTED: Using AUTHORITATIVE user input consideration:', considerationAmount);
      
      // CRITICAL: Validate that AI hasn't corrupted user input
      const aiAmounts = [
        analysisResults.dealEconomics?.purchasePrice,
        analysisResults.valuation?.transactionValue?.amount,
        analysisResults.transactionFlow?.transactionContext?.amount
      ].filter(amount => amount && amount > 0);
      
      aiAmounts.forEach((aiAmount, index) => {
        if (aiAmount && Math.abs(aiAmount - userInputs.amount!) > 1000) {
          console.warn(`🚨 DATA CORRUPTION DETECTED in AI field ${index + 1}:`);
          console.warn('User input:', userInputs.amount);
          console.warn('AI amount:', aiAmount);
          console.warn('Using user input as authoritative source');
        }
      });
    } else if (analysisResults.dealEconomics?.purchasePrice && analysisResults.dealEconomics.purchasePrice > 0) {
      considerationAmount = analysisResults.dealEconomics.purchasePrice;
      source = 'ai_fallback';
      console.log('⚠️ No user input, using AI fallback amount:', considerationAmount);
    } else if (analysisResults.valuation?.transactionValue?.amount && analysisResults.valuation.transactionValue.amount > 0) {
      considerationAmount = analysisResults.valuation.transactionValue.amount;
      source = 'ai_fallback';
      console.log('⚠️ No user input, using valuation amount:', considerationAmount);
    } else {
      considerationAmount = analysisResults.transactionFlow?.transactionContext?.amount || 0;
      source = considerationAmount > 0 ? 'ai_fallback' : 'default';
      console.log(`⚠️ Using ${source} amount:`, considerationAmount);
    }
    
    // STEP 2: Extract currency with user input priority
    const currency = userInputs?.currency || analysisResults.dealEconomics?.currency || 'HKD';
    
    // STEP 3: Extract acquisition percentage with user input priority
    const acquisitionPercentage = userInputs?.acquisitionPercentage || 
                                 analysisResults.dealEconomics?.targetPercentage || 
                                 100;
    
    // STEP 4: Extract company names with fallbacks
    const targetCompanyName = userInputs?.targetCompanyName || 
                              this.extractTargetCompanyFromStructure(analysisResults) || 
                              'Target Company';
    
    const acquiringCompanyName = userInputs?.acquiringCompanyName || 
                                this.extractAcquiringCompanyFromStructure(analysisResults) || 
                                'Acquiring Company';
    
    // STEP 5: Calculate target valuation (100% equity interest) if not already set
    if (!targetValuation) {
      targetValuation = acquisitionPercentage > 0 && acquisitionPercentage < 100 
        ? considerationAmount / (acquisitionPercentage / 100)
        : considerationAmount;
    }
    
    console.log('🎯 Target valuation calculation:');
    console.log(`Consideration: ${considerationAmount}, Acquisition %: ${acquisitionPercentage}%`);
    console.log(`Target Valuation (100%): ${targetValuation}`);

    const consistentData: ConsistentDataModel = {
      considerationAmount,
      targetValuation,
      currency,
      acquisitionPercentage,
      targetCompanyName,
      acquiringCompanyName,
      source
    };
    
    console.log('=== FINAL CONSISTENT DATA MODEL ===');
    console.log('Consideration amount:', consistentData.considerationAmount);
    console.log('Target valuation (100%):', consistentData.targetValuation);
    console.log('Currency:', consistentData.currency);
    console.log('Source:', consistentData.source);
    console.log('=== END DATA CONSISTENCY SERVICE ===');
    
    return consistentData;
  }

  /**
   * Enforce data consistency across the entire AnalysisResults object
   * This ensures all fields are synchronized with the authoritative data
   */
  enforceDataConsistency(
    analysisResults: AnalysisResults, 
    userInputs?: ExtractedUserInputs
  ): AnalysisResults {
    console.log('=== ENFORCING DATA CONSISTENCY ACROSS ALL RESULTS ===');
    
    const consistentData = this.extractConsistentData(analysisResults, userInputs);
    
    // Create a deep copy to avoid mutations
    const enforcedResults: AnalysisResults = JSON.parse(JSON.stringify(analysisResults));
    
    // CRITICAL: Enforce consistency in dealEconomics
    if (enforcedResults.dealEconomics) {
      enforcedResults.dealEconomics.purchasePrice = consistentData.considerationAmount;
      enforcedResults.dealEconomics.currency = consistentData.currency;
      enforcedResults.dealEconomics.targetPercentage = consistentData.acquisitionPercentage;
    } else {
      enforcedResults.dealEconomics = {
        purchasePrice: consistentData.considerationAmount,
        currency: consistentData.currency,
        paymentStructure: 'Cash',
        valuationBasis: 'Market Comparables',
        targetPercentage: consistentData.acquisitionPercentage
      };
    }
    
    // CRITICAL: Enforce consistency in valuation
    if (enforcedResults.valuation) {
      enforcedResults.valuation.transactionValue.amount = consistentData.considerationAmount;
      enforcedResults.valuation.transactionValue.currency = consistentData.currency;
      
      // Update valuation range to match
      enforcedResults.valuation.valuationRange = {
        low: consistentData.considerationAmount * 0.9,
        high: consistentData.considerationAmount * 1.1,
        midpoint: consistentData.considerationAmount
      };
    }
    
    // Log the enforcement results
    console.log('✅ Enforced dealEconomics.purchasePrice:', enforcedResults.dealEconomics?.purchasePrice);
    console.log('✅ Enforced valuation.transactionValue.amount:', enforcedResults.valuation?.transactionValue?.amount);
    console.log('=== DATA CONSISTENCY ENFORCEMENT COMPLETE ===');
    
    return enforcedResults;
  }

  /**
   * Validate that data is consistent across all fields
   */
  validateDataConsistency(analysisResults: AnalysisResults): {
    isConsistent: boolean;
    inconsistencies: string[];
  } {
    const inconsistencies: string[] = [];
    
    const dealAmount = analysisResults.dealEconomics?.purchasePrice;
    const valuationAmount = analysisResults.valuation?.transactionValue?.amount;
    
    if (dealAmount && valuationAmount && Math.abs(dealAmount - valuationAmount) > 1000) {
      inconsistencies.push(`Deal amount (${dealAmount}) doesn't match valuation amount (${valuationAmount})`);
    }
    
    const dealCurrency = analysisResults.dealEconomics?.currency;
    const valuationCurrency = analysisResults.valuation?.transactionValue?.currency;
    
    if (dealCurrency && valuationCurrency && dealCurrency !== valuationCurrency) {
      inconsistencies.push(`Deal currency (${dealCurrency}) doesn't match valuation currency (${valuationCurrency})`);
    }
    
    return {
      isConsistent: inconsistencies.length === 0,
      inconsistencies
    };
  }

  private extractTargetCompanyFromStructure(results: AnalysisResults): string | null {
    const targetEntity = results.corporateStructure?.entities?.find(e => e.type === 'target');
    return targetEntity?.name || null;
  }

  private extractAcquiringCompanyFromStructure(results: AnalysisResults): string | null {
    const acquiringEntity = results.corporateStructure?.entities?.find(e => 
      e.type === 'parent' || e.type === 'issuer'
    );
    return acquiringEntity?.name || null;
  }
}

export const dataConsistencyService = DataConsistencyService.getInstance();
