
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { ExtractedUserInputs } from './enhancedAiAnalysisService';

export interface ConsistentDataModel {
  considerationAmount: number;
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
    let source: 'user_input' | 'ai_fallback' | 'default';
    
    if (userInputs?.amount && userInputs.amount > 0) {
      considerationAmount = userInputs.amount;
      source = 'user_input';
      console.log('✅ Using AUTHORITATIVE user input amount:', considerationAmount);
    } else if (analysisResults.dealEconomics?.purchasePrice && analysisResults.dealEconomics.purchasePrice > 0) {
      considerationAmount = analysisResults.dealEconomics.purchasePrice;
      source = 'ai_fallback';
      console.log('⚠️ No user input, using AI fallback amount:', considerationAmount);
    } else {
      considerationAmount = 100000000; // 100M HKD default
      source = 'default';
      console.log('🛡️ Using safe default amount:', considerationAmount);
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
    
    const consistentData: ConsistentDataModel = {
      considerationAmount,
      currency,
      acquisitionPercentage,
      targetCompanyName,
      acquiringCompanyName,
      source
    };
    
    console.log('=== FINAL CONSISTENT DATA MODEL ===');
    console.log('Consideration amount:', consistentData.considerationAmount);
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
