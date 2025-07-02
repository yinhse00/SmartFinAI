import { ExtractedUserInputs } from './enhancedAiAnalysisService';
import { AnalysisResults } from '@/components/dealStructuring/AIAnalysisResults';
import { InputValidationResult } from './inputValidationService';

export interface AuthorityMarker {
  source: 'user_input' | 'ai_generated' | 'system_default';
  confidence: number;
  timestamp: Date;
  validationApplied: boolean;
}

export interface AuthoritativeData {
  amount?: {
    value: number;
    currency: string;
    authority: AuthorityMarker;
  };
  acquisitionPercentage?: {
    value: number;
    authority: AuthorityMarker;
  };
  targetCompanyName?: {
    value: string;
    authority: AuthorityMarker;
  };
  acquiringCompanyName?: {
    value: string;
    authority: AuthorityMarker;
  };
}

export interface InputAuthorityReport {
  hasUserInputs: boolean;
  protectedFields: string[];
  overriddenFields: string[];
  authorityConflicts: string[];
  finalAuthority: AuthoritativeData;
}

/**
 * Service to enforce user input authority and prevent AI override
 */
export const inputAuthorityService = {
  /**
   * Create authoritative data structure from validated user inputs
   */
  createAuthoritative: (
    validatedInputs: InputValidationResult,
    timestamp = new Date()
  ): AuthoritativeData => {
    console.log('=== CREATING AUTHORITATIVE DATA ===');
    console.log('Validated inputs:', validatedInputs.extractedInputs);
    
    const authoritative: AuthoritativeData = {};
    const userAuthority: AuthorityMarker = {
      source: 'user_input',
      confidence: validatedInputs.confidence,
      timestamp,
      validationApplied: true
    };
    
    // Mark user inputs as authoritative
    if (validatedInputs.extractedInputs.amount) {
      authoritative.amount = {
        value: validatedInputs.extractedInputs.amount,
        currency: validatedInputs.extractedInputs.currency || 'HKD',
        authority: userAuthority
      };
      console.log('✅ Amount marked as authoritative:', authoritative.amount);
    }
    
    if (validatedInputs.extractedInputs.acquisitionPercentage) {
      authoritative.acquisitionPercentage = {
        value: validatedInputs.extractedInputs.acquisitionPercentage,
        authority: userAuthority
      };
      console.log('✅ Acquisition percentage marked as authoritative:', authoritative.acquisitionPercentage);
    }
    
    if (validatedInputs.extractedInputs.targetCompanyName) {
      authoritative.targetCompanyName = {
        value: validatedInputs.extractedInputs.targetCompanyName,
        authority: userAuthority
      };
    }
    
    if (validatedInputs.extractedInputs.acquiringCompanyName) {
      authoritative.acquiringCompanyName = {
        value: validatedInputs.extractedInputs.acquiringCompanyName,
        authority: userAuthority
      };
    }
    
    return authoritative;
  },

  /**
   * Enforce user input authority over AI results
   */
  enforceAuthority: (
    results: AnalysisResults,
    authoritative: AuthoritativeData
  ): { protectedResults: AnalysisResults; report: InputAuthorityReport } => {
    console.log('=== ENFORCING INPUT AUTHORITY ===');
    console.log('Authoritative data:', authoritative);
    console.log('AI results before protection:', {
      dealEconomics: results.dealEconomics?.purchasePrice,
      valuation: results.valuation?.transactionValue?.amount
    });
    
    const protectedResults = JSON.parse(JSON.stringify(results)); // Deep clone
    const protectedFields: string[] = [];
    const overriddenFields: string[] = [];
    const authorityConflicts: string[] = [];
    
    // Enforce amount authority
    if (authoritative.amount) {
      const userAmount = authoritative.amount.value;
      const userCurrency = authoritative.amount.currency;
      
      // Protect dealEconomics
      if (protectedResults.dealEconomics) {
        if (protectedResults.dealEconomics.purchasePrice !== userAmount) {
          console.log(`🛡️ Overriding dealEconomics.purchasePrice: ${protectedResults.dealEconomics.purchasePrice} → ${userAmount}`);
          overriddenFields.push('dealEconomics.purchasePrice');
        }
        protectedResults.dealEconomics.purchasePrice = userAmount;
        protectedResults.dealEconomics.currency = userCurrency;
        protectedFields.push('dealEconomics.purchasePrice', 'dealEconomics.currency');
      }
      
      // Protect valuation
      if (protectedResults.valuation) {
        if (protectedResults.valuation.transactionValue?.amount !== userAmount) {
          console.log(`🛡️ Overriding valuation.transactionValue.amount: ${protectedResults.valuation.transactionValue?.amount} → ${userAmount}`);
          overriddenFields.push('valuation.transactionValue.amount');
        }
        protectedResults.valuation.transactionValue = {
          ...protectedResults.valuation.transactionValue,
          amount: userAmount,
          currency: userCurrency
        };
        protectedResults.valuation.valuationRange = {
          low: userAmount * 0.9,
          high: userAmount * 1.1,
          midpoint: userAmount
        };
        protectedFields.push('valuation.transactionValue', 'valuation.valuationRange');
      }
      
      // Protect transactionFlow if it exists
      if (protectedResults.transactionFlow?.transactionContext) {
        if (protectedResults.transactionFlow.transactionContext.amount !== userAmount) {
          console.log(`🛡️ Overriding transactionFlow.transactionContext.amount: ${protectedResults.transactionFlow.transactionContext.amount} → ${userAmount}`);
          overriddenFields.push('transactionFlow.transactionContext.amount');
        }
        protectedResults.transactionFlow.transactionContext.amount = userAmount;
        protectedResults.transactionFlow.transactionContext.currency = userCurrency;
        protectedFields.push('transactionFlow.transactionContext.amount');
      }
    }
    
    // Enforce acquisition percentage authority
    if (authoritative.acquisitionPercentage) {
      const userPercentage = authoritative.acquisitionPercentage.value;
      
      if (protectedResults.dealEconomics) {
        if (protectedResults.dealEconomics.targetPercentage !== userPercentage) {
          console.log(`🛡️ Overriding dealEconomics.targetPercentage: ${protectedResults.dealEconomics.targetPercentage} → ${userPercentage}`);
          overriddenFields.push('dealEconomics.targetPercentage');
        }
        protectedResults.dealEconomics.targetPercentage = userPercentage;
        protectedFields.push('dealEconomics.targetPercentage');
      }
    }
    
    console.log('✅ Authority enforcement completed:', {
      protectedFields: protectedFields.length,
      overriddenFields: overriddenFields.length,
      finalAmount: protectedResults.dealEconomics?.purchasePrice
    });
    
    const report: InputAuthorityReport = {
      hasUserInputs: Object.keys(authoritative).length > 0,
      protectedFields,
      overriddenFields,
      authorityConflicts,
      finalAuthority: authoritative
    };
    
    return { protectedResults, report };
  },

  /**
   * Create a user input summary for AI prompts
   */
  createInputSummary: (authoritative: AuthoritativeData): string => {
    const summaryParts: string[] = [];
    
    if (authoritative.amount) {
      summaryParts.push(
        `TRANSACTION AMOUNT: ${authoritative.amount.currency} ${authoritative.amount.value.toLocaleString()} (USER SPECIFIED - DO NOT CHANGE)`
      );
    }
    
    if (authoritative.acquisitionPercentage) {
      summaryParts.push(
        `ACQUISITION PERCENTAGE: ${authoritative.acquisitionPercentage.value}% (USER SPECIFIED - DO NOT CHANGE)`
      );
    }
    
    if (authoritative.targetCompanyName) {
      summaryParts.push(
        `TARGET COMPANY: ${authoritative.targetCompanyName.value} (USER SPECIFIED)`
      );
    }
    
    if (authoritative.acquiringCompanyName) {
      summaryParts.push(
        `ACQUIRING COMPANY: ${authoritative.acquiringCompanyName.value} (USER SPECIFIED)`
      );
    }
    
    return summaryParts.length > 0 
      ? `\n🔒 AUTHORITATIVE USER INPUTS (MUST NOT BE MODIFIED):\n${summaryParts.join('\n')}\n`
      : '';
  },

  /**
   * Validate that results respect user input authority
   */
  validateAuthority: (
    results: AnalysisResults,
    authoritative: AuthoritativeData
  ): boolean => {
    if (authoritative.amount) {
      const userAmount = authoritative.amount.value;
      
      if (results.dealEconomics?.purchasePrice && results.dealEconomics.purchasePrice !== userAmount) {
        console.log('❌ Authority violation: dealEconomics.purchasePrice does not match user input');
        return false;
      }
      
      if (results.valuation?.transactionValue?.amount && results.valuation.transactionValue.amount !== userAmount) {
        console.log('❌ Authority violation: valuation.transactionValue.amount does not match user input');
        return false;
      }
    }
    
    if (authoritative.acquisitionPercentage) {
      const userPercentage = authoritative.acquisitionPercentage.value;
      
      if (results.dealEconomics?.targetPercentage && results.dealEconomics.targetPercentage !== userPercentage) {
        console.log('❌ Authority violation: dealEconomics.targetPercentage does not match user input');
        return false;
      }
    }
    
    return true;
  }
};